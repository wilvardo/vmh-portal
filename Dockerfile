# syntax=docker/dockerfile:1
#
# Imagen del portal del atleta de VMH (USVMH1783637340000): SPA estatica.
#
# `nuxt generate` con `ssr: false` produce archivos planos; los sirve Caddy con
# regreso a `index.html` para que una ruta del cliente abierta directo o
# recargada no responda 404.
#
# **La configuracion se fija en el build, no al arrancar.** En una SPA no hay
# servidor que lea el entorno: `runtimeConfig.public` queda escrito en el HTML
# generado. Por eso `BASE_API_PATH` y `SITE_BASE_URL` entran como build args
# y cambiar de entorno exige reconstruir la imagen. Nada de esto es secreto:
# todo viaja al navegador.

ARG NODE_VERSION=24

FROM node:${NODE_VERSION}-alpine AS build
ENV PNPM_HOME=/pnpm \
    PATH=/pnpm:$PATH \
    HUSKY=0
RUN corepack enable
WORKDIR /app

# `pnpm fetch` solo necesita el lockfile (y `.npmrc`, que fija el hoisting): la
# descarga queda en su propia capa y no se repite cuando cambia el codigo.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
RUN pnpm fetch

COPY . .
# `pnpm fetch` deja un `node_modules` a medias que `install` reconstruye; sin
# TTY pnpm pide confirmacion para hacerlo y aborta, de ahi la bandera.
RUN pnpm install --frozen-lockfile --offline --config.confirmModulesPurge=false

ARG BASE_API_PATH
ARG SITE_BASE_URL
ENV BASE_API_PATH=${BASE_API_PATH} \
    SITE_BASE_URL=${SITE_BASE_URL}
RUN pnpm generate

FROM caddy:2-alpine AS runtime
COPY docker/Caddyfile /etc/caddy/Caddyfile
COPY --from=build /app/.output/public /srv
EXPOSE 8080

HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=5 \
  CMD wget -qO- "http://127.0.0.1:8080/" > /dev/null || exit 1
