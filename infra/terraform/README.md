# Terraform Azure

Base de infraestructura para desplegar `ti-garantias` en Azure con tres ambientes:

- `dev`
- `test`
- `prod`

Y una base compartida para automatizacion:

- `shared` para la VM de Jenkins

Region operativa recomendada para el piloto:

- `shared`: `centralus`
- `dev`: `centralus`
- `test`: `centralus`
- `prod`: `centralus`

## Arquitectura propuesta

- `Azure Container Apps` para frontend y backend
- `Azure Database for PostgreSQL Flexible Server` para persistencia
- `Azure Key Vault` para secretos operativos
- `Azure Files` para adjuntos persistentes
- `Log Analytics Workspace` para observabilidad básica de Container Apps
- `Azure Linux VM` pequeña para alojar Jenkins sobre Docker

El frontend se expone públicamente y hace proxy al backend para evitar acoplar el `apiBaseUrl` a una URL fija por ambiente.

## Estructura

```text
infra/terraform/
  modules/jenkins_host/        # VM compartida para Jenkins
  modules/pilot_environment/   # stack reusable por ambiente
  env/shared/                  # root module jenkins/ci
  env/dev/                     # root module dev
  env/test/                    # root module test
  env/prod/                    # root module prod
```

## Estado remoto

Cada ambiente declara:

```hcl
terraform {
  backend "azurerm" {}
}
```

La configuración real del backend remoto no se guarda en el repo. Puedes inicializar así:

```powershell
terraform -chdir=infra/terraform/env/dev init `
  -backend-config="resource_group_name=<rg-tfstate>" `
  -backend-config="storage_account_name=<sttfstate>" `
  -backend-config="container_name=tfstate" `
  -backend-config="key=ti-garantias-dev.tfstate"
```

Para la VM de Jenkins:

```powershell
terraform -chdir=infra/terraform/env/shared init `
  -backend-config="resource_group_name=<rg-tfstate>" `
  -backend-config="storage_account_name=<sttfstate>" `
  -backend-config="container_name=tfstate" `
  -backend-config="key=ti-garantias-shared.tfstate"
```

### Por que el `tfstate` vive en Azure y no en una maquina local

En este proyecto el estado de Terraform se guarda en `Azure Storage` porque la infraestructura ya no depende de una sola maquina ni de un solo operador.

Beneficios:

- `Jenkins` y un operador humano pueden usar el mismo estado real de la infraestructura.
- evita perder el control del despliegue si cambia el equipo desde el que se ejecuta Terraform.
- permite trabajar con una arquitectura multiambiente (`shared`, `dev`, `test`, `prod`) de forma consistente.
- reduce el riesgo de recrear recursos por error cuando Terraform se ejecuta desde otro lugar.
- es una buena practica de `IaC` para escenarios con `CI/CD`.

En terminos simples para exposicion:

- el codigo define la infraestructura
- el `tfstate` guarda la memoria de lo que ya fue creado
- al estar en Azure, esa memoria queda centralizada y disponible para el pipeline y para el equipo

### Que guarda el backend remoto

El backend remoto no guarda imagenes Docker ni archivos de la aplicacion.

Guarda unicamente:

- el archivo de estado de Terraform
- metadatos de los recursos creados
- la referencia de que recurso ya existe y cual debe actualizarse

Las imagenes Docker viven en un `container registry` como `Docker Hub` o `Azure Container Registry`.

## Variables sensibles y secretos

No se deben guardar en `terraform.tfvars`. Jenkins debe inyectarlas como variables `TF_VAR_*`:

- `TF_VAR_postgresql_admin_password`
- `TF_VAR_jwt_secret`
- `TF_VAR_registry_password` si el registry es privado

Terraform crea el `Key Vault`, la managed identity y los permisos de lectura para Container Apps. Jenkins carga los valores reales al vault con `az keyvault secret set`.

Secretos esperados en el vault:

- `connection-string`
- `jwt-secret`
- `postgresql-admin-password`
- `registry-password` si el registry es privado
- `smtp-password` si el ambiente usa correo autenticado

## Flujo esperado con Jenkins

1. Levantar la VM `shared` de Jenkins.
2. Clonar el repo en la VM o activar `bootstrap_jenkins`.
3. Levantar Jenkins en Docker con `deploy/docker-compose.yml` perfil `ci`.
4. Ejecutar pruebas de backend y build de frontend.
5. Construir imágenes con tag inmutable.
6. Publicar imágenes en Docker Hub o ACR.
7. Crear por Terraform la base mínima para `Key Vault` y PostgreSQL.
8. Cargar o rotar secretos en `Key Vault`.
9. Ejecutar `terraform plan`.
10. Ejecutar `terraform apply` para el ambiente objetivo.

El `Jenkinsfile` del repo ya queda alineado con este flujo.

## Que aplica el stack `shared`

El stack `infra/terraform/env/shared` crea la base comun de automatizacion del proyecto. No despliega la aplicacion; despliega el host desde el cual luego operara `Jenkins`.

Recursos principales:

- `Resource Group`: `tigarantias-shared-rg`
- `Virtual Network`: `tigarantias-shared-vnet`
- `Subnet`: `jenkins-subnet`
- `Network Security Group`: `tigarantias-jenkins-nsg`
- `Public IP`: `tigarantias-jenkins-pip`
- `Network Interface`: `tigarantias-jenkins-nic`
- `Linux Virtual Machine`: `tigarantias-jenkins-vm`

Explicacion por recurso:

- `Resource Group`
  - agrupa toda la infraestructura compartida de Jenkins
  - separa la base de automatizacion de los ambientes `dev`, `test` y `prod`
- `Virtual Network` y `Subnet`
  - crean la red privada donde vive la VM
  - dejan preparada una estructura minima pero ordenada de red
- `Network Security Group`
  - define las reglas de acceso entrante
  - en este piloto se habilitan `SSH` por puerto `22` y la interfaz de `Jenkins` por puerto `8080`
- `Public IP`
  - expone la VM para acceso remoto
  - permite abrir la UI de Jenkins y conectarse por `SSH`
- `Network Interface`
  - conecta la VM con la subnet y la IP publica
- `Linux Virtual Machine`
  - hospeda Docker y el contenedor de Jenkins
  - es el servidor central desde el que se ejecutaran los despliegues multiambiente

Valores importantes del piloto:

- tamano de VM: `Standard_B2s_v2`
- sistema operativo: `Ubuntu 22.04 LTS`
- autenticacion: solo por llave `SSH`
- acceso web de Jenkins: puerto `8080`

### Como explicarlo en exposicion

Puedes resumirlo asi:

- primero se crea una base compartida de automatizacion
- esa base consiste en una VM Linux con red, seguridad e IP publica
- sobre esa VM corre Jenkins en Docker
- Jenkins luego se conecta al repositorio, construye imagenes y despliega a `dev`, `test` y `prod`

### Incidente real durante el despliegue

Durante la creacion de la VM de Jenkins no basto con tener el codigo correcto de Terraform. Azure tambien exigio revisar dos restricciones reales de plataforma:

- disponibilidad del SKU en la region
- cuota aprobada por familia de VM en la suscripcion

Problemas encontrados:

- `Standard_B2s` no tenia capacidad disponible en `eastus`
- `Standard_B2ps_v2` era `Arm64` y no era compatible con la imagen `Ubuntu 22.04 Gen2 x64`
- `Standard_D2s_v5` y `Standard_B2s_v2` quedaron bloqueadas inicialmente por cuota `0`

Resolucion aplicada:

- se destruyo la base parcial creada en `eastus`
- se reprovisiono el stack `shared` en `centralus`
- se solicito aumento de cuota para la familia `Bsv2` en `centralus` a `2` vCPU
- una vez aprobada la cuota, Terraform completo la creacion de la VM compartida de Jenkins

Aprendizaje clave para exposicion:

- en Azure no solo importa el codigo de infraestructura
- tambien importan la capacidad regional y las cuotas por familia de VM
- Terraform permitio corregir la estrategia sin perder el control del estado ni rehacer todo manualmente

## Incidencias Reales en los Ambientes de Aplicacion

Durante la primera ejecucion del pipeline sobre `dev` aparecieron dos restricciones reales adicionales:

- `Azure Database for PostgreSQL Flexible Server` quedo bloqueado en `eastus` con el error `LocationIsOfferRestricted`
- el service principal de Jenkins no tenia permisos para ejecutar `Microsoft.Authorization/roleAssignments/write` al intentar asignar roles sobre `Key Vault`

Resolucion aplicada para el codigo:

- se homologo la region por defecto de `dev`, `test` y `prod` a `centralus`
- se mantuvo `shared` alineado en `centralus`

Accion operativa requerida fuera del repo:

- otorgar al service principal de Jenkins el rol `User Access Administrator` o `Owner` sobre la suscripcion o sobre los resource groups objetivo, para que Terraform pueda crear `role assignments` en `Key Vault`

Como explicarlo:

- “Durante la automatizacion real del despliegue detectamos una restriccion regional para PostgreSQL en `East US` y una restriccion de permisos RBAC para Jenkins. La solucion fue homologar la region operativa a `Central US` y elevar el rol del service principal para permitir asignaciones sobre Key Vault.”

## Estado actual de `dev`

El ambiente `dev` quedo desplegado y funcionando en `centralus`.

Estado confirmado:

- `frontend` publico en Azure Container Apps
- `backend` interno en Azure Container Apps
- `PostgreSQL Flexible Server` operativo
- `Key Vault` con secretos del runtime
- `Log Analytics Workspace` operativo
- `Storage Account` y `Azure File Share` para adjuntos

Referencias utiles:

- frontend: `https://tigarantias-dev-fe.mangobay-9146375d.centralus.azurecontainerapps.io`
- backend interno: `https://tigarantias-dev-be.internal.mangobay-9146375d.centralus.azurecontainerapps.io`
- usuario demo: `admin@demo.local`
- clave temporal: `AdminTemporal123!`

## Resource Providers requeridos

Antes de desplegar `Container Apps`, la suscripcion debe tener registrados estos providers:

- `Microsoft.App`
- `Microsoft.OperationalInsights`

Comandos de registro:

```powershell
az account set --subscription "0fea1ea0-c233-413b-b838-4da0e883596d"
az provider register --namespace Microsoft.App --wait
az provider register --namespace Microsoft.OperationalInsights --wait
```

Validacion:

```powershell
az provider show --namespace Microsoft.App --query registrationState --output tsv
az provider show --namespace Microsoft.OperationalInsights --query registrationState --output tsv
```

El resultado esperado en ambos casos es:

```text
Registered
```

## Notas operativas del modulo `pilot_environment`

Aprendizajes que quedaron incorporados al codigo:

- `backend_external_enabled = false` mantiene el backend como servicio interno
- el frontend publica el sitio y proxyea `/api`, `/swagger`, `/hangfire` y `/health`
- se ignora drift de `zone` en PostgreSQL Flexible Server porque Azure puede asignarla automaticamente
- el pipeline hace un bootstrap inicial de `Key Vault` y PostgreSQL con `-target` y luego ejecuta `plan/apply` completo
- si el output `postgresql_admin_username` no aparece despues del bootstrap, Jenkins usa como fallback `tigarantiasadmin`

## Operacion basica

Comandos utiles para revisar salud del ambiente:

```powershell
az containerapp show --name tigarantias-dev-fe --resource-group tigarantias-dev-rg --query "{provisioningState:properties.provisioningState,runningStatus:properties.runningStatus,latestReadyRevisionName:properties.latestReadyRevisionName}" --output table
az containerapp show --name tigarantias-dev-be --resource-group tigarantias-dev-rg --query "{provisioningState:properties.provisioningState,runningStatus:properties.runningStatus,latestReadyRevisionName:properties.latestReadyRevisionName}" --output table
az containerapp revision list --name tigarantias-dev-fe --resource-group tigarantias-dev-rg --output table
az containerapp revision list --name tigarantias-dev-be --resource-group tigarantias-dev-rg --output table
```

Smoke test sugerido:

1. abrir la URL publica del frontend
2. iniciar sesion con `admin@demo.local`
3. validar que `/api/auth/login` responde a traves del frontend
4. abrir `/swagger/index.html` desde el frontend
5. validar CRUD basico y carga de adjuntos

## Monitoreo fase 1 en cloud

Para la primera fase de monitoreo en Azure se adopta una estrategia pragmatica:

- `Grafana` y `Prometheus` se ejecutan en la VM compartida
- `Prometheus` scrapea el endpoint `/metrics` del frontend publico
- el frontend reenvia `/metrics` al backend interno dentro del mismo `Container Apps Environment`
- los logs operativos del ambiente siguen viendose en `Log Analytics`

Archivos preparados para esta fase:

- [docker-compose.yml](/e:/DMC/garantias-integrador/ti-garantias/deploy/docker-compose.yml)
- [prometheus.cloud.yml](/e:/DMC/garantias-integrador/ti-garantias/deploy/monitoring/prometheus.cloud.yml)
- [monitoring-cloud.env.example](/e:/DMC/garantias-integrador/ti-garantias/deploy/env/monitoring-cloud.env.example)

## Nota sobre integridad de datos

La fase 1 de monitoreo no toca recursos persistentes de aplicacion.

No modifica:

- `PostgreSQL Flexible Server`
- base de datos `ti_garantias`
- `Key Vault`
- `Storage Account` o `Azure Files`

Su objetivo es sumar observabilidad sin provocar recreaciones de infraestructura de datos.

## Deuda tecnica ya identificada

Actualmente `azurerm_storage_share.attachments` usa `storage_account_name`, propiedad marcada como deprecada por el provider.

Pendiente recomendado:

- migrar a `storage_account_id` antes de subir a `azurerm` v5

### Preparacion del host Jenkins

Una vez creada la VM compartida, el siguiente paso operativo fue prepararla como host de contenedores:

- acceso administrativo por `SSH` usando llave publica/privada
- instalacion de `Docker`
- habilitacion del usuario administrador para operar Docker sin `sudo`

Frase sugerida:

- “Una vez aprovisionada la VM compartida, el siguiente paso fue prepararla como host de contenedores instalando Docker y habilitando su uso para el usuario administrador.”

### Que no hace el stack `shared`

El stack `shared` no crea:

- `Container Apps`
- `PostgreSQL`
- `Key Vault` de la aplicacion
- `Azure Files` de adjuntos
- `frontend` o `backend`

Todo eso pertenece a los stacks de aplicacion por ambiente:

- `infra/terraform/env/dev`
- `infra/terraform/env/test`
- `infra/terraform/env/prod`
