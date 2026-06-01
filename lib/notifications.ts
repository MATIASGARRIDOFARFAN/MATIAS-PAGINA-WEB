import { prisma } from "@/lib/prisma"
import { sendEmail, notificationEmailHtml, loginAlertEmailHtml } from "@/lib/email-service"
import { sendPushNotification } from "@/lib/sms-service"
import type { NOTIFICATION_TYPES } from "@/lib/types"

type NotificationType = (typeof NOTIFICATION_TYPES)[keyof typeof NOTIFICATION_TYPES]

interface NotifyOptions {
  userId: string
  type: NotificationType | string
  title: string
  body: string
  metadata?: Record<string, unknown>
  sendEmail?: boolean
  sendPush?: boolean
}

export async function createNotification(opts: NotifyOptions) {
  const user = await prisma.user.findUnique({
    where: { id: opts.userId },
    select: { email: true, phone: true, name: true, emailVerified: true },
  })
  if (!user) return null

  const notification = await prisma.notification.create({
    data: {
      userId: opts.userId,
      type: opts.type,
      title: opts.title,
      body: opts.body,
      metadata: opts.metadata ? JSON.stringify(opts.metadata) : null,
    },
  })

  if (opts.sendEmail !== false && user.emailVerified) {
    await sendEmail(user.email, opts.title, notificationEmailHtml(opts.title, opts.body))
  }

  if (opts.sendPush !== false && user.phone) {
    await sendPushNotification(user.phone, opts.title, opts.body)
  }

  return notification
}

export async function notifyLoginAlert(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) return

  const date = new Date().toLocaleString("es-PE", { timeZone: "America/Lima" })

  await createNotification({
    userId,
    type: "login_alert",
    title: "Inicio de sesión detectado",
    body: `Se registró un acceso a tu cuenta el ${date}.`,
    metadata: { date },
  })

  await sendEmail(user.email, "Alerta de inicio de sesión", loginAlertEmailHtml(user.name, date))
  if (user.phone) {
    await sendPushNotification(user.phone, "USMP Market", `Inicio de sesión detectado el ${date}`)
  }
}

export async function getUnreadCount(userId: string) {
  return prisma.notification.count({ where: { userId, read: false } })
}

export async function markAllRead(userId: string) {
  await prisma.notification.updateMany({
    where: { userId, read: false },
    data: { read: true },
  })
}
