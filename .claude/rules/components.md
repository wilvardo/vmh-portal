# Componentes

> La marca VMH es **light-first** y **no tiene tema oscuro** (MASTER 4.3). El
> panel usa **densidad alta** (VMH-31, `app/assets/design-system/_density.scss`):
> control de 32px, fila de tabla de 42px,
> padding de card 16-20px, cuerpo de 14px. La densidad es lo unico que cambia
> entre las tres superficies de la plataforma; color, tipografia, radios, motion
> e iconografia son identicos.

## Prioridad al escribir interfaz

Antes de escribir HTML directo, recorrer esta cadena en orden:

1. **Componente propio del proyecto.** Revisar `app/components/`. Si existe algo que cubra la necesidad, importarlo. Si casi sirve, evaluar extenderlo con una prop o un slot antes de crear uno nuevo.
2. **Componente de PrimeVue.** Si no hay nada propio, usar el equivalente de la libreria (`<Button>`, `<Card>`, `<Drawer>`, `<Select>`, `<DataTable>`, `<Message>`, `<Skeleton>`, `<Toast>`). Esta integrado por `@primevue/nuxt-module` y respeta el preset de VMH.
3. **HTML propio.** Solo si los dos pasos anteriores no aplican.

## Preset, no parches (regla dura)

**Ningun componente de PrimeVue se estiliza con CSS suelto dentro de una pagina.** Si la apariencia no es la correcta:

1. Se corrige `theme/primevue-preset.ts`.
2. Si el preset no alcanza a expresarlo, el ajuste global vive en `app/assets/design-system/_primevue-overrides.scss`, comentado y justificado contra el MASTER.

Un slice que apunta a una clase interna de Prime (`.p-button`, `.p-inputtext`) desde su `style.scss` esta mal: se rompe en cada actualizacion de la libreria y la correccion no llega al resto de las pantallas.

## Boton canonico

El boton de VMH tiene cuatro variantes (MASTER 12.1) y **una sola accion primaria por vista**:

| Variante | Como se escribe | Uso |
|---|---|---|
| Primario | `<Button :label="..." />` | Accion principal. **Una por vista.** |
| Secundario | `<Button variant="outlined" severity="secondary" />` | Accion alterna |
| Fantasma | `<Button variant="text" severity="secondary" />` | Accion terciaria, dentro de tablas y cards |
| Destructivo | `<Button variant="outlined" severity="danger" />` | Eliminar, cancelar. Solido rojo **solo** dentro del modal de confirmacion |

- La forma pill, la geometrica de la marca, la caja alta del primario y la altura de 32px las dan el preset y `_primevue-overrides.scss`. **No se declara `size`**: el preset ya esta calibrado a la densidad del panel. `size="small"` solo en filas densas de tabla, documentado con un comentario.
- Estado de carga: `:loading` + `:aria-busy` y el texto cambia a gerundio ("Guardando…"). El boton **conserva su texto**, no se sustituye por un spinner solo. Cargando no es deshabilitado.
- `disabled`: un boton deshabilitado **siempre** explica por que en texto cercano o tooltip accesible.
- Prohibido: gradientes, sombras de color, dos botones primarios juntos, y **botones de solo icono para acciones destructivas**.

### Icon-only

Una accion secundaria puede ser solo icono (`<Button>` con el SVG dentro) **si** lleva `:aria-label` y `v-tooltip` con el mismo texto. No se mezcla: un boton es icon-only o lleva texto, nunca a medias.

## Estructura canonica de inputs

Todo input visible cumple:

1. **Envuelto en `<div class="input-box">`.** El bloque BEM del slice puede agregar una clase adicional (`<div class="input-box bloque__input">`).
2. **Label encima del input**, dentro del mismo `input-box`. **El placeholder nunca sustituye al label** (MASTER 12.3).
3. **`fluid` por defecto** en todo componente PrimeVue que lo soporte. El ancho especifico se controla con `max-width` desde la clase BEM del slice, nunca con clases utilitarias sobre el input.
4. **`IconField` + `InputIcon`** cuando el campo tiene icono semantico. **Excepciones** que ya traen icono propio: `<Select>`, `<SelectButton>`, `<DatePicker>`, `<MultiSelect>`, y `<Password>` con `toggle-mask`.
5. **Validacion al `blur` y al enviar**, nunca en cada tecla (salvo fuerza de contrasena y disponibilidad de correo).
6. **Error del campo** debajo del input, con `aria-describedby` apuntando al mensaje.

```vue
<div class="input-box bloque__input">
  <label for="email">{{ $t('email') }}</label>
  <IconField>
    <InputIcon>
      <svg>...</svg>
    </InputIcon>
    <InputText id="email" v-model="value" fluid />
  </IconField>
</div>
```

> **Divergencia deliberada con el esqueleto retirado.** Aquel repo exigia
> `size="large"` en todo input; era la densidad de OTRO producto. En VMH el panel
> es denso por decision del sistema de diseño (MASTER 14) y el `size` lo fija el
> preset. **Un `size="large"` en este repo es un residuo, no una convencion.**

## Iconos

- **SVG de linea pegado en el template**, de [Tabler Icons](https://tablericons.com/). Nunca el paquete `@tabler/icons-vue` (enforzado por ESLint).
- `stroke="currentColor"`, `fill="none"`, `stroke-width="1.5"`, `stroke-linecap`/`linejoin` round, grid de 24.
- Tamaño desde la clase BEM del padre con `--icon-sm|md|lg|xl`. No dimensiones en px sueltas dentro del SVG.
- Decorativo → `aria-hidden="true"` + `focusable="false"`. Icon-only → el **boton** lleva `:aria-label` y tooltip.
- **Sin emojis**, en ningun contexto (enforzado por `lint:terminology`).
- Si el mismo SVG aparece en >=2 lugares, extraerlo a un componente presentacional propio.

## Contenedores

Todo bloque de contenido es un `<Card>` de PrimeVue. Nunca `<div class="box">` ni `<div class="card">` (enforzado por ESLint). Las clases BEM del slice se aplican al propio `<Card>`, no a un wrapper extra.

## Estados obligatorios

Los tres estados base son componentes del repo y **se usan, no se reescriben**:

| Estado | Componente |
|---|---|
| Cargando | `stateLoading` — bloques con la forma del contenido real. **Nunca un spinner de pagina completa.** |
| Vacio | `stateEmpty` — icono de linea, titulo en una frase, explicacion y, si hay salida, una accion. |
| Error | `stateError` — `title` y `detail` del API + boton de reintento. |

Los otros dos (default y success) los resuelve la vista: el exito se confirma con Toast o con un cambio de estado visible, nunca en silencio.

## Slices presentacionales puros

Un componente que solo presenta (sin estado, sin fetch) no necesita `domain/`, `application/` ni `infrastructure/`. Solo `index.vue`, `script.ts` y `style.scss`. Si ademas sus textos llegan por props, tampoco necesita `domain/locales/` — el slice que lo usa aporta los textos desde SU locale (es el caso de `stateEmpty`).

## Patrones del orquestador (`script.ts`)

- **`name:` obligatorio en `defineComponent`**, en `camelCase` igual que la carpeta.
- **v-model con `computed` get/set** para soportar `v-model:xxx` sin mutar props:
  ```ts
  const internalVisible = computed<boolean>({
    get: () => props.visible,
    set: (value) => emit('update:visible', value)
  })
  ```
- **`toRef(props, 'x')`** al pasar props reactivos a composables.
- **`PropType<X | null>`** con `default: null` para props que pueden venir nulos.
- **`mergeLocaleMessage` ANTES** de invocar composables que dependan de esas claves.

## Props puros

Los hijos reciben datos por `props` y avisan por `emit`. La orquestacion vive en el padre: ni la barra lateral ni el encabezado consultan la sesion por su cuenta, la reciben.

## Drawers y modales

- Drawer para contexto lateral (filtros, edicion, detalle); modal para decisiones que bloquean.
- Se cierran con Escape, con clic en el velo y con boton explicito. **Excepcion:** un modal de confirmacion destructiva no se cierra por clic en el velo.
- Un modal no abre otro modal.
- **Bug conocido de `<Drawer>` de PrimeVue:** el patron `v-if` + `Lazy` + `v-model:visible` hace que no abra la primera vez. Los drawers se montan siempre y se controlan solo con `v-model:visible`.
- Drawer con datos remotos: el fetch se dispara en la transicion `false -> true` de `visible`, no en el `setup()`.

## Accesibilidad minima

- Un `h1` por pagina. El encabezado del panel no lo aporta: lo declara cada vista.
- Todo lo accionable es operable por teclado con foco visible. `outline: none` sin sustituto es motivo de rechazo.
- Nunca solo color para comunicar estado: siempre texto o icono acompanando.
- Toda tabla con datos variables trunca con elipsis y respeta `min-width: 0`.
