/**
 * Veredicto local sobre la contrasena nueva: el problema a explicar, o cadena
 * vacia si puede enviarse.
 */
export type PasswordValidation = '' | 'password_short' | 'password_mismatch'
