# Estructura canonica de una page del panel

> Esta regla define la **forma** del top de las pantallas que listan registros
> (catalogo, personas, reservas, pagos). Nace de la operacion real del panel:
> recepcion entra a una lista, la acota y actua sobre lo que quedo. Separar
> "que veo" de "que hago con lo que veo" es lo que hace que saltar de una
> pantalla a otra no cueste trabajo.

## Resumen

```
NuxtLayout (default)
├── h1 de la vista                      <- uno por pagina, no lo pone el encabezado
├── Card #1 (controles primarios)       <- grid de 2 columnas en escritorio
│   ├── Izquierda: buscador + disparador del cajon de filtros
│   └── Derecha:   controles de visualizacion (SelectButton, DatePicker)
├── Card #2 (acciones)                  <- flex row, alineado a la derecha
│   ├── (opcional, izquierda) metadata: conteo de registros, fecha de corte
│   └── Botones de alta y disparadores de cajones
├── Contenido (lista, tarjetas o tabla) <- con sus cinco estados
└── (cajon derecho) Filtros secundarios <- oculto por defecto
```

## Card #1 — Controles primarios

Grid de dos columnas en escritorio (`grid-template-columns: 1fr 1fr`) que colapsa a una bajo `--bp-lg-down`. La particion responde a la pregunta del usuario: "que quiero ver" a la izquierda, "como lo quiero ver" a la derecha.

### Columna izquierda — buscador y filtros

- **Buscador** (siempre visible, nunca dentro del cajon): `input-box` con `<InputText>` dentro de `<IconField>` + `<InputIcon>` con el SVG de lupa. Es el filtro que la persona espera ver al entrar.
  - Sin boton "Buscar" al lado: se ejecuta con `@keypress.enter` o con `watch` + debounce si dispara peticion.
  - Ancho: `width: 100%` con `max-width: 35rem`; en movil, `max-width: 100%`.
- **Disparador del cajon de filtros**: lo expone el propio componente `<page>FiltersDrawer`, no la page. Boton fantasma con icono de embudo, `:aria-label` y tooltip.

#### Alineacion vertical del disparador

El buscador lleva label arriba, asi que es mas alto que un boton suelto y en un flex row el boton queda alineado al top, visualmente roto. Patron canonico: el wrapper del disparador, dentro del componente del cajon, usa `display: contents` en su raiz y `align-items: flex-end` en el `__trigger`, para que el boton baje al ras del campo.

```scss
.<page>-filters-drawer {
  display: contents; // el wrapper desaparece; el trigger queda hermano del buscador

  &__trigger {
    display: flex;
    align-items: flex-end;
  }
}
```

### Columna derecha — controles de visualizacion

Controles que cambian **como** se muestra lo filtrado: `<SelectButton>` de modo de vista, `<DatePicker>` de periodo, alternadores que reconfiguran el layout.

**Pages sin columna derecha**: el Card #1 se queda en una sola columna con el bloque izquierdo. Documentar con un comentario corto en el SCSS.

### Que se queda fuera del cajon

Solo tres cosas: el buscador, el alternador de modo de visualizacion cuando reconfigura toda la pantalla, y el selector de periodo asociado a ese modo. **Cualquier otro filtro vive en el cajon.**

## Card #2 — Acciones

Flex row alineado a la derecha con lo que la persona **hace** con el conjunto filtrado.

- **Metadata opcional a la izquierda** (conteo de registros, fecha del ultimo corte): elemento con `margin-right: auto`.
- **Cada cajon secundario expone su propio disparador**: se importa el componente del cajon y vive solo en el Card. No se declara el boton en el template de la page.
- **Text vs icon-only**: el boton de alta lleva icono + texto (uno por page, tipicamente); el resto son icon-only con tooltip y `aria-label`. Si hay mas de dos botones con texto, la mayoria deberian ser icon-only: el ruido textual obliga a leer en lugar de escanear.
- **Jerarquia**: una sola accion primaria por vista (MASTER 2.1). El resto son secundarias o fantasma. Ver `components.md` para las variantes.

## Cajon de filtros secundarios

Todos los filtros que no sean el buscador ni los controles de visualizacion viven en un cajon derecho, oculto por defecto.

- Es un slice propio: `app/components/<page>FiltersDrawer/` con arquitectura hexagonal completa.
- Cada filtro entra como un `<div class="input-box">` con su label y su control de PrimeVue.
- Cada filtro se enlaza con `v-model:<filtro>` y devuelve el cambio al padre: **la page conserva el estado canonico**.
- Se monta siempre (sin `v-if`, sin `Lazy`) y se controla con `v-model:visible` — ver el bug conocido de `<Drawer>` en `components.md`.

## Contenido

- **La tabla es la vista principal del panel**, no una excepcion: cabecera sticky, filas de 44px, separadores solo horizontales, acciones al final de la fila, cifras y fechas a la derecha con `tabular-nums`.
- Sin datos → estado vacio **dentro** del cuerpo de la tabla, no un mensaje suelto arriba.
- En movil la tabla se convierte en lista de tarjetas. **No** se scrollea horizontalmente una tabla de ocho columnas en un telefono.
- Los cinco estados (default / cargando / vacio / error / exito) son parte del alcance de la pantalla, no un extra.

## Bitacora visible

Toda operacion de override (cambiar un precio, cancelar una reserva ajena, mover un pago) muestra **quien y cuando** (MASTER 11.3). Si el API devuelve el autor del cambio, la pantalla lo pinta; si no lo devuelve, se escala, no se omite.

## Orden de implementacion

1. Crear el slice de la page con su estructura hexagonal completa.
2. Card #1 (buscador + controles) y Card #2 (acciones).
3. Extraer los filtros secundarios a `<page>FiltersDrawer/`.
4. Contenido con sus cinco estados.
5. Locales del slice al 100% de las claves usadas.
6. Tests colocados de helpers, composables y repositorios.
