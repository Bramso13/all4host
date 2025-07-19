/*
  Warnings:

  - You are about to drop the `CleaningAgent` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "AgentType" AS ENUM ('cleaning', 'laundry', 'maintenance');

-- DropForeignKey
ALTER TABLE "CleaningAgent" DROP CONSTRAINT "CleaningAgent_cleaningManagerId_fkey";

-- DropForeignKey
ALTER TABLE "SiteCleaningSession" DROP CONSTRAINT "SiteCleaningSession_cleaningAgentId_fkey";

-- AlterTable
ALTER TABLE "Agent" ADD COLUMN     "cleaningManagerId" TEXT,
ADD COLUMN     "type" "AgentType" NOT NULL DEFAULT 'cleaning';

-- DropTable
DROP TABLE "CleaningAgent";

-- AddForeignKey
ALTER TABLE "Agent" ADD CONSTRAINT "Agent_cleaningManagerId_fkey" FOREIGN KEY ("cleaningManagerId") REFERENCES "CleaningManager"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiteCleaningSession" ADD CONSTRAINT "SiteCleaningSession_cleaningAgentId_fkey" FOREIGN KEY ("cleaningAgentId") REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
