-- CreateEnum
CREATE TYPE "Role" AS ENUM ('admin', 'user');

-- CreateTable
CREATE TABLE "user" (
    "id" UUID NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'user',

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);
