# Roadmap operativo sin cambios de BD

## Objetivo
Implementar una primera capa de `bloqueos + bandejas + timeline` sin modificar la estructura de la base de datos.

## Alcance de esta versión
- `Bloqueos derivados` calculados desde datos ya existentes de la factura.
- `Bandejas` y filtros rápidos apoyados en esos bloqueos.
- `Timeline` de actividad por factura usando `audit_events`.
- Eliminación del uso operativo de `adjuntos` como criterio de completitud.

## Reglas derivadas actuales
La UI trata como bloqueos operativos:

- `Sin OC`
- `Sin fecha estimada`
- `Sin gestor asignado`

Estas reglas se calculan en tiempo de ejecución con campos que ya existen en la entidad `Invoice`.

## Timeline
El timeline se apoya en la tabla existente `audit_events` y muestra actividad como:

- creación de factura
- actualización de factura
- gestión completada

No requiere nuevas tablas ni nuevas relaciones.

## Decisión de producto
`Adjuntos` no se consideran soporte operativo.

La funcionalidad puede permanecer en backend por compatibilidad, pero deja de participar en:

- faltantes críticos
- bloqueos
- tarjetas del dashboard
- copy principal de la experiencia

## Referencias externas utilizadas
Estas referencias guiaron la idea funcional, adaptada al alcance real del sistema:

- Oracle Payables, dashboards y gestión de excepciones:
  https://docs.oracle.com/cd/E26401_01/doc.122/e48760/T295436T672079.htm
- Dynamics 365 Finance, vendor invoices workspace:
  https://learn.microsoft.com/en-us/dynamics365/finance/accounts-payable/vendor-invoices-workspace
- Dynamics 365 Finance, vendor invoice automation:
  https://learn.microsoft.com/en-us/dynamics365/finance/accounts-payable/vendor-invoice-automation
- Coupa, workflows y approvals:
  https://compass.coupa.com/en-us/products/product-documentation/total-spend-management-platform/workflows-and-approvals/process-automator
- Coupa, flujo de facturas:
  https://compass.coupa.com/en-us/products/product-documentation/supplier-resources/for-suppliers/coupa-supplier-portal/set-up-the-csp/invoices/create-or-edit-an-invoice
- Ivalua, colaboración y seguimiento:
  https://www.ivalua.com/solutions/business/supplier-collaboration-innovation/

## Restricciones explícitas
- No modificar la estructura de la base de datos.
- No introducir migraciones nuevas.
- No tratar archivos adjuntos como soporte obligatorio.
