# Diagramas de Arquitectura (Azure) - Ti Garantias

Este directorio contiene 5 vistas complementarias de la arquitectura.
Estado validado contra Azure real: **2026-04-02**.

## Diagramas

1. **Ejecutivo (v1)**
   Archivo: `azure-architecture-v1-executive.svg`
   Muestra la vista de alto nivel: flujo principal `Usuario -> FE -> BE -> PostgreSQL`, seguridad base y CI/CD resumido.

2. **Tecnico detallado (v2)**
   Archivo: `azure-architecture-v2-technical.svg`
   Separa flujos por carriles (datos, control/secretos, observabilidad, CI/CD) y detalla rutas entre servicios.

3. **Inventario por Resource Group (v3)**
   Archivo: `azure-architecture-v3-inventory.svg`
   Lista recursos por RG (`tfstate`, `NetworkWatcher`, `shared`, `dev`) y dependencias principales entre ellos.

4. **Full detail clean routing (v4)**
   Archivo: `azure-architecture-v4-detailed-clean.svg`
   Vista operativa completa con rutas limpias y conexiones explicitas entre FE/BE, Key Vault, observabilidad y despliegue.

5. **C4 (v5)**
   Archivo: `azure-architecture-v5-c4.svg`
   Presenta la solucion en niveles C1/C2/C3: contexto, contenedores y componentes backend.

## Iconografia

- Los iconos de servicios Azure usados en los diagramas estan en `docs/icons/azure/`.
- Incluye iconos para: Subscription, Resource Groups, Container Apps, Managed Environment, Key Vault, Managed Identity, PostgreSQL, Log Analytics, VM, red y Storage.

## Orden recomendado de lectura

`v1 -> v3 -> v2 -> v4 -> v5`

## Glosario rapido (FE, BE y observabilidad)

1. **FE (Frontend)**
   - Es la aplicacion que usa el usuario en el navegador.
   - Recurso actual: `tigarantias-dev-fe` (publico, puerto 80).

2. **BE (Backend)**
   - Es la API interna que procesa reglas de negocio y datos.
   - Recurso actual: `tigarantias-dev-be` (interno, puerto 8080).

3. **Flujo principal de la app**
   - `Usuario -> FE -> BE -> PostgreSQL`
   - El FE llama al BE (`/api`) y el BE guarda/consulta en PostgreSQL.

4. **Grafana y conexiones de monitoreo**
   - `Grafana` (`ti-garantias-grafana`): muestra dashboards.
   - `Prometheus` (`ti-garantias-prometheus`): guarda metricas.
   - `cAdvisor` (`ti-garantias-cadvisor`): expone metricas de host/contenedores.
   - `Promtail` (`ti-garantias-promtail`): envia logs.
   - `Loki` (`ti-garantias-loki`): guarda logs.

5. **Rutas de observabilidad del stack en VM**
   - `cAdvisor -> Prometheus -> Grafana` (metricas)
   - `Promtail -> Loki -> Grafana` (logs)

6. **Observabilidad total en la solucion**
   - Azure nativo: `Container Apps Environment -> Log Analytics Workspace`
   - Stack en VM (shared-rg): `Grafana + Prometheus + Loki + Promtail + cAdvisor`
