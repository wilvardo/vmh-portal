# VMH — MASTER.md

> **Sistema de diseño de la Plataforma VMH.** Documento maestro: define el *qué* y el *porqué* de cada decisión visual y de interacción de las tres superficies del producto. Los valores concretos viven en `tokens/tokens.css`; este documento explica cuándo y por qué se usan.
>
> **Versión 1.2.0 · 22 de agosto de 2026 · Estado: vigente.**
>
> **Cambio de la 1.2.0:** el prototipo del panel destapó tres huecos del sistema, todos con el mismo
> patrón: valores repetidos decenas de veces que nadie había declarado. Se cierran aquí — el tracking
> de etiqueta del panel (§5.3), la superficie de la barra de navegación (§4.4) y el velo de modales y
> cajones (§3.2). Ninguno cambia lo que se ve; los tres evitan que el código nazca con la deuda
> dispersa que ya tuvo el sitio.
>
> **Cambio de la 1.1.0:** el sitio público ya construido se había separado del sistema escrito en seis
> puntos. Wilvardo resolvió el 2026-08-22 que **manda lo que se ve en el sitio**. Las tres divergencias
> que cambian el aspecto —peso y tracking de display (§5.3), radios editoriales (§7) y ritmo de bloques
> navy (§4.2, §11.1)— se absorben aquí: el sitio no se refactoriza, el sistema las adopta. Las tres que
> **no cambian un solo pixel** —`data-surface="deep"` sin usar, hover fuera de su guarda y `z-index`
> literales— siguen siendo defectos y pasan a deuda declarada en §25.

---

## 0. Cómo se usa este documento

### 0.1 Jerarquía documental (quién manda sobre quién)

| Nivel | Documento | Autoridad |
|---|---|---|
| 1 | `00-brain/05-consultorias/03-vmh/paquete-lanzamiento/04-branding/00-referencia-cliente.md` | **Marca.** Material entregado por el cliente. Manda sobre todo lo demás en identidad. |
| 2 | Este `MASTER.md` | **Sistema de diseño.** Traduce la marca a reglas de producto. Manda sobre cualquier decisión de implementación. |
| 3 | `tokens/tokens.css` | **Valores.** Fuente única de hex, medidas y curvas. No introduce decisiones nuevas. |
| 4 | `pages/<slug>.md` | **Overrides por página.** Solo desviaciones justificadas del MASTER. |
| 5 | Código de cada repo | Implementa. No decide. |

Si el código contradice al MASTER, el código está mal. Si el MASTER contradice la referencia del cliente, el MASTER está mal y se corrige aquí, no en el componente.

### 0.2 Superficies cubiertas

| Superficie | Repo | Stack | Naturaleza |
|---|---|---|---|
| Sitio público | `vmh-website` | Nuxt 4 SSR | Editorial. Vende acceso + acompañamiento. Prioridad: SEO, Core Web Vitals, impacto visual. |
| Portal del atleta | `vmh-portal` | Nuxt 4 SPA + PrimeVue 4 | Transaccional ligero. Reservar, ver membresía, cancelar. Uso desde teléfono, de pie, con prisa. |
| Panel de administración | `vmh-landlord` | Nuxt 4 SPA + PrimeVue 4 | Operativo. Recepción y dirección del estudio. Uso desde escritorio, sesiones largas, densidad alta. |

Los tres consumen **los mismos tokens**. Lo que cambia es la densidad, no la identidad. Un botón primario se ve igual en los tres; en el panel mide 36 px de alto y en el sitio 48 px.

### 0.3 Lo que este sistema NO es

No es una librería de componentes, y las tres superficies no se implementan igual:

| Superficie | Implementación | Quién impone la consistencia |
|---|---|---|
| `vmh-website` | Sin librería. Cada componente se escribe a mano con SCSS por slice (`components/<nombre>/style.scss`) consumiendo tokens | Este documento y la revisión |
| `vmh-portal` · `vmh-landlord` | PrimeVue 4 con **preset propio** alimentado por estos tokens | El preset, verificado contra este documento |

En el sitio, la consistencia depende de este documento y del checklist de §23 — no hay theme que la imponga. En portal y panel, el preset de PrimeVue traduce los tokens a la librería: cuando el preset y este documento no coinciden, **el preset está mal**. Ningún componente de Prime se estiliza por CSS suelto en la página; se corrige el preset.

---

## 1. ADN traducido a decisiones de diseño

La semblanza del cliente da cinco ideas rectoras. Cada una tiene una consecuencia visual concreta y verificable:

| Idea del cliente | Decisión de diseño | Cómo se verifica |
|---|---|---|
| "Estética moderna, minimalista y limpia" | Light-first. Blanco y gris como fondo por defecto; el navy es un bloque puntual, no el ambiente general. | Ninguna vista del sitio arranca en navy salvo secciones inmersivas declaradas. |
| "Calidad de la experiencia sobre cantidad de máquinas o usuarios" | Aire como material principal: secciones de 64–96 px de padding vertical, párrafos de máximo 68 caracteres, una idea por bloque. | Ninguna sección del sitio con más de una acción principal. |
| "Entrenar de manera inteligente y estructurada" | Jerarquía tipográfica estricta y numerales tabulares en datos. Nada de decoración sin función. | Cada pantalla tiene un único H1 y una única acción primaria. |
| "Bienestar integral, no culto a la apariencia" | Fotografía arquitectónica en blanco y negro, con aire; cero cuerpos en primer plano, cero antes/después. | Revisión de cada imagen contra §20. |
| "Fuerza, disciplina, progreso, excelencia" | Geometría: trazo uniforme, radios cortos, iconografía de línea de una sola tinta, cero gradientes ni sombras dramáticas. | Ninguna pieza con gradiente, glow o sombra de color. |

**Corolario comercial (vigente 2026-08-12):** el producto vende **acceso al espacio + entrenamiento personalizado**. Ya no vende "grupos de máximo 6". Cualquier componente cuyo copy o estructura asuma clase grupal como eje comercial está desactualizado, aunque técnicamente funcione.

### 1.1 Territorio de mensaje aplicado a la UI

- **Se dice:** entrenar con estructura; fuerza como pilar de salud; composición corporal; bienestar físico, mental y emocional; hábito; autonomía con acompañamiento; enfoque.
- **No se dice:** transformación en X días; antes y después; "quema grasa"; competencia contra otros; disciplina como castigo; promesas sin sustento.
- **VIS · MASTERY · HEXIS** es territorio de mensaje y sección del sitio, **no** un slogan que se repite en headers, botones ni correos.

### 1.2 Pendientes de marca que afectan al código

1. **Sufijo de marca sin resolver en IMPI.** Ninguna pieza de código lo escribe literal: todo sale de `SITE_BRAND_NAME` / `SITE_BRAND_DESCRIPTOR`, hoy vacío. El lint de terminología lo prohíbe. **Cerrar antes de imprimir señalética, uniformes o papelería.**
2. **Tipografía sustituta.** Jost es un sustituto vivo de la geométrica fina del lockup. Cuando el cliente entregue la original, se sustituye en un solo lugar: `--font-display`.
3. **Hex del swatch azul mal etiquetado en la lámina del cliente** (`#0A1628` es un navy casi negro, no el azul de la muestra). El valor medido y vigente es `#1046D6`. Confirmar contra el vectorial cuando llegue.

---

## 2. Principios de experiencia

Siete principios. Se citan por número en los reviews de PR; no son decorativos.

### 2.1 Una idea por bloque
Cada sección del sitio comunica una sola idea y ofrece a lo más una acción principal. En portal y panel: una acción primaria por vista; el resto son secundarias o terciarias. Si una pantalla necesita dos botones azules, uno de los dos no es primario.

### 2.2 El aire es contenido
El espacio en blanco es el recurso de lujo de esta marca, no un desperdicio. Antes de agregar un separador, una sombra o un borde, se intenta resolver con espacio. La profundidad la da el aire; la sombra es el último recurso.

### 2.3 El azul señala, no decora
Un solo acento. El azul marca acción (CTA, enlace, dato que importa). **Si una pantalla tiene más de tres apariciones de azul, sobra alguna.** Nunca azul para "dar color", nunca dos azules distintos compitiendo.

### 2.4 El sistema nunca miente sobre el estado
Toda vista con datos declara sus cinco estados (§13). Un spinner infinito, una tabla vacía sin mensaje o un error que dice "algo salió mal" son defectos, no detalles de acabado.

### 2.5 Prevenir antes que recuperar
Deshabilitar lo imposible, validar en el momento correcto (blur, no keystroke), confirmar solo lo destructivo. Una cancelación de reserva se confirma; un guardado de perfil, no.

### 2.6 El usuario manda sobre el movimiento
Nada se mueve solo salvo los reveals editoriales del sitio. Nada bloquea la interacción por animación. `prefers-reduced-motion` desactiva todo movimiento no esencial y está implementado en tokens, no opcionalmente por componente.

### 2.7 Lo táctil pesa más que lo estético
Objetivo táctil mínimo de 44 px en portal y en todo el sitio en móvil. Ningún hover como única vía para descubrir una acción. Ningún gesto sin equivalente por botón.

---

## 3. Color — superficie clara (default de la marca)

### 3.1 Estructura de la paleta

Tres rampas de 11 pasos (50–950) generadas en OKLCH anclando el color medido de la lámina del cliente, más tres rampas de estado:

| Rampa | Ancla | Hex ancla | Rol |
|---|---|---|---|
| `ink` | 950 | `#0D1B2A` | Tinta de marca: texto, isotipo, secciones inmersivas |
| `primary` | 600 | `#1046D6` | Acción: CTA, enlaces, énfasis, foco |
| `neutral` | 400 | `#9EA5A8` | Hairlines, metadatos, superficies frías |
| `success` | 600 | `#1F8A5B` | Confirmación (reserva creada, pago aplicado) |
| `warning` | 600 | `#B07A12` | Atención sin bloqueo (membresía por vencer) |
| `danger` | 600 | `#C0392B` | Error y destrucción (cancelar, eliminar, pago fallido) |

Además, dos grises nominales entregados por el cliente que **no** se derivan: `--color-mist` `#E2E5E8` (bruma) y `--color-snow` `#F7F7F7` (nieve). Y `--color-primary-bright` `#5B8CF5`, el azul de la lámina para uso sobre navy.

`info` es **alias explícito de `primary`**. La marca no admite un segundo azul: un mensaje informativo y una acción comparten color porque comparten intención.

### 3.2 Alias semánticos — los únicos que se escriben en componentes

| Token | Valor | Uso |
|---|---|---|
| `--color-fg` | `ink-950` | Texto principal |
| `--color-fg-secondary` | `#5C666F` | Texto de apoyo, descripciones |
| `--color-fg-muted` | `neutral-400` | Metadatos, hairlines, decorativo. **No para párrafos** |
| `--color-bg-body` | `mist` | Marco exterior de la página |
| `--color-bg` | `snow` | Fondo base de sección clara |
| `--color-surface` | `#FFFFFF` | Cards y superficies elevadas |
| `--color-bg-dark` | `ink-950` | Sección inmersiva navy |
| `--color-primary` | `primary-600` | Acción |
| `--color-primary-strong` | `#0B34A8` | Hover / pressed |
| `--color-on-primary` | `#FFFFFF` | Texto sobre azul (AA 7.32) |
| `--color-border` | `mist` | Borde estándar |
| `--color-border-strong` | `neutral-300` | Borde de campo de formulario |
| `--color-scrim` | `rgba(13,27,42,.6)` | Velo de modales y cajones. Navy de marca, **nunca negro puro** |

**Regla dura:** las primitivas (`--color-primary-300`, `--color-ink-700`…) no se usan directo en un componente. Si un componente necesita un tono que no existe como alias semántico, el hueco se resuelve **agregando el alias aquí**, no consumiendo la primitiva.

### 3.3 Contrastes verificados (WCAG 2.1)

Sobre nieve `#F7F7F7` / blanco `#FFFFFF`:

| Par | Ratio | Veredicto |
|---|---|---|
| `fg` (`#0D1B2A`) sobre nieve | 16.24 | AAA |
| `fg-secondary` (`#5C666F`) sobre nieve | 5.47 | AA texto normal |
| `fg-muted` (`#9EA5A8`) sobre blanco | 2.50 | **Falla texto.** Solo hairlines y elementos decorativos |
| `primary-600` sobre nieve | 6.83 | AA texto normal, AAA en ≥24 px |
| `primary-600` sobre blanco | 7.32 | AAA en ≥18.66 px bold / AA normal |
| `on-primary` (`#FFF`) sobre `primary-600` | 7.32 | AAA |
| `danger-600` sobre blanco | 5.44 | AA |
| `success-700` sobre blanco | 6.61 | AA |
| `warning-700` sobre blanco | 5.98 | AA |
| `success-600` sobre blanco | 4.33 | **Falla texto normal.** Solo fondo, borde e icono |
| `warning-600` sobre blanco | 3.72 | **Falla texto normal.** Solo fondo, borde e icono |

Sobre navy `#0D1B2A`:

| Par | Ratio | Veredicto |
|---|---|---|
| `snow` (`#F7F7F7`) sobre navy | 16.24 | AAA |
| `primary-bright` (`#5B8CF5`) sobre navy | 5.40 | AA |
| `primary-300` (`#85B1FF`) sobre navy | 8.06 | AAA |
| `ink-300` sobre navy | 9.19 | AAA — texto secundario en navy |
| `ink-400` sobre navy | 7.23 | AAA — metadatos en navy |
| **`primary-600` (`#1046D6`) sobre navy** | **2.38** | **PROHIBIDO.** Nunca el azul de marca como texto sobre navy |

Cualquier token de color nuevo se agrega con su ratio calculado en esta tabla. Sin ratio documentado, el PR no pasa.

### 3.4 Uso del color por intención

- **Azul:** lo que el usuario puede accionar y lo que el negocio quiere que accione. Nada más.
- **Navy:** tinta y bloques inmersivos. Es el color del texto, no un "fondo oscuro de moda".
- **Grises:** estructura. Separan sin gritar.
- **Estados:** solo cuando hay un estado real. Un badge verde permanente no comunica nada.

---

## 4. Superficie inmersiva navy

El navy no es un dark mode. Es un **bloque de sección** con inversión declarada.

### 4.1 Cómo se activa

```html
<section class="section" data-surface="deep"> … </section>
```

`[data-surface="deep"]` reasigna los alias semánticos en `tokens.css`. El CSS del componente **no cambia**: sigue escribiendo `var(--color-fg)` y `var(--color-primary)`; lo que cambia es a qué apuntan. Esto es lo que permite reutilizar un card en sección clara y en sección navy sin duplicar estilos.

> **Estado real al 2026-08-22: el sitio no usa este mecanismo.** Sus seis zonas navy fijan
> `background: var(--color-bg-dark)` y después invierten el color pieza por pieza a mano
> (`--color-fg-inverse`, `color-mix(...)`, `.accent-inverse`, `.lead--light`, `.display--light`).
> Funciona y se ve bien —por eso no es urgente— pero cada componente nuevo que quiera vivir en navy
> hay que vestirlo otra vez. Adoptarlo **no cambia un solo pixel**: es deuda de higiene, no de
> aspecto, y está declarada en §25.

### 4.2 Reglas

1. Sobre navy, la acción usa `--color-primary` → `primary-bright` (`#5B8CF5`, AA 5.40). **Nunca** el azul de marca.
2. Un botón primario sólido sobre navy lleva fondo `primary-bright` y texto `ink-950` (contraste 5.40), no texto blanco.
3. Los bordes sobre navy son `rgba(255,255,255,.16)`, no grises sólidos: el gris sólido sobre navy se ve sucio.
4. Las sombras sobre navy son negras y suaves; nunca sombras de color.
5. **El navy es ritmo, no ambiente.** Un tramo navy no supera **dos secciones seguidas**, y todo tramo va flanqueado por claro a ambos lados. Cuántos tramos tenga una página lo decide su narrativa: la home tiene cinco (hero · banner · banner · plataforma+promesa · galería) y funciona porque ninguno se extiende. Lo que rompe la marca no es la cantidad de navy sino que el ojo deje de notar el corte.

### 4.3 ¿Dark mode?

El sitio público **no tiene dark mode** — la cara pública de la marca es blanca. Portal y panel lo evalúan por separado; cuando llegue, se implementa con el mismo mecanismo (`data-theme="dark"` invirtiendo alias), nunca duplicando reglas por componente.

### 4.4 Superficie de navegación del panel

La barra lateral del panel va en **azul profundo** (`--color-bg-nav`, hoy `primary-900` `#000B64`).
Es una **desviación declarada y acotada a esa superficie**: pone la marca sin gastar el acento. No es
tema oscuro, no se extiende al lienzo y no existe en el sitio público.

Sus tintas viven en el sistema para que ningún componente vuelva a escribirlas a mano:

| Token | Valor | Ratio sobre `#000B64` | Uso |
|---|---|---:|---|
| `--color-nav-fg` | `#FFFFFF` | 17.05 AAA | Wordmark; texto del ítem activo sobre su superficie blanca |
| `--color-nav-fg-secondary` | blanco 72 % | 9.01 AAA | Ítems del menú, nombre de la cuenta |
| `--color-nav-fg-muted` | blanco 55 % | 5.57 AA | Etiquetas de grupo, rol, versión, rótulo «pronto» |
| `--color-nav-hairline` | blanco 22 % | 1.84 | Separadores. **Nunca texto** |

**Regla dura:** si algo azul se pinta **directamente sobre esta superficie** —un punto de aviso, un
distintivo, un contador— usa `--color-primary-bright` `#5B8CF5` (5.29), nunca `--color-primary`
`#1046D6` (**2.33**, falla el 3:1 de contraste no textual). Es la misma regla que rige sobre navy.

El filo de acento de 2 px del ítem activo **sí** usa `--color-primary`, porque va sobre la superficie
blanca del propio ítem y no sobre el azul de la barra: ahí el ratio es 7.32.

**Cuatro niveles y ni uno más.** El prototipo llegó a usar ocho alfas distintas (0.86, 0.78, 0.70,
0.62, 0.58, 0.55, 0.50, 0.22) para decir cuatro cosas. Si una pieza nueva parece necesitar un quinto
nivel, casi siempre es que su jerarquía está mal resuelta.

---

## 5. Tipografía

### 5.1 Familias

| Rol | Familia | Pesos | Notas |
|---|---|---|---|
| Display / titulares / wordmark | **Jost** | 300, 400, 500, 560, 600 | Sustituto vivo de la geométrica fina del lockup. Se carga como fuente variable (`wght@300..600`), así que 560 no cuesta un archivo extra. Se reemplaza en `--font-display` cuando llegue la original |
| Cuerpo / UI | **Inter** | 400, 500, 600 | Toda la interfaz, formularios, tablas |
| Datos | Inter + `font-variant-numeric: tabular-nums` | 400, 500 | **No** se agrega familia mono: la alineación de cifras se resuelve con tabular-nums |

Solo se cargan esos pesos. Cada peso extra es un archivo más en el critical path del sitio, y este sitio compite por Core Web Vitals.

### 5.2 Escala

| Token | Tamaño | Uso |
|---|---|---|
| `--fs-display` | 40 → 64 px fluido | Hero del sitio. Uno por página |
| `--fs-h1` | 32 → 44 px fluido | Título de página / sección mayor |
| `--fs-h2` | 24 → 32 px fluido | Sección |
| `--fs-h3` | 22 px | Subsección, título de card |
| `--fs-body-lg` | 18 px | Entradilla, párrafo destacado |
| `--fs-body` | 16 px | Cuerpo. **Piso absoluto de lectura** |
| `--fs-body-sm` | 14 px | UI secundaria, celdas de tabla, ayudas |
| `--fs-caption` | 12.5 px | Etiquetas en caja alta con tracking +0.22em |

Nada por debajo de 12.5 px. Un dato que no cabe se resuelve con jerarquía o con espacio, no reduciendo tipografía.

### 5.3 Pesos, interlineado y tracking

El sitio público tiene **dos voces de display**, y la diferencia entre ellas es lo que le da carácter:

| Voz | Peso | Tracking | Dónde |
|---|---|---|---|
| **Editorial** | 300–400 | `--tracking-display` +0.01em | Títulos de sección, display y display XL. Aire, calma, lectura |
| **De impacto** | 500–560 | negativo, según tabla | Titular de hero, paso del método, nombre de servicio, cita, pregunta, cifra de precio |

La voz editorial abre; la de impacto cierra. Mezclarlas en una misma pieza es el error.

- **Pesos permitidos en display:** 300 · 400 · 500 · **560** · 600 solo para la cifra de precio. **Nunca 700.**
- **UI:** 400 cuerpo, 500 labels y botones, 600 solo encabezados de tabla, datos críticos y precio.
- **Interlineado:** hero 0.98 · titular de impacto 1.00 · display 1.06 · cita 1.14 · headings 1.15 · cuerpo 1.6 · UI compacta 1.3.
- **Tracking positivo:** display +0.01em, wordmark +0.34em, caption +0.22em, **etiqueta de panel +0.16em**, botones +0.04em.

| Token | Valor | Dónde |
|---|---|---|
| `--tracking-wordmark` | +0.34em | Wordmark VMH, caja alta |
| `--tracking-caption` | +0.22em | Eyebrow del sitio, encabezado de sección, grupo del menú |
| `--tracking-label` | +0.16em | **Etiqueta de interfaz en caja alta del panel** (12.5 px, peso 500): metadatos, rol, estado |
| `--tracking-button` | +0.04em | Botones |
| `--tracking-display` | +0.01em | Display editorial |

**Por qué existe `--tracking-label`:** a 12.5 px, +0.22em come demasiado ancho en densidad de
administración — una etiqueta de tres palabras se rompe en dos renglones. El panel ya lo estaba
resolviendo con +0.16em en **cincuenta** lugares antes de que nadie lo declarara. Cincuenta usos no
son una excepción: son un token que faltaba.

**Cinco valores de tracking positivo son el techo.** Los `+0.14em`, `+0.10em`, `+0.06em` y `+0.02em`
que aparecieron sueltos en el prototipo se absorben en los de arriba: a 12.5 px la diferencia entre
0.14 y 0.16 es un cuarto de pixel por letra y nadie la ve, pero la lista de tokens sí crece.
- **Tracking negativo:** permitido **solo** en display y **solo** según esta tabla. Fuera de ella sigue prohibido, y por debajo de 20 px lo está siempre.

| Token | Valor | Piso de tamaño | Piezas |
|---|---|---|---|
| `--tracking-hero` | −0.035em | ≥48 px | Titular de hero |
| `--tracking-title` | −0.03em | ≥28 px | Titular de paso del método, cifra de precio |
| `--tracking-tight` | −0.02em | ≥20 px | Cita, nombre de servicio, pregunta de FAQ, **título de pantalla del panel** |

El `−0.01em` que el prototipo usó en los títulos de 22 px **no entra al sistema**: se absorbe en
`--tracking-tight`. A ese tamaño la diferencia es de dos décimas de pixel, y un valor más en la tabla
cuesta más que lo que resuelve.

**Por qué:** la geométrica fina pide aire en lo pequeño y lo pide **menos** conforme crece. A 100 px, +0.01em abre agujeros entre letras y el titular se desarma; a 12 px, cerrar lo vuelve ilegible. La regla vieja ("tracking negativo prohibido") era correcta para la caption y falsa para el hero, y por eso el sitio la incumplió seis veces antes de que alguien la revisara.
- **Itálicas: prohibidas.** El énfasis se resuelve con peso o con color.
- **Mayúsculas:** solo en caption y wordmark, siempre con tracking. Nunca un párrafo ni un botón largo en caja alta.
- **Medida de línea:** párrafos a `--measure` (68ch) máximo.

---

## 6. Espaciado y ritmo

Grid de 4 pt en rem: 4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48 · 64 · 80 · 96.

| Contexto | Valor |
|---|---|
| Padding vertical de sección (sitio) | `--space-section` (64 → 96 px fluido) |
| Padding interno de card | 24 px (sitio y portal) · 16–20 px (panel, densidad alta) |
| Separación entre elementos relacionados | 8 o 12 px |
| Separación entre grupos | 24 o 32 px |
| Gap de grid de cards | 24 px (sitio) · 16 px (panel) |
| Margen lateral | `--pad-x` (20 → 56 px fluido), vía `--edge` |

**Regla de proximidad:** la distancia entre dos elementos comunica su relación. Si dos cosas están separadas igual que dos grupos, la jerarquía está rota. No se corrige con una línea divisoria; se corrige con espacio.

Valores fuera del grid (13 px, 18 px, 30 px): prohibidos salvo cálculo óptico documentado en el override de la página.

---

## 7. Radios

El radio crece con la pieza: mientras más grande y más fotográfica, más suave el corte. Una celda de tabla y un marco de foto de 640 px de alto no pueden compartir radio sin que uno de los dos se vea mal.

| Token | Valor | Uso | Superficies |
|---|---|---|---|
| `--radius-sm` | 4 px | Inputs, chips, badges, celdas | Las tres |
| `--radius-md` | 8 px | **Default.** Contenedores pequeños, popovers, campos | Las tres |
| `--radius-lg` | 16 px | Cards de datos, modales, drawers. **Tope de UI** | Las tres |
| `--radius-xl` | 20 px | Tarjeta de precio | Solo sitio |
| `--radius-2xl` | 22 px | Foto de servicio, tarjeta flotante sobre foto | Solo sitio |
| `--radius-3xl` | 26 px | Marco de foto con parallax | Solo sitio |
| `--radius-pill` | 999 px | Botones y filtros | Las tres |

**Reglas duras:**

1. **En portal y panel el tope sigue siendo 16 px.** Los tres radios editoriales son del sitio público y no cruzan: una tabla de recepción con esquinas de 26 px no es VMH, es un widget.
2. **Nada por encima de 26 px** en ninguna superficie, salvo el pill de los botones.
3. Ninguna pieza de datos —campo, tabla, modal, chip, toast— pasa de `--radius-lg`, viva donde viva.

---

## 8. Elevación y bordes

### 8.1 Cuatro niveles

| Nivel | Token | Uso |
|---|---|---|
| 0 | `--elevation-0` | Contenido en flujo. Default |
| 1 | `--elevation-1` | Card sobre fondo del mismo tono, header al hacer scroll |
| 2 | `--elevation-2` | Card destacado, dropdown, popover |
| 3 | `--elevation-3` | Modal, drawer |

### 8.2 Borde condicional (regla dura)

Un elemento lleva borde **solo si su fondo es igual al del padre**. Card blanco sobre nieve: sin borde, basta la elevación 1. Card blanco sobre blanco: borde `--color-border`, sin sombra. **Nunca borde y sombra al mismo tiempo** — es la marca del acabado amateur.

### 8.3 Sombras

Siempre neutras (navy translúcido sobre claro, negro sobre navy). Prohibidas: sombras de color, glows, `box-shadow` como decoración de sección, sombras interiores.

---

## 9. Motion

### 9.1 Presupuesto

| Contexto | Duración | Curva |
|---|---|---|
| Micro-interacción (hover, focus, check) | `--motion-fast` 150 ms | `--ease-out` |
| Transición de componente (dropdown, tab) | `--motion-base` 220 ms | `--ease-out` |
| Entrada de overlay (modal, drawer) | `--motion-slow` 300 ms — **tope absoluto en UI** | `--ease-in-out` |
| Reveal editorial (solo sitio) | `--reveal-dur` 900 ms | `--ease-soft` |

### 9.2 Reglas

1. **Entrada** puede animarse; **salida** es rápida o instantánea. Nadie quiere esperar a que algo se vaya.
2. Se animan `transform` y `opacity`. Animar `width`, `height`, `top` o `box-shadow` en loop: prohibido (layout thrashing).
3. Nada parpadea, rebota ni gira decorativamente. Un spinner es funcional; un icono girando "porque se ve bien" es ruido.
4. Los reveals del sitio disparan **una sola vez** al entrar en viewport, no en cada scroll.
5. `prefers-reduced-motion: reduce` anula todo. Ya está implementado en `tokens.css` a nivel global: ningún componente necesita repetirlo, y ninguno puede evadirlo.

---

## 10. Iconografía

- **SVG de línea, una sola tinta.** `stroke-width` 1.5 px en tamaños ≤24 px; 1.75 px en piezas grandes. `stroke-linecap` y `linejoin` round. Grid de 24. Sin relleno, sin dos colores, sin degradados.
- **`stroke="currentColor"`** siempre: el icono hereda el color del texto y funciona igual en sección clara y en navy sin variantes.
- Tamaños: `--icon-sm` 16 · `--icon-md` 20 (default UI) · `--icon-lg` 24 · `--icon-xl` 32.
- Metáforas del dominio: acceso, calendario, reloj, persona, progreso, tarjeta, engrane, ubicación, mensaje.
- Un icono **nunca** va solo como única etiqueta de una acción destructiva o poco frecuente: lleva texto o `aria-label` explícito.
- **Sin emojis.** En ninguna superficie, ningún contexto, incluidos correos, mensajes de error y documentación.
- El isotipo VMH no es un icono de UI: no se usa como viñeta, como avatar por defecto ni como decoración repetida. Vive en header, footer, favicon y marca de agua.

---

## 11. Reglas por superficie

### 11.1 Sitio público (`vmh-website`, Nuxt 4 SSR)

- **Ambiente:** claro por defecto. El navy entra por tramos de una o dos secciones, siempre flanqueados por claro (§4.2.5). Ninguna página arranca en claro y termina en claro sin al menos un tramo navy: el contraste es parte de la identidad.
- **Ritmo:** una idea por sección, `--space-section` de aire vertical, un H1 por página.
- **Hero:** display fluido, una sola acción primaria, imagen a sangre. El texto nunca sobre la zona de mayor detalle de la foto sin capa de contraste.
- **Imágenes:** `loading="lazy"` salvo la del hero (`fetchpriority="high"`), `width`/`height` siempre declarados (CLS), formatos modernos con fallback.
- **Reveals:** entrada por scroll con `--reveal-dur`, una sola vez, desactivable por `prefers-reduced-motion`. Nunca ocultan contenido si JS falla (el estado inicial visible es el de fallback en SSR).
- **SEO/CWV:** metas, OG, JSON-LD `LocalBusiness`, sitemap. LCP < 2.5 s, CLS < 0.1, INP < 200 ms. Un efecto visual que degrade estas métricas se elimina, no se optimiza a medias.
- **Conversión:** el CTA de contacto/WhatsApp es persistente pero discreto; no interrumpe con modales ni popups de captura.

### 11.2 Portal del atleta (`vmh-portal`, Nuxt 4 SPA + PrimeVue 4)

- **Contexto real de uso:** teléfono, de pie, con prisa, a veces con guantes. Todo objetivo táctil ≥44 px, acciones principales al alcance del pulgar (mitad inferior).
- **Una acción principal por vista.** Reservar, cancelar, pagar: una por pantalla.
- **Densidad media:** campos de 48 px, padding de card 24 px.
- **Estados en primer plano:** membresía activa/por vencer/vencida se comunica con color de estado **y** texto. Nunca solo color.
- **Feedback inmediato:** toda acción que llama al API muestra estado de carga en el propio control (botón con spinner y texto, no overlay global).
- **Safe area:** barras y botones fijos respetan `--safe-bottom`.

### 11.3 Panel de administración (`vmh-landlord`, Nuxt 4 SPA + PrimeVue 4)

- **Contexto real de uso:** escritorio, sesiones largas, tareas repetitivas de recepción.
- **Densidad alta:** campos de 36 px (`--field-height-sm`), filas de tabla de 44 px, padding de card 16–20 px, `--fs-body-sm` en celdas.
- **La tabla es la vista principal**, no una excepción: cabecera sticky, columna de acciones a la derecha, orden y filtros persistentes en la sesión.
- **Atajos visibles:** las acciones frecuentes están a un clic; las destructivas, a un clic + confirmación.
- **Bitácora visible:** toda operación de override (cancelar reserva ajena, mover pago) muestra quién y cuándo.
- **Sin sorpresas:** el panel no anima nada que no sea feedback de estado. Los reveals editoriales del sitio no existen aquí.
- **Preset, no parches:** todo ajuste visual de un componente de PrimeVue vive en el preset del proyecto. CSS suelto sobre clases internas de Prime en una página: prohibido (se rompe en cada actualización de la librería).
---

## 12. Componentes base

Este catálogo describe el **comportamiento y la apariencia esperados**, con independencia de cómo se implemente cada superficie: a mano con SCSS en el sitio, con el preset de PrimeVue en portal y panel (§0.3). Antes de crear un componente nuevo se verifica que no exista uno que resuelva el caso con una variante; antes de escribir CSS suelto sobre un componente de Prime se corrige el preset.

### 12.1 Botón

| Variante | Fondo | Texto | Borde | Uso |
|---|---|---|---|---|
| Primario | `--color-primary` | `--color-on-primary` | — | Acción principal. **Una por vista** |
| Secundario | transparente | `--color-fg` | `--color-border-strong` | Acción alterna |
| Fantasma | transparente | `--color-primary` | — | Acción terciaria, dentro de tablas y cards |
| Destructivo | transparente | `--color-danger-fg` | `--color-danger-border` | Eliminar, cancelar. Sólido rojo solo dentro del modal de confirmación |

- Forma: `--radius-pill`. Alto `--field-height` (48) en sitio y portal, `--field-height-sm` (36) en panel.
- Peso 500, tracking `--tracking-button`, padding lateral 20–24 px.
- Hover: `--color-primary-strong` (primario) o borde azul (secundario), en `--motion-fast`, **solo bajo `@media (hover: hover)`**.
- Estado de carga: el botón conserva su ancho, muestra spinner + texto ("Reservando…"), y queda `aria-busy="true"`. No se sustituye el texto por un spinner solo. **Cargando no es deshabilitado:** conserva opacidad 1 (y por tanto su contraste AA) y usa `cursor: progress`; la opacidad reducida se reserva para `disabled`.
- `disabled`: `--opacity-disabled`, `cursor: not-allowed`, sin hover. Un botón deshabilitado **siempre** explica por qué en texto cercano o tooltip accesible.
- Prohibido: gradientes, sombras de color, botones de solo icono para acciones destructivas, dos botones primarios juntos.

### 12.2 Enlace

Azul `--color-primary`, subrayado con `text-underline-offset: 0.2em`. En navy: `--color-primary` resuelto a `primary-bright`. Un enlace que no se distingue del texto salvo por color falla accesibilidad: dentro de párrafos, siempre subrayado.

### 12.3 Campo de formulario

- Fondo `--color-surface`, borde `--color-border-strong`, radio `--radius-sm`, alto `--field-height`.
- **Label siempre visible arriba** del campo. Placeholder no sustituye label nunca.
- Foco: borde `--color-primary` + `--focus-halo`. El halo cambia de color con el estado (azul normal, rojo en error).
- Error: borde `--color-danger-border`, mensaje debajo con icono, texto `--color-danger-fg`, `aria-describedby` apuntando al mensaje.
- Ayuda: texto `--fs-body-sm` en `--color-fg-secondary` debajo del campo, antes del error.
- Campos obligatorios: se marca lo **opcional**, no lo obligatorio, cuando la mayoría es obligatoria.
- Validación al `blur` y al enviar. Nunca en cada tecla — salvo fuerza de contraseña y disponibilidad de correo.

### 12.4 Card

Fondo `--color-surface`, radio `--radius-lg`, padding 24 px (16–20 en panel), elevación 1 o borde según §8.2. Un card es una unidad de contenido con un solo asunto: si tiene dos acciones primarias, son dos cards.

### 12.5 Tabla (panel)

- Cabecera: `--fs-body-sm`, peso 600, `--color-fg-secondary`, borde inferior `--color-border`, sticky.
- Filas de 44 px, hover `--color-surface-sunken` solo con puntero real, separadores horizontales únicamente (sin líneas verticales).
- Cifras y fechas alineadas a la derecha con `tabular-nums`.
- Acciones al final de la fila; las destructivas nunca como primera acción.
- Sin datos → empty state dentro del cuerpo de la tabla, no un mensaje suelto arriba.
- En móvil, la tabla se convierte en lista de cards; **no** se scrollea horizontalmente una tabla de 8 columnas en un teléfono.

### 12.6 Chip / badge de estado

`--radius-sm`, `--fs-caption` en caja alta con tracking, fondo `*-bg`, texto `*-fg`, borde `*-border`. **Siempre lleva palabra**, nunca solo color. Estados del dominio: activa, por vencer, vencida, pendiente, cancelada, pagada.

### 12.7 Modal y drawer

- Scrim `rgba(13,27,42,.6)`, elevación 3, radio `--radius-lg`, ancho máximo 560 px (modal) / 420 px (drawer lateral).
- Se cierra con Escape, con clic en el scrim y con botón explícito. **Excepción:** un modal de confirmación destructiva no se cierra por clic en scrim.
- Foco atrapado dentro mientras está abierto; al cerrar, vuelve al elemento que lo abrió.
- Un modal no abre otro modal. Si el flujo lo pide, el flujo está mal.
- Drawer para contexto lateral (filtros, detalle rápido); modal para decisiones que bloquean.

### 12.8 Toast

Esquina inferior derecha (escritorio) / superior (móvil, respetando `--safe-top`). 4 s para éxito, persistente con cierre manual para error. `role="status"` (éxito) o `role="alert"` (error). Nunca dos toasts simultáneos: se encolan.

### 12.9 Tabs y acordeón

Tabs para contenido paralelo y corto; acordeón para contenido largo y opcional (FAQ). El tab activo se marca con peso, color y una línea inferior de 2 px en `--color-primary` — nunca solo color. Navegación por flechas del teclado en tabs; `aria-expanded` en acordeón.

### 12.10 Skeleton

Bloques de `--color-surface-sunken` con el radio del elemento que reemplazan, pulso ≤1.2 s, desactivado con reduced motion. **Nunca spinner de página completa** en vistas que ya conocen su estructura.

### 12.11 Paginación

Mostrar rango y total ("11–20 de 143"). Tamaños de página: 10/25/50. La selección persiste en la sesión. En móvil: "cargar más" en lugar de números.

---

## 13. Estados obligatorios

Toda vista o componente que consuma datos declara **cinco** estados. No declarar uno es un defecto, no una omisión menor.

| Estado | Qué se muestra |
|---|---|
| **Default** | Contenido normal |
| **Loading** | Skeleton con la forma del contenido real (no spinner genérico) |
| **Empty** | Icono de línea + título en una frase + explicación breve + acción para salir del vacío |
| **Error** | Qué falló en lenguaje humano + qué puede hacer el usuario + botón "Reintentar" |
| **Success** | Confirmación explícita de que la acción se completó (toast o cambio de estado visible) |

### 13.1 Empty states

Estructura fija: icono 32 px `--color-fg-muted` · título `--fs-h3` · descripción `--fs-body` en `--color-fg-secondary` · acción primaria (si existe salida). Sin ilustraciones decorativas, sin humor, sin frases motivacionales.

### 13.2 Errores del API

El API devuelve `{ title, detail, key, code }`. La UI muestra **`title` como encabezado del mensaje y `detail` como cuerpo**; `key` y `code` nunca se muestran al usuario, solo se registran. Nada de "Error 500" ni de JSON crudo en pantalla.

Jerarquía de presentación:

| Alcance del error | Presentación |
|---|---|
| Un campo | Mensaje bajo el campo |
| Un formulario | Bloque de alerta arriba del formulario, foco movido a él |
| Una vista | Estado de error de la vista, con reintento |
| Global (red, sesión) | Toast persistente; si es sesión expirada, redirección a login con aviso |

---

## 14. Densidad

| Superficie | Alto de campo | Fila de tabla | Padding de card | Cuerpo |
|---|---|---|---|---|
| Sitio | 48 px | — | 24–32 px | 16–18 px |
| Portal | 48 px | — | 24 px | 16 px |
| Panel | 36 px | 44 px | 16–20 px | 14 px |

La densidad es lo único que cambia entre superficies. Color, tipografía, radios, motion e iconografía son idénticos.

---

## 15. Formularios — reglas de flujo

1. Un formulario largo se parte en pasos con progreso visible, no en un scroll infinito.
2. El botón de envío queda deshabilitado solo mientras se envía, **no** por validación pendiente: el usuario debe poder intentar y recibir explicación.
3. Al fallar el envío, el foco se mueve al primer campo con error y el mensaje se anuncia (`aria-live="polite"`).
4. Los datos capturados no se pierden ante un error de red.
5. Autocompletado (`autocomplete`, `inputmode`, `type`) correcto en todos los campos: teléfono, correo, nombre, tarjeta. Esto vale más que cualquier detalle estético en móvil.
6. Consentimiento LFPDPPP en registro: casilla explícita, sin premarcar, con enlace al aviso de privacidad.

---

## 16. Data viz (panel y portal)

- Series en orden `--data-1` … `--data-8`: azul de marca, ink, azul claro, gris, y después estados.
- Sin 3D, sin sombras, sin gradientes en series. Grid horizontal tenue (`--color-border`), sin grid vertical.
- Ejes y etiquetas en `--fs-body-sm`, `--color-fg-secondary`, con `tabular-nums`.
- Nunca solo color para distinguir series: etiqueta directa o patrón/marcador.
- Máximo 5 series por gráfica. Más de eso es una tabla, no una gráfica.
- Toda gráfica declara sus estados de §13: sin datos, cargando, error.

---

## 17. Accesibilidad — línea base

Objetivo: **WCAG 2.1 AA en las tres superficies.**

1. Contraste: texto normal ≥4.5:1, texto grande y elementos de UI ≥3:1. Tabla de §3.3 como referencia obligatoria.
2. Todo lo accionable es alcanzable y operable por teclado, en orden lógico, con foco visible (`:focus-visible` global en tokens).
3. Ningún `outline: none` sin sustituto visible. Es motivo de rechazo automático de PR.
4. Estructura semántica: un `h1` por página, jerarquía sin saltos, landmarks (`header`, `nav`, `main`, `footer`), listas reales.
5. Imágenes con `alt` descriptivo; decorativas con `alt=""`. Iconos funcionales con `aria-label`.
6. Nunca solo color para comunicar estado: siempre texto o icono acompañando.
7. Formularios: `label` asociado, errores con `aria-describedby`, agrupaciones con `fieldset`/`legend`.
8. Movimiento: `prefers-reduced-motion` respetado globalmente.
9. Zoom al 200 % sin pérdida de contenido ni scroll horizontal.
10. Idioma declarado (`lang="es-MX"`), textos en español, sin emojis.

---

## 18. Z-index

Escala cerrada. Ningún componente inventa valores; si algo no cabe en la escala, se discute aquí.

| Token | Valor | Capa |
|---|---|---|
| `--z-base` | 0 | Contenido |
| `--z-raised` | 10 | Card elevado, dropdown en flujo |
| `--z-sticky` | 100 | Cabecera de tabla, barras sticky |
| `--z-header` | 200 | Header del sitio, nav fija |
| `--z-drawer` | 300 | Drawer y su scrim |
| `--z-modal` | 400 | Modal y su scrim |
| `--z-toast` | 500 | Notificaciones |
| `--z-tooltip` | 600 | Tooltips |

Prohibido: `z-index: 9999`, valores negativos para "esconder", y apilamientos resueltos por prueba y error.

---

## 19. Responsive

### 19.1 Breakpoints

375 (xs) · 414 (sm) · 768 (md) · 1024 (lg) · 1280 (xl) · 1440 (2xl). Mobile-first: se escribe el estado base para móvil y se sube con `min-width`. Los `-down` existen solo para código heredado.

Los valores viven duplicados en `tokens.css` (`--bp-*`) y `breakpoints.css` (custom media). **Cualquier cambio se hace en ambos archivos en el mismo commit.**

### 19.2 Comportamiento por rango

| Rango | Sitio | Portal | Panel |
|---|---|---|---|
| < 768 | Una columna, nav en drawer, hero a pantalla completa | Una columna, acciones al alcance del pulgar, barra inferior | Tablas convertidas en cards, filtros en drawer |
| 768–1023 | Dos columnas en grids de cards | Dos columnas en listados | Tabla con columnas prioritarias |
| ≥1024 | Layout completo, nav horizontal | Layout con sidebar | Tabla completa, sidebar fijo |
| ≥1440 | Contenido limitado a `--content-max`; los banners siguen a sangre | Igual | Igual |

### 19.3 Táctil

- Objetivo mínimo 44 px; separación mínima 8 px entre objetivos.
- `@media (hover: hover)` obligatorio para todo estado hover: sin eso, en touch el estado queda pegado tras el tap.
- Gestos (swipe para cancelar, pull to refresh) siempre con equivalente por botón visible.
- Sin tooltips como única fuente de información en móvil.

---

## 20. Fotografía e imagen

- **Sí:** luz natural, blanco y negro arquitectónico, mucho aire, equipo profesional visible pero ordenado, gestos reales de entrenamiento, planos amplios del espacio.
- **No:** stock de gimnasio saturado, músculo en primer plano, antes/después, poses agresivas, filtros naranjas de cadena comercial, texto quemado sobre la imagen.
- Referencia directa: el render del local del cliente (fachada blanca, cancel negro, interior limpio con racks alineados).
- Texto sobre imagen: solo con capa de contraste (navy translúcido ≥55 %) verificando 4.5:1 sobre la zona más clara de la foto.
- Relaciones de aspecto del sistema: 16:9 (banner), 4:3 (card), 1:1 (avatar, red social), 3:4 (retrato vertical). Otras relaciones requieren justificación en el override de la página.

---

## 21. Voz en la interfaz

- **Segunda persona, presente, sin adornos.** "Reserva tu sesión", no "¡Reserva ahora tu increíble sesión!".
- Botones con verbo de acción concreto: "Reservar", "Cancelar reserva", "Guardar cambios". Nunca "Aceptar", "OK" ni "Enviar" a secas.
- Mensajes de error: qué pasó + qué hacer. Sin culpar al usuario, sin jerga técnica, sin disculpas largas.
- Cifras y fechas en formato mexicano: `13 ago 2026`, `$1,200.00 MXN`, horario de 24 h en el panel y 12 h con am/pm en el portal.
- Sin emojis, sin signos de exclamación múltiples, sin mayúsculas para gritar.
- Terminología del dominio, fija: **atleta** (no cliente ni usuario en la UI pública), **sesión** (no clase), **membresía**, **acceso**, **reserva**. El sufijo de marca no se escribe literal en ningún string (§1.2).

---

## 22. Anti-patrones

Lista de rechazo directo en revisión:

1. Hex literal en el SCSS de un componente en vez de un token.
2. Primitiva de rampa (`--color-primary-300`) usada directo en un componente — incluido `--color-primary-900` como fondo de la barra del panel, que ahora es `--color-bg-nav` (§4.4).
3. Azul de marca (`#1046D6`) como texto sobre navy.
4. Más de tres apariciones de azul en una misma pantalla.
5. Dos botones primarios en la misma vista.
6. Borde y sombra en el mismo elemento.
7. Radio mayor a 16 px en una pieza de datos (campo, tabla, modal, chip, toast), mayor a 16 px en portal o panel, o mayor a 26 px en cualquier superficie, fuera de los botones pill.
8. Display en peso 700; peso 600 fuera de la cifra de precio; tracking negativo fuera de la tabla de §5.3, o en cualquier texto por debajo de 20 px.
9. Texto en `--color-fg-muted` como párrafo de contenido.
10. Estado comunicado solo por color.
11. `outline: none` sin foco alternativo visible.
12. Spinner de página completa donde cabe un skeleton.
13. Vista con datos sin sus cinco estados.
14. Hover fuera de `@media (hover: hover)`.
15. `z-index` fuera de la escala.
16. Emojis en cualquier superficie o documento.
17. Animación superior a 300 ms en portal o panel.
18. Tabla de más de 4 columnas con scroll horizontal en móvil.
19. Texto sobre foto sin capa de contraste verificada.
20. Copy que promete resultados en X días, muestra antes/después o vende "grupos reducidos" como eje.

---

## 23. Checklist pre-PR

Se ejecuta archivo por archivo sobre lo tocado. Sin esta revisión, la tarea no está entregada.

**Tokens y color**
- [ ] Cero hex literales; todo por `var(--...)`.
- [ ] Solo alias semánticos, no primitivas.
- [ ] Contraste verificado en claro y en navy si el componente vive en ambos.
- [ ] Máximo tres apariciones de azul en la pantalla.

**Tipografía y espacio**
- [ ] Tamaños de la escala; nada bajo 12.5 px.
- [ ] Display en un peso permitido (300/400/500/560, y 600 solo en precio); tracking negativo solo según la tabla de §5.3 y nunca por debajo de 20 px.
- [ ] Espaciados del grid de 4 pt.
- [ ] Párrafos dentro de `--measure`.
- [ ] Radios dentro de la tabla de §7 para la superficie que corresponde (tope 16 px en portal y panel).

**Componentes y estados**
- [ ] Una sola acción primaria por vista.
- [ ] Los cinco estados declarados (default/loading/empty/error/success).
- [ ] Errores del API presentados con `title` + `detail`.
- [ ] Hover dentro de `@media (hover: hover)`; foco visible.

**Accesibilidad**
- [ ] Recorrido completo por teclado.
- [ ] `alt`, `aria-label` y `label` correctos.
- [ ] Ningún estado solo por color.
- [ ] Zoom 200 % sin scroll horizontal.

**Responsive y rendimiento**
- [ ] Verificado en 375, 768, 1024 y 1440.
- [ ] Objetivos táctiles ≥44 px en móvil.
- [ ] Imágenes con dimensiones declaradas y lazy salvo hero.
- [ ] En el sitio: sin regresión de LCP/CLS/INP.

**Marca**
- [ ] Sin emojis.
- [ ] Iconos de línea, una tinta, `currentColor`.
- [ ] Sufijo de marca no escrito literal (sale de `SITE_BRAND_*`).
- [ ] Copy dentro del territorio de mensaje (§1.1).

---

## 24. Cómo extender

### 24.1 Agregar un token
1. Justificar por qué los existentes no bastan.
2. Agregarlo en `tokens.css` en su sección, con comentario de uso.
3. Documentarlo aquí, con ratio de contraste si es color.
4. Registrar el cambio en `CHANGELOG.md` con versión.

### 24.2 Override por página
Copiar `pages/_TEMPLATE.md` como `pages/<slug>.md` y documentar **solo lo que cambia y por qué**. Si no hay justificación funcional, el override no debe existir.

### 24.3 Componente nuevo
1. Verificar que no exista uno que resuelva el caso con una variante.
2. Definir sus cinco estados antes de escribir CSS.
3. Documentarlo en §12 con su tabla de variantes.
4. Verificarlo en las superficies donde va a vivir (claro y navy si aplica).

### 24.4 Versionado
Semver del sistema: **mayor** cambia identidad (paleta, tipografía), **menor** agrega tokens o componentes, **parche** corrige valores sin cambiar decisiones.

---

## 25. Gobernanza

| Control | Estado | Responsable | Objetivo |
|---|---|---|---|
| Lint de terminología (sufijo de marca, "grupos de 6", emojis) | Activo en `vmh-website` | Wilvardo | Extender a portal y panel al crearse |
| Verificación de contraste al agregar color | Manual, obligatoria en PR | Wilvardo | Automatizar con script cuando existan 3 repos |
| Auditoría de accesibilidad (axe) en CI | Pendiente | Wilvardo | Al arrancar `vmh-portal` |
| Regresión visual | Pendiente | Wilvardo | Cuando el catálogo de componentes esté estable |
| Revisión del sistema contra la marca | Al recibir vectoriales y tipografía original del cliente | Wilvardo + cliente | Bloqueante para señalética y papelería |

**Riesgos abiertos del sistema:** (1) el sufijo de marca sin resolver en IMPI bloquea impresión; (2) Jost es sustituto y la tipografía definitiva puede alterar la métrica vertical de todos los titulares —y con la 1.1.0 el riesgo creció, porque ahora hay tracking negativo calibrado sobre una métrica que puede cambiar; (3) `vmh-portal` y `vmh-landlord` aún no consumen estos tokens — cada semana que pasa sin compartirlos aumenta el costo de alinearlos.

### 25.1 Deuda declarada del sitio (2026-08-22)

Tres defectos que **no cambian lo que se ve** y que por eso sobrevivieron a la decisión de la 1.1.0. Ninguno es urgente; los tres encarecen cada componente nuevo. Se cierran en el próximo trabajo que toque el slice correspondiente, no en un refactor aparte.

| # | Defecto | Alcance | Por qué importa |
|---|---|---|---|
| 1 | `data-surface="deep"` declarado en `tokens.css` y usado por nadie: seis zonas navy invierten color a mano | `homeHero`, `homeDiffs`, `homePlatform`, `homePromise`, `homeGallery`, `siteFooter` | Cada componente que quiera vivir en navy hay que vestirlo otra vez. Es el mecanismo que hace barato el portal cuando arranque |
| 2 | Hover fuera de `@media (hover: hover)` en todo el sitio salvo `homeServices__img` | `.btn`, header, footer, chips, calendario, galería | Estados pegados en táctil: el usuario toca, el estado se queda, y no hay forma de quitarlo sin tocar otra cosa |
| 3 | `z-index` literales 50 (header) y 60 (WhatsApp) fuera de la escala `--z-*` | `siteHeader`, `whatsappFloat` | El día que entre un modal o un toast, la escala no sirve para razonar y se arregla subiendo números |

Deuda menor del mismo diagnóstico, sin fecha: las utilidades de `_typography.scss` no consumen los tokens `--fs-*` (declaran sus propios `clamp`), `--space-section` no se usa en ninguna sección, `--elevation-*` solo aparece en `/agendar`, y hay espaciados fuera del grid de 4 (13.5, 15.5, 17, 19, 21, 30, 34, 38, 42, 60, 68, 72 px).

---

**Versión:** 1.2.0 · **Fecha:** 2026-08-22 · **Propietario:** Wilvardo Ramírez Colunga
**Próxima revisión:** al entregarse el vectorial y la tipografía original del cliente, o al arrancar `vmh-portal`.
