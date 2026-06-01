/** Servicio de correo — en producción conectar SendGrid, Resend, etc. */
export async function sendEmail(to: string, subject: string, body: string) {
  if (process.env.NODE_ENV === "development") {
    console.log("\n📧 EMAIL ─────────────────────────")
    console.log(`Para: ${to}`)
    console.log(`Asunto: ${subject}`)
    console.log(body)
    console.log("─────────────────────────────────\n")
  }
  // Integración real: await resend.emails.send({ from, to, subject, html: body })
  return { ok: true }
}

export function loginAlertEmailHtml(name: string, date: string) {
  return `
    <h2>Alerta de inicio de sesión</h2>
    <p>Hola ${name},</p>
    <p>Se detectó un inicio de sesión en tu cuenta USMP Market el ${date}.</p>
    <p>Si no fuiste tú, cambia tu contraseña de inmediato.</p>
  `
}

export function notificationEmailHtml(title: string, body: string) {
  return `<h2>${title}</h2><p>${body}</p><p>— USMP Market</p>`
}
