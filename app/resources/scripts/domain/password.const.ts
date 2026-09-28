/**
 * Largo minimo de contrasena. Doce, igual que el API: si el formulario pidiera
 * menos, el rechazo llegaria del servidor despues de que la persona ya creyo
 * haber terminado.
 *
 * Vive aqui y no en un slice porque la exigen dos pantallas que fijan
 * contrasena (el enlace de recuperacion y el primer acceso): si cada una tuviera
 * su copia, el dia que el API la suba solo se actualizaria una.
 */
export const PASSWORD_MIN_LENGTH = 12
