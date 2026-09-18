# vmh-portal

Portal del atleta de la Plataforma VMH. Nuxt 4 en modo SPA con PrimeVue 4 y el design system de la marca.

Aqui el atleta abre su cuenta, entra, consulta su membresia y reserva sus sesiones. El procesamiento vive en `vmh-api`.

## Requisitos

- Node >= 24 (ver `.nvmrc`)
- pnpm 10
- `vmh-api` levantado en `http://127.0.0.1:3399`

## Arranque

```bash
cp .env.example .env
pnpm install
pnpm dev            # http://127.0.0.1:3002
```

## Verificacion

```bash
pnpm validate       # lint + estilos + tokens + terminologia + convenciones + tipos + pruebas
pnpm build
```

## Estructura

Cada pantalla es una rebanada vertical en `app/pages/<slug>/`: `index.vue` para la vista, `script.ts` para el montaje, `application/` para los casos de uso y `infrastructure/` para el acceso al API. Las reglas completas estan en `.claude/rules/`.
