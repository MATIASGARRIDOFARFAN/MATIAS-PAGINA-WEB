export interface FilterResult {
  allowed: boolean
  filtered: string
  warnings: string[]
  blocked: boolean
}

const PHONE_PATTERNS = [
  /\b(\+?51\s?)?9\d{2}[\s-]?\d{3}[\s-]?\d{3}\b/gi,
  /\b\d{3}[\s-]?\d{3}[\s-]?\d{3}\b/g,
  /\b\d{9,11}\b/g,
]

const EMAIL_PATTERN = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/gi

const URL_PATTERNS = [
  /https?:\/\/[^\s]+/gi,
  /www\.[^\s]+/gi,
  /\b[a-z0-9-]+\.(com|pe|net|org|io|me|xyz|info)\b/gi,
]

const SENSITIVE_PATTERNS = [
  /\b(dni|documento|pasaporte|cuenta bancaria|tarjeta|cvv|clave)\b/gi,
]

export function filterMessageContent(content: string): FilterResult {
  const warnings: string[] = []
  let filtered = content
  let blocked = false

  for (const pattern of PHONE_PATTERNS) {
    if (pattern.test(content)) {
      warnings.push("No está permitido compartir números telefónicos.")
      filtered = filtered.replace(pattern, "[teléfono bloqueado]")
      blocked = true
    }
  }

  if (EMAIL_PATTERN.test(content)) {
    warnings.push("No está permitido compartir correos personales.")
    filtered = filtered.replace(EMAIL_PATTERN, "[correo bloqueado]")
    blocked = true
  }

  for (const pattern of URL_PATTERNS) {
    if (pattern.test(content)) {
      warnings.push("No está permitido compartir enlaces externos.")
      filtered = filtered.replace(pattern, "[enlace bloqueado]")
      blocked = true
    }
  }

  for (const pattern of SENSITIVE_PATTERNS) {
    if (pattern.test(content)) {
      warnings.push("Evita compartir datos personales sensibles.")
      blocked = true
    }
  }

  return {
    allowed: filtered.trim().length > 0,
    filtered: filtered.trim(),
    warnings: [...new Set(warnings)],
    blocked,
  }
}
