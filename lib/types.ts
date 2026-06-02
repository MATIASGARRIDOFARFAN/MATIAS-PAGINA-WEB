export type ProductStatus =
  | "disponible"
  | "reservado"
  | "prestado"
  | "intercambiado"
  | "vendido"

export type RequestType = "compra" | "prestamo" | "intercambio"
export type RequestStatus = "pendiente" | "aceptada" | "rechazada" | "completada"

export const PRODUCT_STATUS_LABELS: Record<ProductStatus, string> = {
  disponible: "Disponible",
  reservado: "Reservado",
  prestado: "Prestado",
  intercambiado: "Intercambiado",
  vendido: "Vendido",
}

export const PRODUCT_STATUS_COLORS: Record<ProductStatus, string> = {
  disponible: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  reservado: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  prestado: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  intercambiado: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  vendido: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
}

export const REQUEST_STATUS_LABELS: Record<RequestStatus, string> = {
  pendiente: "Pendiente",
  aceptada: "Aceptada",
  rechazada: "Rechazada",
  completada: "Completada",
}

export const HISTORY_TYPE_LABELS: Record<string, string> = {
  compra: "Compra",
  venta: "Venta",
  prestamo: "Préstamo",
  intercambio: "Intercambio",
  solicitud_enviada: "Solicitud enviada",
  solicitud_recibida: "Solicitud recibida",
  actividad: "Actividad",
  request_received: "Solicitud recibida",
  request_accepted: "Solicitud aceptada",
  request_rejected: "Solicitud rechazada",
  message_received: "Mensaje",
  purchase_completed: "Compra completada",
  loan_completed: "Préstamo completado",
  rating_received: "Calificación",
  login_alert: "Inicio de sesión",
}

export const NOTIFICATION_TYPES = {
  REQUEST_RECEIVED: "request_received",
  REQUEST_ACCEPTED: "request_accepted",
  REQUEST_REJECTED: "request_rejected",
  MESSAGE_RECEIVED: "message_received",
  PURCHASE_COMPLETED: "purchase_completed",
  LOAN_COMPLETED: "loan_completed",
  RATING_RECEIVED: "rating_received",
  LOGIN_ALERT: "login_alert",
} as const

/** @deprecated Usar canRequestProduct de lib/product-availability con stock y solicitudes activas */
export function canRequestProductLegacy(status: string) {
  return status === "disponible"
}

export function fullName(firstName: string, lastName: string) {
  return `${firstName.trim()} ${lastName.trim()}`.trim()
}
