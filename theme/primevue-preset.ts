// theme/primevue-preset.ts
//
// Preset propio de VMH sobre Aura. Traduce los tokens del design system
// (`design-system/tokens/tokens.css`) a los slots semanticos de PrimeVue para
// que la libreria NO imponga su apariencia: el MASTER manda sobre el preset y
// el preset manda sobre los componentes.
//
// Reglas que sostiene este archivo:
//   - Un solo acento azul; `info` es alias de `primary` (tokens.css, regla 4).
//   - Light-first sin tema oscuro (MASTER 4.3): el esquema `dark` es una copia
//     del claro para que la marca nunca se vea invertida aunque alguien active
//     el conmutador de la libreria.
//   - Densidad de app (VMH-31): control de 32px, celda y campo de 13px, la
//     escala `--app-*` de `app/assets/design-system/_density.scss`.
//
// Si un componente no obedece al preset, el arreglo vive en
// `app/assets/design-system/_primevue-overrides.scss`, nunca en la pagina.

import Aura from '@primevue/themes/aura'
import { definePreset } from '@primevue/themes'

/**
 * Esquema de color unico de la marca. Se usa tanto en `light` como en `dark`
 * porque VMH no admite tema oscuro: la inversion la da `[data-surface="deep"]`
 * de los tokens, no la libreria.
 *
 * Se exporta para que la prueba del preset pueda verificar que ambos esquemas
 * reciben exactamente los mismos valores.
 */
export const VMH_COLOR_SCHEME = {
  primary: {
    color: 'var(--color-primary)',
    contrastColor: 'var(--color-on-primary)',
    hoverColor: 'var(--color-primary-strong)',
    activeColor: 'var(--color-primary-pressed)'
  },
  highlight: {
    background: 'var(--color-primary-soft)',
    focusBackground: 'var(--color-primary-soft)',
    color: 'var(--color-primary-700)',
    focusColor: 'var(--color-primary-700)'
  },
  surface: {
    0: 'var(--color-neutral-0)',
    50: 'var(--color-neutral-50)',
    100: 'var(--color-neutral-100)',
    200: 'var(--color-neutral-200)',
    300: 'var(--color-neutral-300)',
    400: 'var(--color-neutral-400)',
    500: 'var(--color-neutral-500)',
    600: 'var(--color-neutral-600)',
    700: 'var(--color-neutral-700)',
    800: 'var(--color-neutral-800)',
    900: 'var(--color-neutral-900)',
    950: 'var(--color-neutral-950)'
  },
  formField: {
    background: 'var(--color-surface)',
    disabledBackground: 'var(--color-surface-sunken)',
    filledBackground: 'var(--color-surface-sunken)',
    filledHoverBackground: 'var(--color-surface-sunken)',
    filledFocusBackground: 'var(--color-surface)',
    borderColor: 'var(--color-border-strong)',
    hoverBorderColor: 'var(--color-primary-300)',
    focusBorderColor: 'var(--color-primary)',
    invalidBorderColor: 'var(--color-danger-border)',
    color: 'var(--color-fg)',
    disabledColor: 'var(--color-fg-muted)',
    placeholderColor: 'var(--color-fg-muted)',
    invalidPlaceholderColor: 'var(--color-danger-fg)',
    floatLabelColor: 'var(--color-fg-secondary)',
    floatLabelFocusColor: 'var(--color-primary)',
    floatLabelActiveColor: 'var(--color-fg-secondary)',
    floatLabelInvalidColor: 'var(--color-danger-fg)',
    iconColor: 'var(--color-fg-secondary)',
    shadow: 'none'
  },
  text: {
    color: 'var(--color-fg)',
    hoverColor: 'var(--color-fg)',
    mutedColor: 'var(--color-fg-secondary)',
    hoverMutedColor: 'var(--color-fg)'
  },
  content: {
    background: 'var(--color-surface)',
    hoverBackground: 'var(--color-surface-sunken)',
    borderColor: 'var(--color-border)',
    color: 'var(--color-fg)',
    hoverColor: 'var(--color-fg)'
  },
  overlay: {
    select: {
      background: 'var(--color-surface)',
      borderColor: 'var(--color-border)',
      color: 'var(--color-fg)',
      shadow: 'var(--elevation-2)'
    },
    popover: {
      background: 'var(--color-surface)',
      borderColor: 'var(--color-border)',
      color: 'var(--color-fg)',
      shadow: 'var(--elevation-2)'
    },
    modal: {
      background: 'var(--color-surface)',
      borderColor: 'var(--color-border)',
      color: 'var(--color-fg)',
      shadow: 'var(--elevation-3)'
    }
  },
  list: {
    option: {
      focusBackground: 'var(--color-surface-sunken)',
      selectedBackground: 'var(--color-primary-soft)',
      selectedFocusBackground: 'var(--color-primary-soft)',
      color: 'var(--color-fg)',
      focusColor: 'var(--color-fg)',
      selectedColor: 'var(--color-primary-700)',
      selectedFocusColor: 'var(--color-primary-700)',
      icon: {
        color: 'var(--color-fg-muted)',
        focusColor: 'var(--color-fg-secondary)',
        selectedColor: 'var(--color-primary-700)',
        selectedFocusColor: 'var(--color-primary-700)'
      }
    },
    optionGroup: {
      background: 'transparent',
      color: 'var(--color-fg-secondary)'
    }
  },
  navigation: {
    item: {
      focusBackground: 'var(--color-surface-sunken)',
      activeBackground: 'var(--color-primary-soft)',
      color: 'var(--color-fg)',
      focusColor: 'var(--color-fg)',
      activeColor: 'var(--color-primary-700)',
      icon: {
        color: 'var(--color-fg-secondary)',
        focusColor: 'var(--color-fg)',
        activeColor: 'var(--color-primary-700)'
      }
    },
    submenuLabel: {
      background: 'transparent',
      color: 'var(--color-fg-secondary)'
    },
    submenuIcon: {
      color: 'var(--color-fg-muted)',
      focusColor: 'var(--color-fg-secondary)',
      activeColor: 'var(--color-primary-700)'
    }
  },
  mask: {
    background: 'color-mix(in srgb, var(--color-bg-dark) 60%, transparent)',
    color: 'var(--color-fg-inverse)'
  }
}

const VmhPreset = definePreset(Aura, {
  primitive: {
    borderRadius: {
      none: '0',
      xs: 'var(--radius-sm)',
      sm: 'var(--radius-sm)',
      md: 'var(--radius-md)',
      lg: 'var(--radius-lg)',
      xl: 'var(--radius-lg)'
    },
    blue: {
      50: 'var(--color-primary-50)',
      100: 'var(--color-primary-100)',
      200: 'var(--color-primary-200)',
      300: 'var(--color-primary-300)',
      400: 'var(--color-primary-400)',
      500: 'var(--color-primary-500)',
      600: 'var(--color-primary-600)',
      700: 'var(--color-primary-700)',
      800: 'var(--color-primary-800)',
      900: 'var(--color-primary-900)',
      950: 'var(--color-primary-950)'
    }
  },

  semantic: {
    primary: {
      50: 'var(--color-primary-50)',
      100: 'var(--color-primary-100)',
      200: 'var(--color-primary-200)',
      300: 'var(--color-primary-300)',
      400: 'var(--color-primary-400)',
      500: 'var(--color-primary-500)',
      600: 'var(--color-primary-600)',
      700: 'var(--color-primary-700)',
      800: 'var(--color-primary-800)',
      900: 'var(--color-primary-900)',
      950: 'var(--color-primary-950)'
    },

    transitionDuration: 'var(--motion-fast)',

    focusRing: {
      width: 'var(--focus-ring-width)',
      style: 'solid',
      color: 'var(--focus-ring-color)',
      offset: 'var(--focus-ring-offset)',
      shadow: 'none'
    },

    disabledOpacity: 'var(--opacity-disabled)',
    iconSize: 'var(--icon-md)',
    anchorGutter: 'var(--space-1)',

    // Densidad de app (VMH-31): el campo mide 32px; la altura la fija el piso
    // de `_primevue-overrides.scss` y aqui solo se da el relleno.
    formField: {
      paddingX: 'var(--space-3)',
      paddingY: 'var(--space-1)',
      sm: { fontSize: 'var(--fs-caption)', paddingX: 'var(--space-2)', paddingY: 'var(--space-1)' },
      lg: { fontSize: 'var(--fs-body)', paddingX: 'var(--space-4)', paddingY: 'var(--space-3)' },
      // Radio de 8: el mismo del alternador y del bloque, para que una fila de
      // controles se lea como una sola pieza.
      borderRadius: 'var(--radius-md)',
      focusRing: {
        width: 'var(--focus-ring-width)',
        style: 'solid',
        color: 'var(--focus-ring-color)',
        offset: '0',
        shadow: 'var(--focus-halo)'
      },
      transitionDuration: 'var(--motion-fast)'
    },

    list: {
      padding: 'var(--space-1)',
      gap: '0',
      header: { padding: 'var(--space-2)' },
      option: {
        padding: 'var(--space-2) var(--space-3)',
        borderRadius: 'var(--radius-sm)'
      },
      optionGroup: {
        padding: 'var(--space-2) var(--space-3)',
        fontWeight: 'var(--fw-semibold)'
      }
    },

    content: { borderRadius: 'var(--radius-md)' },
    mask: { transitionDuration: 'var(--motion-base)' },

    navigation: {
      list: { padding: 'var(--space-1)', gap: 'var(--space-1)' },
      item: {
        padding: 'var(--space-2) var(--space-3)',
        borderRadius: 'var(--radius-sm)',
        gap: 'var(--space-2)'
      },
      submenuLabel: {
        padding: 'var(--space-2) var(--space-3)',
        fontWeight: 'var(--fw-semibold)'
      },
      submenuIcon: { size: 'var(--icon-sm)' }
    },

    overlay: {
      select: { borderRadius: 'var(--radius-md)' },
      popover: { borderRadius: 'var(--radius-md)', padding: 'var(--space-4)' },
      modal: {
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--space-5)',
        shadow: 'var(--elevation-3)'
      }
    },

    colorScheme: {
      light: VMH_COLOR_SCHEME,
      // VMH no tiene tema oscuro: mismo esquema para que la libreria no invente
      // una version invertida de la marca.
      dark: VMH_COLOR_SCHEME
    }
  },

  components: {
    // El boton de la marca es pill (MASTER 12.1) y en las apps mide 32px
    // (VMH-31). La tipografia y la caja alta del primario viven en
    // `_primevue-overrides.scss`: el preset no tiene token para ellas.
    button: {
      root: {
        borderRadius: 'var(--radius-pill)',
        roundedBorderRadius: 'var(--radius-pill)',
        gap: 'var(--space-2)',
        paddingX: 'var(--space-4)',
        paddingY: 'var(--space-1)',
        iconOnlyWidth: 'var(--app-control-h)',
        sm: {
          fontSize: 'var(--fs-caption)',
          paddingX: 'var(--space-3)',
          paddingY: 'var(--space-1)'
        },
        lg: { fontSize: 'var(--fs-body)', paddingX: 'var(--space-6)', paddingY: 'var(--space-3)' },
        label: { fontWeight: 'var(--fw-medium)' },
        raisedShadow: 'var(--elevation-1)',
        focusRing: {
          width: 'var(--focus-ring-width)',
          style: 'solid',
          offset: 'var(--focus-ring-offset)'
        }
      }
    },
    card: {
      root: {
        background: 'var(--color-surface)',
        // Radio de 8 y no de 16: dieciseis se ve inflado en la densidad de un
        // panel de administracion. El 16 queda para cajones y modales, que si
        // son piezas grandes (VMH-13 3.3).
        borderRadius: 'var(--radius-md)',
        color: 'var(--color-fg)',
        // Una tarjeta de lista no flota: se separa con una linea de 1px, no
        // con sombra. La sombra queda reservada a lo que de verdad se levanta
        // sobre el contenido -cajones, menus, avisos-. Se expresa como sombra
        // sin desenfoque porque el preset de la libreria no tiene token de
        // borde para la tarjeta.
        shadow: '0 0 0 1px var(--color-border)'
      },
      // Aire dentro de la tarjeta: 16px (VMH-31). Los 24 de VMH-13 inflaban
      // cada bloque, y una pantalla de cinco bloques bajaba media pantalla.
      body: { padding: 'var(--app-block-pad)', gap: 'var(--space-3)' },
      caption: { gap: 'var(--space-1)' },
      title: { fontSize: 'var(--app-fs-section)', fontWeight: 'var(--fw-medium)' },
      subtitle: { color: 'var(--color-fg-secondary)' }
    },
    datatable: {
      // Fila de 42px con separadores horizontales (MASTER 12.5, VMH-31). El
      // encabezado va sobre gris de un punto para separarse del dato sin linea
      // extra; su tipografia de etiqueta vive en `_primevue-overrides.scss`.
      headerCell: {
        background: 'var(--color-neutral-50)',
        color: 'var(--color-fg-muted)',
        borderColor: 'var(--color-border)',
        padding: 'var(--space-2) var(--app-block-pad)'
      },
      bodyCell: { borderColor: 'var(--color-border)', padding: '0 var(--app-block-pad)' },
      row: { background: 'var(--color-surface)', hoverBackground: 'var(--color-surface-sunken)' },
      columnTitle: { fontWeight: 'var(--fw-semibold)' }
    },
    // Toast en la escala de app: titulo a 13 y detalle a 12 (VMH-31).
    toast: {
      root: { borderWidth: '1px', width: '22rem' },
      icon: { size: 'var(--icon-md)' },
      content: { padding: 'var(--space-3)', gap: 'var(--space-3)' },
      summary: { fontSize: 'var(--app-fs-table)', fontWeight: 'var(--fw-semibold)' },
      detail: { fontSize: 'var(--app-fs-meta)', fontWeight: 'var(--fw-regular)' },
      success: {
        background: 'var(--color-success-bg)',
        borderColor: 'var(--color-success-border)',
        color: 'var(--color-success-fg)',
        detailColor: 'var(--color-fg)'
      },
      error: {
        background: 'var(--color-danger-bg)',
        borderColor: 'var(--color-danger-border)',
        color: 'var(--color-danger-fg)',
        detailColor: 'var(--color-fg)'
      },
      warn: {
        background: 'var(--color-warning-bg)',
        borderColor: 'var(--color-warning-border)',
        color: 'var(--color-warning-fg)',
        detailColor: 'var(--color-fg)'
      },
      info: {
        background: 'var(--color-info-bg)',
        borderColor: 'var(--color-info-border)',
        color: 'var(--color-info-fg)',
        detailColor: 'var(--color-fg)'
      }
    },
    // Mensaje en linea (VMH-31): acompaña al contenido, no lo encabeza. Texto
    // de celda (13) y peso normal, sin la sombra de color de la libreria; el
    // titulo del aviso lo marca cada vista con su propio `strong`.
    message: {
      root: { borderRadius: 'var(--radius-md)' },
      content: { padding: 'var(--space-2) var(--space-3)', gap: 'var(--space-2)' },
      text: { fontSize: 'var(--app-fs-table)', fontWeight: 'var(--fw-regular)' },
      icon: { size: 'var(--icon-sm)' },
      colorScheme: {
        light: {
          success: {
            background: 'var(--color-success-bg)',
            borderColor: 'var(--color-success-border)',
            color: 'var(--color-success-fg)',
            shadow: 'none'
          },
          error: {
            background: 'var(--color-danger-bg)',
            borderColor: 'var(--color-danger-border)',
            color: 'var(--color-danger-fg)',
            shadow: 'none'
          },
          warn: {
            background: 'var(--color-warning-bg)',
            borderColor: 'var(--color-warning-border)',
            color: 'var(--color-warning-fg)',
            shadow: 'none'
          },
          info: {
            background: 'var(--color-info-bg)',
            borderColor: 'var(--color-info-border)',
            color: 'var(--color-info-fg)',
            shadow: 'none'
          },
          // Nota neutra: gris de un punto y tinta secundaria, no la caja gris
          // con sombra de la libreria.
          secondary: {
            background: 'var(--color-neutral-50)',
            borderColor: 'var(--color-border)',
            color: 'var(--color-fg-secondary)',
            shadow: 'none'
          }
        }
      }
    },
    skeleton: {
      root: { background: 'var(--color-surface-sunken)', borderRadius: 'var(--radius-sm)' }
    },
    // El alternador de vista marca lo elegido con superficie blanca sobre gris,
    // igual que el modulo activo del menu. El acento no entra aqui: si algo se
    // puede resolver con superficie, no se resuelve con color (VMH-13 3.1).
    togglebutton: {
      root: {
        background: 'var(--color-neutral-100)',
        checkedBackground: 'var(--color-neutral-100)',
        hoverBackground: 'var(--color-neutral-100)',
        borderColor: 'var(--color-neutral-100)',
        borderRadius: 'var(--radius-md)',
        color: 'var(--color-fg-secondary)',
        hoverColor: 'var(--color-fg)',
        checkedColor: 'var(--color-fg)',
        checkedBorderColor: 'var(--color-neutral-100)',
        fontWeight: 'var(--fw-medium)'
      },
      content: {
        borderRadius: 'var(--radius-sm)',
        checkedBackground: 'var(--color-surface)',
        checkedShadow: 'var(--elevation-1)'
      }
    },
    // El dialogo no traia ajuste propio y se quedaba con el titulo de la
    // libreria: 20px, un tamaño que no existe en la escala del panel. Un
    // dialogo y un cajon son lo mismo en jerarquia -una seccion sobre la
    // pantalla-, asi que sus encabezados miden igual.
    dialog: {
      root: { background: 'var(--color-surface)', borderColor: 'var(--color-border)' },
      header: { padding: 'var(--space-4) var(--space-5)' },
      content: { padding: '0 var(--space-5) var(--space-5)' },
      footer: { padding: 'var(--space-4) var(--space-5)' },
      title: { fontSize: 'var(--app-fs-section)', fontWeight: 'var(--fw-medium)' }
    },
    drawer: {
      root: { background: 'var(--color-surface)', borderColor: 'var(--color-border)' },
      header: { padding: 'var(--space-4) var(--space-5)' },
      content: { padding: '0 var(--space-5) var(--space-5)' },
      footer: { padding: 'var(--space-4) var(--space-5)' },
      title: { fontSize: 'var(--app-fs-section)', fontWeight: 'var(--fw-medium)' }
    },
    // Etiqueta de estado compacta (VMH-31): acompaña al dato, no compite con
    // el titulo del bloque.
    tag: {
      root: {
        fontSize: 'var(--app-fs-label)',
        fontWeight: 'var(--fw-medium)',
        padding: '0.125rem var(--space-2)',
        borderRadius: 'var(--radius-pill)'
      }
    },
    tooltip: {
      root: {
        background: 'var(--color-bg-dark)',
        color: 'var(--color-fg-inverse)',
        borderRadius: 'var(--radius-sm)',
        padding: 'var(--space-2) var(--space-3)'
      }
    }
  }
})

export default VmhPreset
