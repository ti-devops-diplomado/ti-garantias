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

## Nota sobre Docker Hub

Para que el despliegue de `Container Apps` funcione, las imagenes primero deben publicarse en `Docker Hub` o en el registry elegido.

El flujo correcto es:

1. `build`
2. `push`
3. `terraform plan/apply`

No es `pull` hacia Docker Hub; es `push` desde Jenkins hacia tu repositorio de imagenes.
