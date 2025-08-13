/*
  Warnings:

  - You are about to drop the column `poleType` on the `pole_manager_profiles` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."agent_specialties" ALTER COLUMN "certified" SET DEFAULT true;

-- AlterTable
ALTER TABLE "public"."pole_manager_profiles" DROP COLUMN "poleType",
ADD COLUMN     "poleTypes" "public"."PoleType"[];
