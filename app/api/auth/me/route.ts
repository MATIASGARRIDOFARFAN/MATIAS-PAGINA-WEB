import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ user: null })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: {
      id: true,
      name: true,
      firstName: true,
      lastName: true,
      email: true,
      emailVerified: true,
      faculty: true,
      career: true,
      role: true,
      ratingAvg: true,
      ratingCount: true,
      suspended: true,
    },
  })

  if (!user) return NextResponse.json({ user: null })

  return NextResponse.json({
    user: {
      ...user,
      verified: user.emailVerified,
    },
  })
}
