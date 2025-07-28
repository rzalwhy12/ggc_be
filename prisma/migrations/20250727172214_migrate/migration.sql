/*
  Warnings:

  - Added the required column `deadline` to the `LowonganPekerjaan` table without a default value. This is not possible if the table is not empty.
  - Added the required column `jenis` to the `LowonganPekerjaan` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "LowonganPekerjaan" ADD COLUMN     "deadline" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "jenis" TEXT NOT NULL;
