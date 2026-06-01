/** Correo institucional @usmp.pe (nombre.apellido o nombre_apellido, sin importar mayúsculas) */
export const USMP_EMAIL_REGEX = /^[a-z0-9][a-z0-9._-]*@usmp\.pe$/i

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
    return "Usa un correo @usmp.pe válido (ej. matias_garrido@usmp.pe o juan.perez@usmp.pe)"
  }
  return null
}
