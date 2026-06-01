/** Correo institucional: nombre.apellido@usmp.pe */
export const USMP_EMAIL_REGEX = /^[a-z0-9]+(\.[a-z0-9]+)*@usmp\.pe$/i

export function isValidUsmpEmail(email: string) {
  return USMP_EMAIL_REGEX.test(email.trim())
}

export function usmpEmailError(email: string) {
  const value = email.trim()
  if (!value) return "El correo es obligatorio"
  if (!value.toLowerCase().endsWith("@usmp.pe")) {
    return "Solo se permiten correos institucionales @usmp.pe"
  }
  if (!USMP_EMAIL_REGEX.test(value)) {
    return "Usa el formato nombre.apellido@usmp.pe (ej. juan.perez@usmp.pe)"
  }
  return null
}
