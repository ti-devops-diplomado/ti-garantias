# Jenkins en VM de Azure

La estrategia recomendada para este piloto es:

- una `VM Linux` pequena en Azure
- `Docker` en la VM
- `Jenkins` corriendo como contenedor
- el `Jenkinsfile` del repo como pipeline de CD

## Stack de Jenkins

El servicio `jenkins` ya esta preparado en [deploy/docker-compose.yml](/e:/DMC/garantias-integrador/ti-garantias/deploy/docker-compose.yml) bajo el perfil `ci`.

La imagen personalizada de Jenkins queda en:

- [Dockerfile](/e:/DMC/garantias-integrador/ti-garantias/deploy/jenkins/Dockerfile)
- [plugins.txt](/e:/DMC/garantias-integrador/ti-garantias/deploy/jenkins/plugins.txt)

Esa imagen trae:

- `Docker CLI`
- `Docker Compose plugin`
- `Terraform`
- `Azure CLI`
- `Node.js 22`
- `.NET SDK 8`
- `git` y utilitarios base

## Alcance del `docker-compose`

El archivo [deploy/docker-compose.yml](/e:/DMC/garantias-integrador/ti-garantias/deploy/docker-compose.yml) ya concentra tres usos del proyecto:

- aplicacion completa local
- monitoreo con `Prometheus`, `Grafana`, `Loki`, `Promtail` y `cAdvisor`
- `Jenkins` como runner de CD bajo el perfil `ci`

Servicios principales:

- `db`
  - base PostgreSQL local para desarrollo y pruebas manuales
- `backend`
  - API ASP.NET Core con montaje persistente para adjuntos
- `frontend`
  - SPA servida por `nginx` con proxy al backend
- `prometheus`
  - recolector de metricas para stack local o cloud segun `PROMETHEUS_CONFIG_PATH`
- `cadvisor`
  - metricas de contenedores Docker de la VM o del host local
- `grafana`
  - visualizacion de metricas y logs
- `loki`
  - almacenamiento de logs del stack Docker observado por `promtail`
- `promtail`
  - descubrimiento y envio de logs de contenedores Docker
- `jenkins`
  - runner de CI/CD construido desde `deploy/jenkins/Dockerfile`

Reglas practicas de uso:

- para desarrollo local se levantan `db`, `backend` y `frontend`
- para observabilidad local o cloud se agregan `prometheus`, `grafana`, `loki`, `promtail` y `cadvisor`
- para CD en Azure se levanta `jenkins` con `--profile ci`

## Como levantar Jenkins en la VM

Una vez creada la VM:

```bash
git clone <repo-url> /opt/ti-garantias/app
cd /opt/ti-garantias/app
export JENKINS_PORT=8080
docker compose -f deploy/docker-compose.yml --profile ci up -d --build jenkins
```

## Credenciales esperadas en Jenkins

- `azure-client-id`
- `azure-client-secret`
- `azure-subscription-id`
- `azure-tenant-id`
- `ti-garantias-registry`
- `ti-garantias-dev-pg-admin-password`
- `ti-garantias-dev-jwt-secret`
- `ti-garantias-dev-unique-suffix`
- `ti-garantias-test-pg-admin-password`
- `ti-garantias-test-jwt-secret`
- `ti-garantias-test-unique-suffix`
- `ti-garantias-prod-pg-admin-password`
- `ti-garantias-prod-jwt-secret`
- `ti-garantias-prod-unique-suffix`

### Convencion recomendada para `unique-suffix`

Para este piloto se recomienda una convencion institucional del proyecto, no personalizada por usuario:

- `ti-garantias-dev-unique-suffix` = `tgd1`
- `ti-garantias-test-unique-suffix` = `tgt1`
- `ti-garantias-prod-unique-suffix` = `tgp1`

Justificacion:

- el nombre del ambiente ya diferencia `dev`, `test` y `prod`
- cada sufijo sigue representando a `ti-garantias`, pero haciendo visible el ambiente
- evita usar un sufijo ligado a una persona
- si Azure reporta colision futura de nombres, el siguiente valor recomendado es mantener el patron y subir el numero, por ejemplo `tgd2`, `tgt2` y `tgp2`

Opcionales si el ambiente usa SMTP autenticado:

- `ti-garantias-dev-smtp-password`
- `ti-garantias-test-smtp-password`
- `ti-garantias-prod-smtp-password`

## Variables de entorno esperadas para el backend remoto de Terraform

- `TFSTATE_RESOURCE_GROUP`
- `TFSTATE_STORAGE_ACCOUNT`
- `TFSTATE_CONTAINER`

## Permisos del service principal de Jenkins

El principal usado por Jenkins necesita:

- administrar recursos ARM del proyecto
- escribir secretos en `Key Vault`
- leer o actualizar el estado remoto de Terraform

En la ejecucion real tambien se confirmo que Jenkins necesita permisos suficientes para crear `role assignments` sobre `Key Vault` durante el bootstrap. En la practica, eso implico otorgar al principal un rol como:

- `User Access Administrator`
- o `Owner`

segun el scope operativo definido para el piloto.

## Nota sobre Docker Hub

Para que el despliegue de `Container Apps` funcione, las imagenes primero deben publicarse en `Docker Hub` o en el registry elegido.

El flujo correcto es:

1. `build`
2. `push`
3. `terraform plan/apply`

No es `pull` hacia Docker Hub; es `push` desde Jenkins hacia tu repositorio de imagenes.

## Estado operativo actual

Al cierre de esta iteracion Jenkins ya pudo completar el despliegue de `dev` de extremo a extremo:

- build de backend y frontend
- push de imagenes a Docker Hub
- bootstrap de `Key Vault` y PostgreSQL
- `terraform plan`
- `terraform apply`

Ambiente validado:

- `dev`

## Runbook corto de operacion

### Reconstruir Jenkins despues de cambios en `main`

En la VM:

```bash
cd /opt/ti-garantias/app
git fetch origin
git checkout main
git pull origin main
export JENKINS_PORT=8080
docker compose -f deploy/docker-compose.yml --profile ci up -d --build jenkins
docker logs --tail 50 ti-garantias-jenkins
```

Resultado esperado:

- el log termina con `Jenkins is fully up and running`

### Ejecutar despliegue del ambiente `dev`

Parametros recomendados del job `ti-garantias-main > main`:

- `ENVIRONMENT = dev`
- `TERRAFORM_ACTION = apply`
- `PUSH_IMAGES = true`
- `REGISTRY_SERVER = docker.io`
- `REGISTRY_NAMESPACE = gjrbdev`

### Levantar monitoreo fase 1 en la VM compartida

La fase 1 de monitoreo en cloud usa la misma VM compartida y no depende de ejecutar el backend local ni de tocar PostgreSQL.

Preparacion:

```bash
cd /opt/ti-garantias/app
cp deploy/env/monitoring-cloud.env.example deploy/env/monitoring-cloud.env
```

Levantamiento:

```bash
docker compose --env-file deploy/env/monitoring-cloud.env -f deploy/docker-compose.yml up -d prometheus grafana loki promtail cadvisor
```

Acceso esperado:

- `Grafana`: `http://<ip-publica-vm>:3000`
- `Prometheus`: `http://<ip-publica-vm>:9090`

La configuracion cloud de Prometheus usa:

- [prometheus.cloud.yml](/e:/DMC/garantias-integrador/ti-garantias/deploy/monitoring/prometheus.cloud.yml)

Y scrapea el endpoint:

- `https://tigarantias-dev-fe.mangobay-9146375d.centralus.azurecontainerapps.io/metrics`

Nota de alcance:

- en esta fase `Prometheus` observa metricas del backend cloud a traves del frontend publico
- `Loki` y `Promtail` siguen observando contenedores Docker de la VM compartida
- los logs nativos de `Azure Container Apps` siguen consultandose en `Log Analytics`

### Validar resultado

- revisar que el build termine exitoso en Jenkins
- revisar revisiones de `tigarantias-dev-fe` y `tigarantias-dev-be`
- validar acceso al frontend
- validar login con `admin@demo.local / AdminTemporal123!`

## Incidencias reales resueltas en el pipeline

Durante la puesta en marcha real se resolvieron estas incidencias:

- soporte `ansiColor` faltante en Jenkins
- autenticacion Azure faltante en `Terraform quality`
- propagacion de `enable_key_vault_secret_references` en roots `dev/test/prod`
- mayor verbosidad en `dotnet publish` para evitar timeouts del runner
- fallback de `postgresql_admin_username` durante el bootstrap
- homologacion de region a `centralus`
- drift de `zone` en PostgreSQL Flexible Server
- correccion del `Host` reenviado por el frontend al backend interno
- exposicion de `/metrics` en el frontend para permitir scrape desde Prometheus en la VM compartida
- registro de `Microsoft.App` y `Microsoft.OperationalInsights` en la suscripcion
