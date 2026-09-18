# VMH — OWNERS.md

> Mapeo vigente **rol → persona** del sistema de diseño. Se actualiza conforme cambia el equipo del proyecto.
>
> Separado del `MASTER.md` a propósito: el MASTER documenta el qué y el cómo del sistema y debe envejecer
> bien sin depender de nombres propios. Este archivo es deliberadamente transitorio.
>
> **Regla:** al agregar o quitar personas, modificar solo este archivo. Nunca introducir nombres propios
> en `MASTER.md` ni en `tokens.css`.

---

## Roles

| Rol | Persona | Responsabilidad |
|---|---|---|
| Dueño del sistema de diseño | Wilvardo Ramírez Colunga | Fuente de verdad del sistema. Aprueba cambios a `MASTER.md` y `tokens.css`. Responsable técnico de las tres superficies. |
| Dueño de la marca | Cliente VMH | Entrega y aprueba identidad: lockup, tipografía, fotografía. Su material manda sobre el sistema. |
| Operación del estudio | Cliente / recepción | Valida que el panel refleje la operación real (reservas, membresías, cobros). |
| Implementación | Wilvardo Ramírez Colunga | Website, portal y panel. Único responsable de cumplimiento del checklist pre-PR mientras no haya más devs. |
| QA / accesibilidad | _Vacante — asumido por Wilvardo_ | Recorrido por teclado, contraste, responsive. Se delega cuando entre un dev al proyecto. |

---

## Proceso de cambios

1. **Cambios de identidad** (paleta, tipografía, lockup): los origina el cliente. Se registran primero en
   `00-brain/05-consultorias/03-vmh/paquete-lanzamiento/04-branding/00-referencia-cliente.md`, luego bajan
   a `MASTER.md` y `tokens.css`, y solo entonces al código. Versión **mayor** en el CHANGELOG.
2. **Cambios al sistema** (`MASTER.md` / `tokens.css`): requieren contraste verificado y entrada en
   `CHANGELOG.md`. Un token de color sin ratio documentado no entra.
3. **Overrides por página**: siguen `pages/_TEMPLATE.md`. Sin justificación funcional, no deben existir.
4. **Cambios a este archivo**: trivial, directo.

---

## Qué revisa cada superficie antes de un deploy

| Superficie | Revisión mínima |
|---|---|
| `vmh-website` | Checklist pre-PR completo + Core Web Vitals + lint de terminología (sufijo de marca, emojis, "grupos de 6") |
| `vmh-portal` | Checklist pre-PR + recorrido táctil real en teléfono + estados de membresía |
| `vmh-landlord` | Checklist pre-PR + densidad de tabla + bitácora visible en overrides |

---

**Última actualización:** 2026-08-12
**Próxima revisión:** al incorporarse un desarrollador al proyecto VMH o al entregar el cliente los
vectoriales y la tipografía original.
