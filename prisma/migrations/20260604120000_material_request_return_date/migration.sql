-- AlterTable
ALTER TABLE "MaterialRequest" ADD COLUMN "returnDate" TIMESTAMP(3);
ALTER TABLE "MaterialRequest" ADD COLUMN "returnReminderSent" BOOLEAN NOT NULL DEFAULT false;
