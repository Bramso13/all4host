/*
  Warnings:

  - You are about to drop the column `authId` on the `user` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "user_authId_key";

-- AlterTable
ALTER TABLE "user" DROP COLUMN "authId";
