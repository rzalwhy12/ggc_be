/*
  Warnings:

  - You are about to drop the column `deadline` on the `LowonganPekerjaan` table. All the data in the column will be lost.
  - You are about to drop the column `jenis` on the `LowonganPekerjaan` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "LowonganPekerjaan" DROP COLUMN "deadline",
DROP COLUMN "jenis";

-- CreateTable
CREATE TABLE "Visitor" (
    "id" SERIAL NOT NULL,
    "ip" TEXT NOT NULL,
    "visitedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Visitor_pkey" PRIMARY KEY ("id")
);
