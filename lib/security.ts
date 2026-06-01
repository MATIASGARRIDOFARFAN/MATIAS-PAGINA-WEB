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

export function clampStars(value: number): number {
  return Math.min(5, Math.max(1, Math.round(value)))
}
