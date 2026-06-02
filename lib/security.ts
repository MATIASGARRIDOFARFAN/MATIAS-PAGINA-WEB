/** Sanitiza texto para prevenir XSS al mostrar en UI */
export function sanitizeText(input: string, maxLength = 5000): string {
  return input
    .trim()
    .slice(0, maxLength)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;")
}

export function sanitizeOptional(input: unknown, maxLength = 500): string | null {
  if (input == null || input === "") return null
  return sanitizeText(String(input), maxLength)
}

/** URLs (p. ej. avatar en Supabase). No usar sanitizeText: rompe las barras del path. */
export function sanitizeUrl(input: string, maxLength = 500): string {
  const trimmed = input.trim().slice(0, maxLength)
  if (!trimmed) return ""
  if (trimmed.startsWith("/") && !trimmed.includes("..")) return trimmed
  try {
    const url = new URL(trimmed)
    if (url.protocol !== "http:" && url.protocol !== "https:") return ""
    return url.href
  } catch {
    return ""
  }
}

/** Repara avatares guardados antes con sanitizeText (entidades HTML en la URL). */
export function normalizeAvatarUrl(avatar: string | null | undefined): string {
  if (!avatar) return ""
  let value = avatar.trim()
  if (!value) return ""
  if (value.includes("&#")) {
    value = value
      .replace(/&#x2F;/gi, "/")
      .replace(/&#47;/g, "/")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#x27;/g, "'")
  }
  return value
}

export function clampStars(value: number): number {
  return Math.min(5, Math.max(1, Math.round(value)))
}
