# Lo que NO se hace

## Frontera de cliente (regla de origen)

- **Cero referencias al producto del que era clon el esqueleto retirado**: su nombre, su stack de autenticacion, su tipografia, sus textos o su configuracion. El panel se fundo desde cero con `vmh-website` como referencia estructural. (Enforzado por `lint:terminology`.)
- El directorio `_referencia-esqueleto-landlord` puede leerse como referencia de **forma**. No se copia de ahi codigo, historial, textos ni configuracion.

## Codigo

- Sin `any`, sin `// @ts-ignore`, sin `// @ts-expect-error` sin justificacion documentada.
- Sin emojis en codigo, comentarios, JSDoc, textos de interfaz ni nombres de archivo. (Enforzado por `lint:terminology`.)
- Sin `console.log` en codigo de produccion. `console.error` solo en `catch` (y en el aviso de configuracion del plugin `env-check`) con prefijo identificable.
- Sin `@example` en JSDoc.
- Sin archivos `.md` documentales nuevos salvo que el usuario lo pida explicitamente.
- Sin commits ni push automaticos. El usuario los autoriza explicitamente.
- Sin saltarse los hooks de git con `--no-verify`.

## Arquitectura

- **Sin hablar con el API fuera de `infrastructure/`.** Todo pasa por `useApi()`; el cliente HTTP crudo solo vive en los repositorios y en el propio `useApi()`. (Enforzado por ESLint.)
- Sin `domain/` que importe de `application/` o `infrastructure/`. (Enforzado por ESLint.)
- Sin logica de negocio en `script.ts`.
- Sin adelantar trabajo de otra HU. Si el spec dice que algo llega despues, no se escribe hoy "porque ya estaba ahi".
- Sin `ssr: true`. El panel es una SPA detras de sesion; no hay SEO que ganar.

## Reglas de negocio

- **El panel no implementa logica de negocio que el API no tenga.** Si una validacion, un calculo o una regla no existe en el servidor, no se implementa aqui "mientras tanto": se reporta. El frontend muestra y envia; el API decide.
- Los importes, descuentos y ahorros **se pintan como los devuelve el servidor**. El panel nunca los recalcula.
- Sin escribir la marca con sufijo ni dominios derivados: la decision IMPI sigue abierta y toda mencion sale de `PANEL_BRAND_NAME`. (Enforzado por `lint:terminology`.)

## Sesion y seguridad

- Sin omitir la renovacion single-flight: dos renovaciones concurrentes con el mismo token revocan la familia completa de la sesion en el servidor.
- Sin guardar la contrasena en estado, en almacenamiento ni en logs.
- Sin mostrar `key` ni `code` del error del API a la persona. Se registran; se muestra `title` y `detail`.
- Sin rutas protegidas que no pasen por el guardia global.
- Sin asumir que un rol desconocido tiene permiso: la puerta se abre por lista, no por descarte.

## Interfaz

- Sin clases utilitarias legacy (`btn`, `btn-block`, `btn-primary`, `form-control`, `box`, `card`). (Enforzado por ESLint.)
- Sin CSS suelto sobre clases internas de PrimeVue dentro de una pagina: se corrige el preset.
- Sin importar iconos de `@tabler/icons-vue`. SVG directo con `currentColor`. (Enforzado por ESLint.)
- Sin tema oscuro.
- Sin `size="large"` heredado del esqueleto: la densidad del panel la fija el preset.
- Sin entregar una vista con datos sin sus cinco estados.
- Sin entregar un slice con logica (helpers, composables, repositorios) o un componente con comportamiento **sin su test** colocado.
