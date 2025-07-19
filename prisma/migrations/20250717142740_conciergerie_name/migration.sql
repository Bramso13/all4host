/*
  Warnings:

  - Added the required column `name` to the `ConciergerieManager` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ConciergerieManager" ADD COLUMN     "name" TEXT NOT NULL;
