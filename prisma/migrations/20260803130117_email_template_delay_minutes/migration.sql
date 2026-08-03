/*
  Warnings:

  - You are about to drop the column `delayHours` on the `EmailTemplate` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "EmailTemplate" DROP COLUMN "delayHours",
ADD COLUMN     "delayMinutes" INTEGER;
