# Marcas de refactor

Durante una migración o limpieza, conservar el código viejo comentado al final del archivo con marcas explícitas:

```ts
// MOVED-TO: app/components/<slice>/application/use-<algo>.ts
// DEAD-CODE: <razón breve, p. ej. "nunca invocado, ver issue #123">
```

Marcas vivas a respetar:
- `MOVED-TO:` indica que la lógica vive ahora en otro archivo. Borrar solo cuando el nuevo flujo lleve tiempo en producción.
- `DEAD-CODE:` listo para borrar en la siguiente pasada de limpieza.
- `// TODO:` con descripción y contexto (no `// TODO` solo).
- `@bug` en JSDoc para bugs heredados conocidos que aún no se atienden.
