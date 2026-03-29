# ti-garantias

Mono-repo para el Portal Interno de Garantías/Retenciones y Devolución de TI.

## Estructura

```text
ti-garantias/
  frontend/                 Angular + Angular Material
  backend/                  ASP.NET Core Web API .NET 8 + EF Core + Hangfire
  deploy/                   Docker Compose, monitoreo y base Jenkins local
  infra/terraform/          Esqueleto para futura infraestructura Azure
  docs/                     Documentación funcional/técnica
  VERSION                   Versión base del repo
```

## Stack

- Frontend: Angular 20 + Angular Material
- Backend: ASP.NET Core Web API .NET 8
- Base de datos: PostgreSQL 16
- Autenticación: JWT + RBAC con tablas `users`, `roles`, `user_roles`
- Jobs: Hangfire
- Monitoreo: Prometheus + Grafana + Loki
- Contenedores: Docker Compose

## Convenciones importantes

- No usar `latest`.
- Las imágenes de aplicación soportan tags inmutables con formato `v<version>-<sha7>`.
- En esta versión inicial:
  - `VERSION`: `0.1.0`
  - tag por defecto backend/frontend: `v0.1.0-b538348`
- Los adjuntos se guardan en volumen Docker, no en la base de datos.

## Arranque local

1. Copiar la plantilla de variables:

```powershell
Copy-Item deploy/env/dev.env.example deploy/env/dev.env
```

2. Levantar todo:

```powershell
docker compose --env-file deploy/env/dev.env -f deploy/docker-compose.yml up -d --build
```

Si el puerto `5432` ya está ocupado en Windows, cambia `POSTGRES_PORT=5433` en `deploy/env/dev.env`.

3. Ver logs si hace falta:

```powershell
docker compose --env-file deploy/env/dev.env -f deploy/docker-compose.yml logs -f backend
```

4. Apagar:

```powershell
docker compose --env-file deploy/env/dev.env -f deploy/docker-compose.yml down
```

## URLs locales

- Frontend: http://localhost:4200
- Backend Swagger: http://localhost:8080/swagger
- Health: http://localhost:8080/health
- Metrics: http://localhost:8080/metrics
- Prometheus: http://localhost:9090
- Grafana: http://localhost:3000
- Dashboard Grafana (carpeta `TI Garantias`): `TI Garantias - Health (Realtime)`
- Jenkins local opcional: `docker compose --profile ci ...` en http://localhost:8081
- Loki : http://localhost:3100/ready (para verificar en la maquina local)
         http://loki:3100 (para configurar enGrafana)
## Credenciales demo

- Usuario admin: `admin@demo.local`
- Contraseña temporal: `AdminTemporal123!`
- Grafana:
  - usuario: `admin`
  - contraseña: `admin123`

## Funcionalidad inicial disponible

- Login JWT.
- `GET /health` y `GET /metrics`.
- CRUD inicial para:
  - proveedores
  - contratos
  - entregables
  - facturas
- Asociación N:M entre factura y entregables del mismo contrato.
- Gestión de devolución para Gestor/Admin.
- Carga de adjuntos en `/data/attachments`.
- Auditoría básica en `core.audit_events`.
- Job diario Hangfire para estados y notificaciones.

## Validación rápida

```powershell
docker compose --env-file deploy/env/dev.env -f deploy/docker-compose.yml ps
Invoke-WebRequest http://localhost:8080/health
Invoke-WebRequest |http://localhost:8080/metrics
```

Validación funcional sugerida:

1. Ingresar al frontend con el usuario admin.
2. Crear un proveedor.
3. Crear un contrato para ese proveedor.
4. Crear un entregable del contrato.
5. Crear una factura con formato `999-999-999999999`.
6. Asociar la factura al entregable.
7. Marcar la gestión de devolución.
8. Adjuntar un PDF o JPG.

## Notas

- Los secretos reales no deben guardarse en el repo. Solo existen plantillas `.example`.
- PostgreSQL usa el schema `core`.
- Los adjuntos viven en el volumen `attachments_data`.
- `deploy/k8s/` e `infra/terraform/` quedan listos para la siguiente fase hacia Azure AKS + ACR.
