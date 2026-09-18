# Convenciones del proyecto — vmh-portal

Instrucciones especificas para este repo (portal del atleta de la Plataforma VMH, Nuxt 4 SPA + PrimeVue 4). Complementan (no reemplazan) las preferencias globales del usuario.

Las reglas viven en archivos separados por tema bajo `.claude/rules/`:

@.claude/rules/architecture.md
@.claude/rules/components.md
@.claude/rules/pages.md
@.claude/rules/code-style.md
@.claude/rules/styles.md
@.claude/rules/i18n.md
@.claude/rules/testing.md
@.claude/rules/refactor.md
@.claude/rules/forbidden.md
@.claude/rules/data-safety.md
@.claude/rules/compliance-check.md

> **REGLA META — INNEGOCIABLE.** Antes de reportar cualquier tarea como completa, ejecuta la auditoria de `compliance-check.md` archivo-por-archivo de los que tocaste, y reporta el resultado con la linea **Compliance** al final de la respuesta. **Sin esa linea, la tarea no esta entregada**. Si encuentras una violacion, vuelve a editar antes de reportar. Aplica a todo edit, refactor, scaffold o fix, sin importar el tamano.

> **Contexto de producto.** Este repo es la superficie del atleta: su cuenta, su membresia y sus reservas, desde el telefono y en sesiones cortas. SPA detras de sesion (`ssr: false`, `noindex`), es-only (`no_prefix`), marca via `PORTAL_BRAND_NAME` (sufijo pendiente de IMPI). Todo el procesamiento vive en `vmh-api`: **el portal muestra y envia, el API decide**. El plan de trabajo y los specs viven en `00-brain/05-consultorias/03-vmh/02-plannings/` (fuera de este repo).

> **Quien entra aqui.** SOLO el rol `athlete`. Una cuenta de mostrador (`admin`, `receptionist`, `coach`) que llegue con sesion valida se rechaza y se le cierra la sesion local: su herramienta es el panel. Es la imagen espejo de la regla del landlord, que rechaza al atleta.

> **Frontera de cliente.** El directorio hermano `_referencia-esqueleto-landlord` es el clon del repositorio de OTRO cliente. Puede leerse como referencia de forma; **no se copia de ahi codigo, historial, textos ni configuracion**. `pnpm lint:terminology` lo verifica en cada commit.

> **Referencia estructural.** Este repo es espejo de `vmh-landlord`: misma organizacion por rebanadas verticales, mismas fronteras hexagonales, mismo tooling, mismo nucleo de sesion. Lo que cambia es la densidad (portal de consumo, movil primero), el rol admitido y que aqui hay pantallas publicas de alta.

## Verificacion antes de entregar

```bash
pnpm validate   # lint + estilos + terminologia + convenciones + tipos + pruebas
```

Nada se entrega sin esto en verde.
