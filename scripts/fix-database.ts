/**
 * Aplica migración v2 de forma segura (SQLite no soporta DEFAULT CURRENT_TIMESTAMP en ADD COLUMN).
 * Ejecutar: npx tsx scripts/fix-database.ts
 */
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function trySql(sql: string) {
  try {
    await prisma.$executeRawUnsafe(sql)
    console.log("OK:", sql.slice(0, 60))
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    if (msg.includes("duplicate column") || msg.includes("already exists")) {
      console.log("SKIP (ya existe):", sql.slice(0, 50))
    } else {
      console.error("ERR:", msg, sql.slice(0, 50))
    }
  }
}

async function main() {
  const alters = [
    `ALTER TABLE "User" ADD COLUMN "firstName" TEXT NOT NULL DEFAULT ''`,
    `ALTER TABLE "User" ADD COLUMN "lastName" TEXT NOT NULL DEFAULT ''`,
    `ALTER TABLE "User" ADD COLUMN "bio" TEXT`,
    `ALTER TABLE "User" ADD COLUMN "phone" TEXT`,
    `ALTER TABLE "User" ADD COLUMN "role" TEXT NOT NULL DEFAULT 'user'`,
    `ALTER TABLE "User" ADD COLUMN "suspended" BOOLEAN NOT NULL DEFAULT false`,
    `ALTER TABLE "User" ADD COLUMN "emailVerified" BOOLEAN NOT NULL DEFAULT false`,
    `ALTER TABLE "User" ADD COLUMN "verifyCode" TEXT`,
    `ALTER TABLE "User" ADD COLUMN "verifyCodeExpiry" DATETIME`,
    `ALTER TABLE "User" ADD COLUMN "ratingAvg" REAL NOT NULL DEFAULT 0`,
    `ALTER TABLE "User" ADD COLUMN "ratingCount" INTEGER NOT NULL DEFAULT 0`,
    `ALTER TABLE "User" ADD COLUMN "updatedAt" DATETIME NOT NULL DEFAULT '2026-01-01 00:00:00'`,
    `UPDATE "User" SET "emailVerified" = "verified" WHERE "verified" = 1`,
    `UPDATE "User" SET "firstName" = "name", "lastName" = "name" WHERE "firstName" = ''`,
    `ALTER TABLE "Product" ADD COLUMN "updatedAt" DATETIME NOT NULL DEFAULT '2026-01-01 00:00:00'`,
  ]

  for (const sql of alters) await trySql(sql)

  const creates = [
    `CREATE TABLE IF NOT EXISTS "MaterialRequest" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "productId" TEXT NOT NULL,
      "requesterId" TEXT NOT NULL,
      "ownerId" TEXT NOT NULL,
      "type" TEXT NOT NULL,
      "status" TEXT NOT NULL DEFAULT 'pendiente',
      "message" TEXT,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE,
      FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE CASCADE,
      FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS "Conversation" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "productId" TEXT,
      "participant1Id" TEXT NOT NULL,
      "participant2Id" TEXT NOT NULL,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL,
      FOREIGN KEY ("participant1Id") REFERENCES "User"("id") ON DELETE CASCADE,
      FOREIGN KEY ("participant2Id") REFERENCES "User"("id") ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS "Message" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "conversationId" TEXT NOT NULL,
      "senderId" TEXT NOT NULL,
      "content" TEXT NOT NULL,
      "filtered" BOOLEAN NOT NULL DEFAULT false,
      "filterReason" TEXT,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE,
      FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS "Notification" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "userId" TEXT NOT NULL,
      "type" TEXT NOT NULL,
      "title" TEXT NOT NULL,
      "body" TEXT NOT NULL,
      "read" BOOLEAN NOT NULL DEFAULT false,
      "metadata" TEXT,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS "HistoryEntry" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "userId" TEXT NOT NULL,
      "relatedUserId" TEXT,
      "productId" TEXT,
      "requestId" TEXT,
      "type" TEXT NOT NULL,
      "status" TEXT NOT NULL,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS "UserRating" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "fromUserId" TEXT NOT NULL,
      "toUserId" TEXT NOT NULL,
      "requestId" TEXT,
      "stars" INTEGER NOT NULL,
      "comment" TEXT,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY ("fromUserId") REFERENCES "User"("id") ON DELETE CASCADE,
      FOREIGN KEY ("toUserId") REFERENCES "User"("id") ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS "ProductRating" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "fromUserId" TEXT NOT NULL,
      "productId" TEXT NOT NULL,
      "requestId" TEXT,
      "stars" INTEGER NOT NULL,
      "comment" TEXT,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY ("fromUserId") REFERENCES "User"("id") ON DELETE CASCADE,
      FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS "Report" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "reporterId" TEXT NOT NULL,
      "targetUserId" TEXT,
      "targetProductId" TEXT,
      "reason" TEXT NOT NULL,
      "status" TEXT NOT NULL DEFAULT 'pendiente',
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE CASCADE
    )`,
  ]

  for (const sql of creates) await trySql(sql)

  // Admin user
  const bcrypt = await import("bcryptjs")
  const hash = await bcrypt.hash("admin12345", 12)
  await prisma.$executeRawUnsafe(
    `INSERT OR IGNORE INTO "User" ("id","email","passwordHash","name","firstName","lastName","emailVerified","role","avatar","createdAt","updatedAt","ratingAvg","ratingCount","suspended")
     VALUES ('admin001','admin@usmp.pe','${hash}','Admin USMP','Admin','USMP',1,'admin','/placeholder.svg',datetime('now'),datetime('now'),0,0,0)`,
  ).catch(() => {})

  console.log("\nBase de datos actualizada. Reinicia: npm run dev")
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
