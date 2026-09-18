export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // Sin limite de longitud en mensajes de commit (header/body/footer).
    'header-max-length': [0],
    'body-max-line-length': [0],
    'footer-max-line-length': [0]
  }
}
