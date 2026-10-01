# Estructura canonica de una page del panel

> Esta regla define la **forma** de las pantallas que listan registros
> (catalogo, personas, reservas, pagos). Nace de la operacion real del panel:
> recepcion entra a una lista, la acota y actua sobre lo que quedo. Desde el
> rediseño VMH-31 la pantalla se lee en tres franjas compactas y alineadas a una
> sola reticula: encabezado, barra y lista. La pantalla modelo es
> `app/pages/bookings/`.

## Resumen

```
NuxtLayout (default)
├── pageHeader                          <- eyebrow del area + unico h1 + apoyo + acciones
├── Card de barra (una linea)           <- buscador, filtros, periodo, vista y conteo
├── Contenido: Card is-flush            <- encabezado de columnas + filas en reticula
└── (cajon derecho) Filtros secundarios <- oculto por defecto
```

## Encabezado: `pageHeader`

- Toda pantalla con sesion abre con `app/components/pageHeader/`: `eyebrow` (el area del menu: Catalogo, Sitio, Operacion, Personas), `title` (pinta el `h1` con el punto final en el acento) y `support` (una linea de apoyo).
- **La accion principal de la pantalla va en el slot `actions`** (alta de registro, registrar un cobro), a la derecha del titulo. Es la unica primaria de la vista.
- Los avisos de alcance (por ejemplo "ves solo tus sesiones") van en el slot `note`.
- Los textos los aporta la pantalla desde SU `domain/locales/`.

## Barra: una sola Card en una linea

Lo que antes eran dos tarjetas (controles y acciones) es una sola barra. En escritorio cabe en una linea (`flex-wrap: nowrap` desde el punto en que entra) y en angosto se reparte en varias.

Orden de izquierda a derecha: **que quiero ver** (buscador, disparador del cajon de filtros), **cuando** (fecha, recorrido anterior/hoy/siguiente), el **resumen** (ventana y conteo, con `margin-inline-start: auto` si empuja a la derecha) y **como lo quiero ver** (`SelectButton` de vista) al final.

- **Buscador**: `input-box` con `<InputText>` en `<IconField>` + `<InputIcon>`. Su `<label>` se queda con clase `visually-hidden`: el lector lo anuncia y la barra no crece. Sin boton "Buscar": `@keypress.enter` o `watch` + debounce.
- **Disparador del cajon de filtros**: lo expone el propio `<page>FiltersDrawer`, boton fantasma con icono de embudo, `aria-label` y tooltip, centrado en la barra.
- **Separador** opcional entre grupos: linea vertical de 1px con `--color-border`.
- Excepcion documentada: si un selector sin rotulo no se distingue de otro (dos que dicen "Todos"), conserva su etiqueta visible y la barra se alinea al pie de los campos.

## Contenido: lista de columnas

- **Una sola Card `is-flush`** (modificador global de `_primevue-overrides.scss`): el relleno lo ponen las filas, que van de borde a borde.
- **Encabezado de columnas** (`__columns`, `aria-hidden`): etiqueta del sitio (`--font-display`, `--app-fs-label`, `--tracking-label`, caja alta) sobre `--color-neutral-50`.
- **Filas en CSS grid** con la **misma variable de columnas** que el encabezado: columnas de dato con ancho fijo y la principal `minmax(8rem, 1fr)`, asi el sobrante del ancho completo se lo lleva la columna que lo necesita. **Ningun carril `auto`**: en el encabezado mide cero y rompe la alineacion.
- Fila de `--app-row-h` (42px), separador de 1px solo horizontal, hover a `--color-neutral-50` dentro de `@media (hover: hover)`.
- La reticula entra cuando cabe: suma los anchos fijos y elige `--bp-lg` o `--bp-xl`. Por debajo, cada registro se apila dentro de la misma Card.
- Agrupar (por dia, por estado): franja dentro de la misma Card, no otra tarjeta.
- Estado: punto de color + texto (`::before` de 6px con `currentcolor`). Nunca solo color.
- Acciones por fila: `variant="text" severity="secondary"`; destructivas con texto.
- Si la lista ya es `DataTable`, el preset y `_primevue-overrides.scss` le dan la misma piel; no se convierte a grid.
- Sin datos: estado vacio **dentro** de la Card. En movil la lista no se scrollea de lado.

## Cajon de filtros secundarios

Todos los filtros que no sean el buscador ni los controles de visualizacion viven en un cajon derecho, oculto por defecto.

- Es un slice propio: `app/components/<page>FiltersDrawer/` con arquitectura hexagonal completa.
- Cada filtro entra como un `<div class="input-box">` con su label y su control de PrimeVue.
- Cada filtro se enlaza con `v-model:<filtro>` y devuelve el cambio al padre: **la page conserva el estado canonico**.
- Se monta siempre (sin `v-if`, sin `Lazy`) y se controla con `v-model:visible` — ver el bug conocido de `<Drawer>` en `components.md`.

## Bitacora visible

Toda operacion de override (cambiar un precio, cancelar una reserva ajena, mover un pago) muestra **quien y cuando** (MASTER 11.3). Si el API devuelve el autor del cambio, la pantalla lo pinta; si no lo devuelve, se escala, no se omite.

## Orden de implementacion

1. Crear el slice de la page con su estructura hexagonal completa.
2. `pageHeader` con su accion principal y la barra de una linea.
3. Extraer los filtros secundarios a `<page>FiltersDrawer/`.
4. Contenido en Card `is-flush` con sus cinco estados.
5. Locales del slice al 100% de las claves usadas.
6. Tests colocados de helpers, composables y repositorios.
