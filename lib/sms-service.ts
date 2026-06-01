/** Servicio SMS/Push — en producción conectar Twilio, Firebase FCM, etc. */
export async function sendSms(phone: string, message: string) {
  if (process.env.NODE_ENV === "development") {
    console.log("\n📱 SMS/PUSH ──────────────────────")
    console.log(`Para: ${phone}`)
    console.log(message)
    console.log("─────────────────────────────────\n")
  }
  // Integración real: await twilio.messages.create({ to: phone, body: message })
  return { ok: true }
}

export async function sendPushNotification(phone: string | null, title: string, body: string) {
  if (!phone) return { ok: false, reason: "no_phone" }
  return sendSms(phone, `${title}: ${body}`)
}
