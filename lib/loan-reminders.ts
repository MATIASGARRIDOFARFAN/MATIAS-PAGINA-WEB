import { prisma } from "@/lib/prisma"
import { createNotification } from "@/lib/notifications"
import { getOrCreateConversation } from "@/lib/api-helpers"

function startOfDay(d: Date) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

/** Notifica al solicitante cuando llega la fecha de devolución de un préstamo activo. */
export async function processLoanReturnReminders() {
  const today = startOfDay(new Date())
  const endOfToday = new Date(today)
  endOfToday.setHours(23, 59, 59, 999)

  const candidates = await prisma.materialRequest.findMany({
    where: {
      type: "prestamo",
      status: "aceptada",
      returnDate: { not: null, lte: endOfToday },
      returnReminderSent: false,
    },
    include: { product: { select: { id: true, title: true } }, requester: true, owner: true },
  })

  const dueLoans = candidates.filter(
    (loan) => loan.returnDate && startOfDay(loan.returnDate) <= today,
  )

  for (const loan of dueLoans) {
    const conversation = await getOrCreateConversation(
      loan.requesterId,
      loan.ownerId,
      loan.productId,
    )

    await createNotification({
      userId: loan.requesterId,
      type: "loan_return_reminder",
      title: "Recordatorio de devolución",
      body: `Hoy vence el préstamo de "${loan.product.title}". Coordina la devolución con ${loan.owner.name}.`,
      metadata: {
        requestId: loan.id,
        productId: loan.productId,
        otherUserId: loan.ownerId,
        conversationId: conversation.id,
        returnDate: loan.returnDate?.toISOString(),
      },
    })

    await prisma.materialRequest.update({
      where: { id: loan.id },
      data: { returnReminderSent: true },
    })
  }

  return dueLoans.length
}
