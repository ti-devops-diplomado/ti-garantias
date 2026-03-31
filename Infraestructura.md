# Infraestructura

## Jerarquia de recursos

```mermaid
flowchart TD
    JenkinsVM[Jenkins VM<br/>Azure Linux VM]
    Jenkins[Jenkins Container]
    Registry[Container Registry<br/>Docker Hub o ACR]
    RemoteState[Terraform Remote State<br/>Azure Storage]

    Azure[Suscripcion Azure]

    JenkinsVM --> Jenkins
    Jenkins --> Registry
    Jenkins --> RemoteState
    Jenkins --> Azure

    Azure --> SharedRG[RG shared]

    subgraph SHARED[Base compartida]
        SharedRG --> SharedVNet[VNet shared]
        SharedRG --> SharedNSG[NSG Jenkins]
        SharedRG --> SharedPIP[Public IP]
        SharedRG --> SharedVM[Jenkins VM]
        SharedVM --> Jenkins
        SharedVNet --> SharedVM
        SharedNSG --> SharedVM
        SharedPIP --> SharedVM
    end

    Azure --> DevRG[RG dev]
    Azure --> TestRG[RG test]
    Azure --> ProdRG[RG prod]

    subgraph DEV[Ambiente dev]
        DevRG --> DevLAW[Log Analytics Workspace]
        DevRG --> DevCAE[Container Apps Environment]
        DevRG --> DevKV[Key Vault]
        DevRG --> DevSA[Storage Account]
        DevRG --> DevPG[PostgreSQL Flexible Server]
        DevRG --> DevMI[Managed Identity<br/>Container Apps]

        DevSA --> DevShare[Azure File Share<br/>attachments]
        DevCAE --> DevStorage[Environment Storage]
        DevStorage --> DevShare

        DevCAE --> DevFE[Container App frontend]
        DevCAE --> DevBE[Container App backend]
        DevKV --> DevBE
        DevKV --> DevFE
        DevMI --> DevKV

        DevFE --> DevBE
        DevBE --> DevPG
        DevBE --> DevShare
        DevCAE --> DevLAW
    end

    subgraph TEST[Ambiente test]
        TestRG --> TestLAW[Log Analytics Workspace]
        TestRG --> TestCAE[Container Apps Environment]
        TestRG --> TestKV[Key Vault]
        TestRG --> TestSA[Storage Account]
        TestRG --> TestPG[PostgreSQL Flexible Server]
        TestRG --> TestMI[Managed Identity<br/>Container Apps]

        TestSA --> TestShare[Azure File Share<br/>attachments]
        TestCAE --> TestStorage[Environment Storage]
        TestStorage --> TestShare

        TestCAE --> TestFE[Container App frontend]
        TestCAE --> TestBE[Container App backend]
        TestKV --> TestBE
        TestKV --> TestFE
        TestMI --> TestKV

        TestFE --> TestBE
        TestBE --> TestPG
        TestBE --> TestShare
        TestCAE --> TestLAW
    end

    subgraph PROD[Ambiente prod]
        ProdRG --> ProdLAW[Log Analytics Workspace]
        ProdRG --> ProdCAE[Container Apps Environment]
        ProdRG --> ProdKV[Key Vault]
        ProdRG --> ProdSA[Storage Account]
        ProdRG --> ProdPG[PostgreSQL Flexible Server]
        ProdRG --> ProdMI[Managed Identity<br/>Container Apps]

        ProdSA --> ProdShare[Azure File Share<br/>attachments]
        ProdCAE --> ProdStorage[Environment Storage]
        ProdStorage --> ProdShare

        ProdCAE --> ProdFE[Container App frontend]
        ProdCAE --> ProdBE[Container App backend]
        ProdKV --> ProdBE
        ProdKV --> ProdFE
        ProdMI --> ProdKV

        ProdFE --> ProdBE
        ProdBE --> ProdPG
        ProdBE --> ProdShare
        ProdCAE --> ProdLAW
    end

    Registry -. imagenes .-> DevFE
    Registry -. imagenes .-> DevBE
    Registry -. imagenes .-> TestFE
    Registry -. imagenes .-> TestBE
    Registry -. imagenes .-> ProdFE
    Registry -. imagenes .-> ProdBE
```

## Resumen

- Cada ambiente tiene su propio `Resource Group`.
- Dentro de cada ambiente se crean recursos aislados para `frontend`, `backend`, base de datos, adjuntos y logs.
- Los secretos de aplicacion viven en `Azure Key Vault` y se consumen desde `Container Apps` por `managed identity`.
- `Jenkins` corre dentro de una VM Linux pequena en Azure y desde ahi construye, publica imagenes y ejecuta Terraform.
- El `remote state` de Terraform vive en `Azure Storage`, separado de la app, para que el pipeline y el equipo compartan la misma referencia de infraestructura.
- El backend consume credenciales y cadenas sensibles como secretos del runtime del contenedor.
- Los adjuntos no quedan en disco efimero: se guardan en `Azure Files`.

## Region Operativa del Piloto

Para mantener consistencia y evitar restricciones de oferta por region, el piloto queda homologado en:

- `shared` -> `centralus`
- `dev` -> `centralus`
- `test` -> `centralus`
- `prod` -> `centralus`

## Convencion de Sufijos por Ambiente

Para el valor `unique-suffix` usado por el pipeline y por Terraform se adopto una convencion propia del proyecto, no asociada a un usuario individual.

Valores recomendados:

- `dev` -> `tgd1`
- `test` -> `tgt1`
- `prod` -> `tgp1`

Como explicarlo:

- el nombre del ambiente ya separa `dev`, `test` y `prod`
- cada sufijo mantiene la referencia al proyecto `ti-garantias` y hace visible el ambiente
- si en el futuro Azure reporta colision de nombres globales, el siguiente valor a usar es `tgd2`, `tgt2` y `tgp2`

## Justificacion del Remote State

- `Terraform` necesita un archivo de estado para saber que recursos ya existen y cuales debe crear, modificar o conservar.
- Si ese archivo quedara solo en una maquina local, el proyecto dependeria de esa maquina para seguir desplegando.
- Como en este piloto existe un `Jenkins` central y varios ambientes, el estado debe vivir en un punto compartido y confiable.
- `Azure Storage` cumple ese rol y permite que tanto el pipeline como un operador manual usen la misma fuente de verdad.
- El backend remoto no guarda imagenes Docker; las imagenes viven en `Docker Hub` o `ACR`. Aqui solo se guarda el estado de Terraform.

## Idea clave para exposicion

- El repositorio guarda el codigo de la infraestructura.
- Azure Storage guarda la memoria de esa infraestructura.
- Jenkins usa ambas cosas para automatizar despliegues repetibles a `shared`, `dev`, `test` y `prod`.

## Detalle del Stack Shared

El stack `shared` es la base comun del proyecto y su objetivo es alojar un unico `Jenkins` central.

Recursos que aplica Terraform en `shared`:

- `Resource Group` para separar la infraestructura comun de los ambientes de la aplicacion.
- `Virtual Network` y `Subnet` para dar contexto de red a la VM.
- `Network Security Group` para controlar acceso por `SSH` y por la UI de Jenkins.
- `Public IP` para exponer la VM y permitir administracion remota.
- `Network Interface` para conectar la VM con su red y su IP publica.
- `Linux Virtual Machine` como host de Docker y de Jenkins.

Valores clave del piloto:

- VM `Standard_B2s_v2`
- Ubuntu `22.04 LTS`
- autenticacion por llave `SSH`
- Jenkins expuesto por puerto `8080`

### Como explicarlo en la exposicion

- primero se despliega una capa compartida de automatizacion
- esa capa no es parte de `dev`, `test` o `prod`; es la plataforma que los opera
- Jenkins vive en una sola VM y desde ahi ejecuta el pipeline de despliegue para todos los ambientes
- esto evita duplicar servidores de CI/CD y centraliza la automatizacion del proyecto

Frase sugerida:

- “Primero desplegamos una capa compartida de automatizacion. Esa capa crea la VM unica de Jenkins con su red, seguridad e IP publica. Luego, desde ese Jenkins, desplegamos los ambientes `dev`, `test` y `prod`.”

### Alcance del stack shared

El stack `shared` no despliega la aplicacion ni su base de datos.

Solo prepara:

- el host de Jenkins
- la conectividad de red
- la seguridad minima de acceso
- la exposicion publica necesaria para operar el pipeline

## Incidencia de Cuota y Capacidad

Durante el despliegue real del stack `shared` aparecieron restricciones propias de Azure que fue necesario resolver antes de crear la VM:

- falta de capacidad del SKU `Standard_B2s` en `eastus`
- incompatibilidad de arquitectura al probar un SKU `Arm64`
- cuota `0` para la familia `Bsv2` en la suscripcion

Resolucion aplicada:

- se destruyo la base parcial de `eastus`
- se reprovisiono el intento en `centralus`
- se solicito aumento de cuota para `Standard Bsv2 Family vCPUs` a `2`
- tras la aprobacion de cuota, la VM `tigarantias-jenkins-vm` se aprovisiono correctamente

Como explicarlo:

- “Durante la ejecucion real validamos que en Azure no solo importa el codigo de Terraform. Tambien influyen la disponibilidad regional de los SKUs y las cuotas aprobadas por familia de maquinas virtuales. Ajustamos region y cuota hasta completar el despliegue sin perder el control del estado.”

## Incidencia de PostgreSQL y Permisos RBAC

Durante la primera ejecucion del pipeline de `dev` aparecieron dos bloqueos adicionales:

- `Azure Database for PostgreSQL Flexible Server` no pudo aprovisionarse en `eastus` para esta suscripcion y devolvio `LocationIsOfferRestricted`
- el service principal usado por Jenkins no tenia permiso para ejecutar `roleAssignments/write` sobre `Key Vault`

Resolucion definida:

- mover los stacks de aplicacion `dev`, `test` y `prod` a `centralus`
- mantener `shared` tambien en `centralus`
- otorgar al service principal de Jenkins el rol `User Access Administrator` o `Owner` sobre la suscripcion o sobre los scopes de despliegue

Como explicarlo:

- “Una vez superada la fase de bootstrap del pipeline, el siguiente bloqueo real vino de la plataforma: PostgreSQL no podia desplegarse en `East US` para esta suscripcion y Jenkins no tenia privilegios para crear asignaciones RBAC en Key Vault. Estandarizamos la region a `Central US` y ajustamos el rol del service principal para completar la automatizacion.”

## Preparacion del Host Jenkins

Una vez creada la VM compartida, el siguiente paso fue prepararla para ejecutar contenedores y operar el pipeline:

- acceso a la VM por `SSH` con llave
- instalacion de `Docker`
- habilitacion del usuario administrador para usar Docker sin `sudo`

Frase sugerida:

- “Una vez aprovisionada la VM compartida, el siguiente paso fue prepararla como host de contenedores instalando Docker y habilitando su uso para el usuario administrador.”

## Estado Actual del Piloto

Al cierre de esta iteracion el ambiente `dev` quedo desplegado y operativo en `Azure Container Apps`.

Estado confirmado:

- `shared` desplegado en `centralus`
- `Jenkins` operativo en la VM compartida
- `dev` desplegado en `centralus`
- `frontend` publico activo
- `backend` interno activo
- `PostgreSQL Flexible Server` operativo
- `Key Vault`, `Log Analytics`, `Storage Account` y `Azure File Share` creados

Recursos relevantes del ambiente `dev`:

- Resource Group: `tigarantias-dev-rg`
- Frontend publico: `https://tigarantias-dev-fe.mangobay-9146375d.centralus.azurecontainerapps.io`
- Backend interno: `https://tigarantias-dev-be.internal.mangobay-9146375d.centralus.azurecontainerapps.io`
- Container Apps Environment: `tigarantias-dev-cae`
- Log Analytics Workspace: `tigarantias-dev-law`
- Key Vault: `tigarantiasdevtgd1kv`
- PostgreSQL Flexible Server: `tigarantias-dev-pg-tgd1`

Acceso funcional de demostracion:

- usuario: `admin@demo.local`
- clave temporal: `AdminTemporal123!`

Importante:

- el backend no se expone publicamente; el acceso esperado es `navegador -> frontend -> proxy nginx -> backend interno`
- el frontend publica `/api`, `/swagger`, `/hangfire` y `/health` por proxy hacia el backend

## Ajustes Reales Descubiertos en la Ejecucion

Durante el despliegue real no basto con el diseno inicial. Fue necesario ajustar codigo, permisos y prerequisitos de Azure:

- agregar `ansicolor` a Jenkins para soportar `ansiColor('xterm')` en el pipeline
- propagar `enable_key_vault_secret_references` en los roots `dev`, `test` y `prod`
- inyectar credenciales Azure al stage `Terraform quality`
- aumentar la verbosidad de `dotnet publish` para evitar timeouts de Jenkins durante el build del backend
- homologar `shared`, `dev`, `test` y `prod` a `centralus`
- ignorar drift de `zone` en PostgreSQL Flexible Server
- corregir el proxy del frontend para reenviar `Host` como `$proxy_host` hacia el backend interno
- registrar en la suscripcion los providers `Microsoft.App` y `Microsoft.OperationalInsights`

## Requisitos Operativos de Azure

El despliegue funcional de `dev` dejo confirmados estos prerequisitos fuera del codigo:

- cuota disponible para la familia de VM usada por Jenkins
- service principal de Jenkins con permisos suficientes para crear `role assignments` sobre `Key Vault`
- suscripcion registrada para:
  - `Microsoft.App`
  - `Microsoft.OperationalInsights`

Comandos usados para registrar los providers:

```powershell
az account set --subscription "0fea1ea0-c233-413b-b838-4da0e883596d"
az provider register --namespace Microsoft.App --wait
az provider register --namespace Microsoft.OperationalInsights --wait
```

## Operacion del Piloto

Checklist minima de operacion para `dev`:

- validar `frontend` cargando la URL publica
- validar login con el usuario demo
- revisar `health` y `swagger` a traves del frontend
- verificar ultimo build exitoso de Jenkins
- revisar estado de revisiones en `Container Apps`
- revisar logs de backend y frontend ante cualquier incidente

Monitoreo fase 1 en cloud:

- `Grafana` y `Prometheus` corren en la VM compartida de Azure
- `Prometheus` scrapea `https://tigarantias-dev-fe.mangobay-9146375d.centralus.azurecontainerapps.io/metrics`
- el frontend publica `/metrics` y lo proxyea hacia el backend interno
- `Grafana` consulta a `Prometheus` para metricas
- los logs de `Container Apps` siguen consultandose en `Log Analytics` durante esta fase

Proteccion de datos en esta fase:

- esta iteracion de monitoreo no modifica recursos de base de datos
- no cambia `PostgreSQL Flexible Server`, su base, ni sus secretos
- el objetivo es sumar observabilidad sin recrear infraestructura de datos

Comandos utiles de operacion:

```powershell
az containerapp show --name tigarantias-dev-fe --resource-group tigarantias-dev-rg --query "{provisioningState:properties.provisioningState,runningStatus:properties.runningStatus,latestReadyRevisionName:properties.latestReadyRevisionName}" --output table
az containerapp show --name tigarantias-dev-be --resource-group tigarantias-dev-rg --query "{provisioningState:properties.provisioningState,runningStatus:properties.runningStatus,latestReadyRevisionName:properties.latestReadyRevisionName}" --output table
az containerapp revision list --name tigarantias-dev-fe --resource-group tigarantias-dev-rg --output table
az containerapp revision list --name tigarantias-dev-be --resource-group tigarantias-dev-rg --output table
```

## Como explicar la arquitectura operativa

Frase sugerida:

- “El ambiente `dev` quedo desplegado con frontend publico y backend interno. El frontend expone la experiencia de usuario y hace proxy al backend dentro del mismo Container Apps Environment. Jenkins construye las imagenes, publica en Docker Hub y Terraform aplica la infraestructura en Azure usando estado remoto compartido.”

## Flujo CI/CD

```mermaid
flowchart LR
    Dev[Desarrollador]
    Repo[Repositorio Git]
    GHCI[GitHub Actions CI]
    SharedVM[Azure VM Jenkins]
    Jenkins[Jenkins CD]
    Registry[Container Registry<br/>Docker Hub o ACR]
    TFState[Terraform Remote State]

    Dev --> Repo
    Repo --> GHCI
    Repo --> SharedVM
    SharedVM --> Jenkins

    subgraph CI[CI]
        GHCI --> CITests[Backend tests]
        GHCI --> CIBuild[Frontend build]
        GHCI --> CIInfra[Terraform fmt + validate]
    end

    subgraph CD[CD]
        Jenkins --> BuildImages[Build backend/frontend images]
        BuildImages --> PushImages[Push a Docker Hub/ACR]
        PushImages --> Registry
        Jenkins --> Bootstrap[Bootstrap Key Vault + PostgreSQL base]
        Bootstrap --> SyncSecrets[Sync secretos a Key Vault]
        Jenkins --> TFInit[Terraform init]
        SyncSecrets --> TFPlan[Terraform plan]
        TFInit --> TFPlan[Terraform plan]
        TFPlan --> TFApply[Terraform apply]
        TFInit --> TFState
        TFApply --> TFState
    end

    Registry --> DevDeploy[Deploy dev]
    Registry --> TestDeploy[Deploy test]
    Registry --> ProdDeploy[Deploy prod]

    TFApply --> DevDeploy
    TFApply --> TestDeploy
    TFApply --> ProdDeploy

    DevDeploy --> DevApps[Azure recursos dev]
    TestDeploy --> TestApps[Azure recursos test]
    ProdDeploy --> ProdApps[Azure recursos prod]
```

## Resumen CI/CD

- `GitHub Actions` queda como CI de validacion continua.
- `Jenkins` queda como CD parametrizado por ambiente, corriendo en una VM Linux de Azure.
- El pipeline construye imagenes inmutables, las publica al registry, crea la base minima para secretos, sincroniza `Key Vault` y luego aplica Terraform.
- `prod` tiene compuerta manual antes del `apply`.
