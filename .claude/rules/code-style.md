# Estilo de código

## TypeScript

- Modo estricto siempre. Cero `any`. Si el backend devuelve un campo no declarado en una interface global, crear un tipo local de extensión en `domain/`.
- Tipar explícitamente los retornos de funciones públicas.
- Usar `as unknown as Type` solo cuando no haya alternativa y dejar comentario justificando.

## Idioma del código

- **El código se escribe en inglés; se documenta en español.** Nombres de clases, funciones, variables, tipos, props, composables y archivos (dentro de la convención de nomenclatura de `architecture.md`) van en **inglés**. Comentarios, JSDoc y los `describe`/`it` de los tests van en **español**.
- Ningún linter detecta el idioma natural de forma fiable, así que esto se valida en **review** (no por hook). Ver `architecture.md` → "Nomenclatura" para el estándar de nombres de archivo.

## JSDoc

- **Obligatorio en toda función con lógica** — exportada o interna (helpers, composables, repositorios, funciones nombradas del `setup`) y en tipos públicos. Las **funciones exportadas lo tienen enforzado por lint** (`jsdoc/require-jsdoc` con `publicOnly` + `jsdoc/require-description`); las internas y el idioma español se validan en review.
- En **español**. **Sin `@example`** (ni snippets de uso en comentarios). Solo explicación del propósito.
- Etiquetas válidas: `@param`, `@returns`, `@throws`, `@bug`, `@deprecated`.
- **Excepciones** (no requieren JSDoc): arrow triviales de una línea sin lógica (getters de `computed`, mappers inline), callbacks anónimos, y los callbacks de `describe`/`it` en archivos `*.spec.ts`.

## Comentarios en línea

- Cortos, específicos, **explican el por qué**, nunca el qué.
- Si el código es autoexplicativo, no se comenta.
- No usar comentarios decorativos (`// ====`, etc.).

## Manejo de errores por capa

- **`infrastructure/`** propaga errores. No usa `try/catch` salvo para mapear el error a un valor de fallback documentado (ej. `isImageReachable` → `false`). Cada función que puede fallar declara `@throws` en su JSDoc.
- **`application/`** envuelve la invocación de repos en `try/catch` y traduce el error a UX: toast, lista vacía, fullLoader off. El catch tipa el error como `unknown`; si necesita leer detalle del backend, hace cast seguro (`(error as { data?: { message?: string } })?.data?.message`), nunca `any` ni `// @ts-ignore`.
- **Registro:** dentro del catch usar `console.error('useFoo: error al <acción>', error)` con prefijo identificable del composable o repo. Ver `forbidden.md` para la regla global de `console`.
- **No relanzar** desde `application/` salvo que el orquestador (`script.ts`) tenga una rama específica para ese error. En la práctica los composables atrapan, registran y muestran feedback.

## Constantes y enums del dominio

Toda configuración del dominio (límites, etiquetas, claves de storage, sets finitos) vive en `domain/` y se nombra en SCREAMING_SNAKE_CASE.

- **Constantes simples** (números, strings sueltos) → `<slug>.const.ts`, exportadas:
  ```ts
  export const MAX_VISIBLE_ITEMS = 3
  export const LABEL_TRUNCATE_LIMIT = 25
  export const ELLIPSIS_LABEL = '...'
  ```
- **Sets finitos / enums** → `<slug>.enum.ts`. Preferir `const X = { ... } as const` sobre `enum` nativo (mejor tree-shaking y sin runtime extra):
  ```ts
  export const NOTIFICATION_ROLE = {
    RH: 2,
  } as const
  export type NotificationRole = (typeof NOTIFICATION_ROLE)[keyof typeof NOTIFICATION_ROLE]
  ```
- **Constantes privadas de un módulo** (no exportadas, internas a un repo/composable) van al tope del archivo como `const` simple en SCREAMING_SNAKE_CASE:
  ```ts
  const LANGUAGE_STORAGE_KEY = 'rh-language'
  const DEFAULT_PAGE = 1
  ```

Si una constante se reusa fuera del slice, mover a `domain/` con `export`. Mientras solo la use un archivo, mantenerla local.

Para estilos SCSS, ver `styles.md`.
