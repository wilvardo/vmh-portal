# CHANGELOG — Sistema de diseño VMH

Formato: [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/). Versionado semántico del sistema:
**mayor** = cambia la identidad (paleta, tipografía) · **menor** = agrega tokens o componentes ·
**parche** = corrige valores sin cambiar decisiones.

Toda entrada nueva se agrega arriba, con fecha CDMX y responsable.

---

## [1.2.0] — 2026-08-22

El prototipo del panel destapó tres huecos del sistema, los tres con el mismo patrón: valores
repetidos decenas de veces que nadie había declarado. Se cierran antes de empezar a implementar, para
que el panel no nazca con la deuda dispersa que ya tuvo el sitio. **Ninguno cambia lo que se ve.**
Responsable: Wilvardo Ramírez Colunga.

### Agregado
- `--tracking-label` (+0.16em) — etiqueta de interfaz en caja alta del panel, 12.5 px peso 500. El
  prototipo ya lo usaba en **cincuenta** lugares sin declararlo. A ese tamaño, el +0.22em de
  `--tracking-caption` come demasiado ancho y rompe una etiqueta de tres palabras en dos renglones.
- `--color-scrim` (`rgba(13,27,42,.6)`) — velo de modales y cajones, con el navy de marca. Existía
  `--opacity-scrim` sin color que lo acompañara, así que cada cajón lo escribía a mano.
- **Superficie de navegación del panel** (§4.4 nueva): `--color-bg-nav` más cuatro tintas con su
  ratio verificado sobre `#000B64` — `--color-nav-fg` (17.05 AAA), `--color-nav-fg-secondary`
  (blanco 72 %, 9.01 AAA), `--color-nav-fg-muted` (blanco 55 %, 5.57 AA) y `--color-nav-hairline`
  (blanco 22 %, 1.84, nunca texto). El prototipo usaba **ocho** alfas distintas para decir cuatro cosas.

### Cambiado
- §5.3 — tabla explícita de los cinco trackings positivos, con el techo declarado. Los `+0.14em`,
  `+0.10em`, `+0.06em` y `+0.02em` sueltos se absorben: a 12.5 px la diferencia entre 0.14 y 0.16 es
  un cuarto de pixel por letra.
- §5.3 — el `−0.01em` de los títulos de 22 px **no entra al sistema**: se absorbe en
  `--tracking-tight` (−0.02em). Dos décimas de pixel no justifican una fila más en la tabla.
- §22.2 — el anti-patrón de primitiva usada directo nombra explícitamente `--color-primary-900` como
  fondo de la barra del panel, que ahora tiene su alias.
- Cabecera de `tokens.css` — decía «Derivado de MASTER.md v1.0.0» siendo ya 1.1.0.

### Verificado
- Contrastes de las cuatro tintas de navegación calculados sobre `#000B64`, no estimados.
- El filo de acento de 2 px del ítem activo **sí** puede usar `--color-primary`: va sobre la
  superficie blanca del propio ítem (7.32), no sobre el azul de la barra. Si fuera sobre el azul
  daría 2.33 y fallaría el 3:1 de contraste no textual — por eso §4.4 lo deja escrito como regla.

---

## [1.1.0] — 2026-08-22

El sitio público construido se había separado del sistema escrito en seis puntos, todos ellos
anti-patrones de rechazo directo según el propio MASTER. Wilvardo resolvió que **manda lo que se ve
en el sitio**: las tres divergencias que cambian el aspecto se absorben en el sistema y el sitio no
se refactoriza; las tres que no cambian un solo pixel siguen siendo defectos y pasan a deuda
declarada. Responsable: Wilvardo Ramírez Colunga.

### Agregado
- `tokens.css` — `--fw-display-strong: 560`, el peso real de los titulares de impacto del sitio.
  Jost se carga como fuente variable (`wght@300..600`), así que no cuesta un archivo extra.
- `tokens.css` — tres tokens de tracking negativo: `--tracking-tight` (−0.02em, ≥20 px),
  `--tracking-title` (−0.03em, ≥28 px) y `--tracking-hero` (−0.035em, ≥48 px).
- `tokens.css` — tres radios editoriales del sitio público: `--radius-xl` (20 px, tarjeta de precio),
  `--radius-2xl` (22 px, foto de servicio y tarjeta flotante) y `--radius-3xl` (26 px, marco de foto
  con parallax). **No cruzan a portal ni panel**, donde el tope sigue siendo `--radius-lg`.
- `MASTER.md` §5.3 — tabla de las dos voces de display (editorial y de impacto) y tabla de tracking
  negativo con su piso de tamaño por token.
- `MASTER.md` §25.1 — deuda declarada del sitio: los tres defectos de higiene con su alcance y su
  costo, para cerrarse en el próximo trabajo que toque cada slice.

### Cambiado
- **§5.3 Pesos y tracking.** La regla "peso máximo 500 en display, tracking negativo prohibido" era
  correcta para la caption y falsa para el hero: a 100 px, +0.01em abre agujeros entre letras. Ahora
  el display admite 300/400/500/560 (y 600 solo en la cifra de precio) y el tracking negativo está
  permitido según tabla, nunca por debajo de 20 px y nunca en cuerpo, UI o caption.
- **§7 Radios.** De un tope único de 16 px a una escala por tamaño y superficie. El radio crece con
  la pieza; el tope absoluto pasa a 26 px en el sitio y se mantiene en 16 px para portal, panel y
  cualquier pieza de datos.
- **§4.2.5 y §11.1 Navy.** Se retira el "máximo dos bloques navy por página, no consecutivos". La
  regla nueva es de ritmo: un tramo navy no supera dos secciones seguidas y siempre va flanqueado
  por claro. La home tiene cinco tramos y funciona.
- **§22 Anti-patrones 7 y 8**, reescritos en consecuencia.
- **§23 Checklist pre-PR**, alineado con lo anterior y con una verificación nueva de radios por
  superficie.

### Conocido y no corregido
- `data-surface="deep"` sigue declarado en `tokens.css` y sin usar: las seis zonas navy del sitio
  invierten color a mano. Adoptarlo no cambia un pixel. Ver §25.1.
- Hover fuera de `@media (hover: hover)` en todo el sitio salvo `homeServices__img`. Ver §25.1.
- `z-index` literales 50 y 60 en `siteHeader` y `whatsappFloat`. Ver §25.1.
- Las utilidades de `_typography.scss` no consumen los tokens `--fs-*`, `--space-section` no se usa
  y `--elevation-*` solo aparece en `/agendar`.

### Riesgo introducido
- El tracking negativo queda calibrado sobre la métrica de **Jost**, que es un sustituto. Cuando
  llegue la tipografía original del diseñador habrá que recalibrar los tres tokens de tracking, no
  solo cambiar `--font-display`.

---

## [1.0.0] — 2026-08-12

Primera versión formal del sistema. Consolida la identidad entregada por el cliente el 2026-08-12
en un sistema operable por las tres superficies de la plataforma.

### Agregado
- `MASTER.md` — guía maestra: ADN traducido a decisiones, 7 principios de experiencia, paleta con
  contrastes verificados, tipografía, espaciado, radios, elevación, motion, iconografía, reglas por
  superficie (website / portal / panel), catálogo de componentes base, estados obligatorios,
  densidad, formularios, data viz, accesibilidad, z-index, responsive, fotografía, voz en la
  interfaz, 20 anti-patrones, checklist pre-PR, extensión y gobernanza.
- `tokens/tokens.css` — reescritura completa. Escalas 50–950 en OKLCH para `ink` (ancla 950 =
  `#0D1B2A`), `primary` (ancla 600 = `#1046D6`), `neutral` (ancla 400 = `#9EA5A8`), `success`
  (`#1F8A5B`), `warning` (`#B07A12`) y `danger` (`#C0392B`), con luminosidad monótona y croma
  decreciente en los extremos. Alias semánticos, tipografía fluida, espaciado 4pt en rem, radios,
  4 niveles de elevación, motion, iconografía, dimensiones de componente, layout, focus, z-index y
  opacidad semántica. Bloque `[data-surface="deep"]` que invierte los semánticos sobre navy.
  Base obligatoria: focus visible global, selección, touch target, `prefers-reduced-motion` y
  `forced-colors`.
- `guideline.html` — referencia visual navegable y autocontenida, generada desde `tokens.css`
  (69 swatches verificados token a token contra el archivo fuente).
- `OWNERS.md` — roles y proceso de cambio.
- `pages/_TEMPLATE.md` — plantilla de override por página.
- `CHANGELOG.md` — este archivo.

### Cambiado
- `info` deja de ser una familia propia y pasa a ser **alias explícito de `primary`**: la marca no
  admite un segundo azul.
- Los grises nominales del cliente (`--color-mist` `#E2E5E8`, `--color-snow` `#F7F7F7`) se conservan
  literales y quedan fuera de la rampa `neutral`, que se genera algorítmicamente.
- La escala tipográfica de display, h1 y h2 pasa a fluida (`clamp`) para sostener el impacto
  editorial del sitio sin romper el ritmo vertical en móvil.

### Conservado por compatibilidad
- Los alias que ya consume el SCSS de `vmh-website`: `--color-primary`, `--color-primary-strong`,
  `--color-accent`, `--color-on-primary`, `--color-bg`, `--color-bg-body`, `--color-bg-dark`,
  `--color-bg-darker`, `--color-surface`, `--color-fg`, `--color-fg-secondary`, `--color-fg-muted`,
  `--color-fg-inverse`, `--color-hairline-dark`, `--color-hairline-light`, `--color-whatsapp`,
  `--font-display`, `--font-body`, `--tracking-*`, `--pad-x`, `--content-max`, `--edge`,
  `--edge-vw`, `--ease-out`, `--ease-in-out`, `--ease-soft`, `--reveal-dur`, `--reveal-delay`.
  **El sitio no requiere cambios para adoptar esta versión.**

### Notas de decisión
- Las rampas se anclan al hex **medido** de la lámina del cliente, no al etiquetado: el swatch azul
  aparece rotulado `#0A1628` en la lámina, valor que corresponde a un navy casi negro. Se confirma
  contra el vectorial cuando el cliente lo entregue.
- `success-600` (4.33) y `warning-600` (3.72) **no** alcanzan AA para texto normal sobre blanco. Se
  documentan como color de fondo, borde e icono; el texto de estado usa el paso 700.
- `--color-fg-muted` (`#9EA5A8`, 2.50 sobre blanco) queda declarado explícitamente como color
  decorativo y de hairline: no es un color de párrafo.
- **Implementación por superficie (corregido el 2026-08-12):** el sitio público se escribe a mano con
  SCSS por slice; `vmh-portal` y `vmh-landlord` montan **PrimeVue 4 con preset propio** alimentado por
  estos tokens (verificado en `vmh-landlord/package.json`). El MASTER manda sobre el preset: cuando no
  coinciden, el preset está mal, y ningún componente de Prime se parcha con CSS suelto en la página.

---

## [0.2.0] — 2026-08-12 · Reencuadre de identidad (previo al sistema)

### Cambiado
- La identidad pasa de la exploración **esmeralda dark-first** (Sora + Inter, `#1FA98A`) a la
  identidad del cliente: **light-first**, navy `#0D1B2A` + azul `#1046D6`, geométrica fina (Jost
  como sustituto vivo) + Inter.
- El modelo comercial deja de ser "grupos de máximo 6" y pasa a **acceso al espacio de entrenamiento
  + entrenamiento personalizado**. Afecta copy, no solo color.

### Archivado
- `04-branding/__DELETED__style-guide-esmeralda-v1.md` y
  `04-branding/__DELETED__tokens-esmeralda-v1.css` quedan como registro del proceso, no como
  referencia activa.
- `VMH-04-Identidad-y-Diseno.md` lleva banner de superado.

---

## Pendientes que abrirán la próxima versión

| Pendiente | Efecto esperado | Bloqueante para |
|---|---|---|
| Vectorial original del lockup (AI/SVG/PDF) | Confirma hex y proporciones del lockup | Señalética, papelería, manual impreso |
| Tipografía original del diseñador | Sustituye Jost en `--font-display`; puede alterar la métrica vertical de todos los titulares | Cierre de la versión 1.x |
| Resolución del sufijo de marca en IMPI | Habilita escribir el descriptor literal en la UI | Señalética, uniformes, papelería |
| Arranque de `vmh-portal` y `vmh-landlord` | Consumo real de los tokens; posible ajuste de densidad y de componentes de panel | Versión 1.1.0 |
