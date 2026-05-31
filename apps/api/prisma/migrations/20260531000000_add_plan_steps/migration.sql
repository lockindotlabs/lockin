-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "PlanSource" AS ENUM ('MANUAL', 'AI');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "PlanAiMode" AS ENUM ('MANUAL', 'ASSISTED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "BreakdownIntensity" AS ENUM ('LOW_ENERGY', 'NORMAL', 'HIGH_ENERGY');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "PlanStepStatus" AS ENUM ('TODO', 'IN_PROGRESS', 'DONE', 'CANCELLED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- CreateEnum
DO $$ BEGIN
  CREATE TYPE "CompletionType" AS ENUM ('EARLY', 'NORMAL', 'OVERTIME');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- AlterTable
ALTER TABLE "Plan"
  ADD COLUMN IF NOT EXISTS "description" TEXT,
  ADD COLUMN IF NOT EXISTS "completion" TEXT,
  ADD COLUMN IF NOT EXISTS "source" "PlanSource" NOT NULL DEFAULT 'MANUAL',
  ADD COLUMN IF NOT EXISTS "aiMode" "PlanAiMode" NOT NULL DEFAULT 'MANUAL',
  ADD COLUMN IF NOT EXISTS "breakdownIntensity" "BreakdownIntensity" NOT NULL DEFAULT 'NORMAL',
  ADD COLUMN IF NOT EXISTS "totalEstimatedMinutes" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Task"
  ADD COLUMN IF NOT EXISTS "durationMinutes" INTEGER;

-- AlterTable
ALTER TABLE "FocusSession"
  ADD COLUMN IF NOT EXISTS "plannedDuration" INTEGER,
  ADD COLUMN IF NOT EXISTS "overtimeDuration" INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "completionType" "CompletionType",
  ADD COLUMN IF NOT EXISTS "tasksSnapshot" JSONB,
  ADD COLUMN IF NOT EXISTS "slipCount" INTEGER DEFAULT 0;

-- CreateTable
CREATE TABLE IF NOT EXISTS "PlanStep" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "planId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "status" "PlanStepStatus" NOT NULL DEFAULT 'TODO',
  "dueDate" TIMESTAMP(3),
  "estimatedMinutes" INTEGER NOT NULL DEFAULT 30,
  "order" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "PlanStep_pkey" PRIMARY KEY ("id")
);

-- Migrate existing plan-linked Task rows into PlanStep before removing Task.planId.
DO $$ BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'Task'
      AND column_name = 'planId'
  ) THEN
    INSERT INTO "PlanStep" (
      "id",
      "userId",
      "planId",
      "title",
      "description",
      "status",
      "dueDate",
      "estimatedMinutes",
      "order",
      "createdAt",
      "updatedAt"
    )
    SELECT
      "Task"."id",
      "Task"."userId",
      "Task"."planId",
      "Task"."title",
      "Task"."description",
      "Task"."status"::text::"PlanStepStatus",
      "Task"."dueDate",
      COALESCE("Task"."durationMinutes", 30),
      "Task"."order",
      "Task"."createdAt",
      "Task"."updatedAt"
    FROM "Task"
    WHERE "Task"."planId" IS NOT NULL
    ON CONFLICT ("id") DO NOTHING;
  END IF;
END $$;

UPDATE "Plan"
SET "totalEstimatedMinutes" = COALESCE((
  SELECT SUM("PlanStep"."estimatedMinutes")
  FROM "PlanStep"
  WHERE "PlanStep"."planId" = "Plan"."id"
), 0);

-- DropForeignKey
ALTER TABLE "Task" DROP CONSTRAINT IF EXISTS "Task_planId_fkey";

-- AlterTable
ALTER TABLE "Task" DROP COLUMN IF EXISTS "planId";

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Plan_userId_deletedAt_idx" ON "Plan"("userId", "deletedAt");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PlanStep_userId_idx" ON "PlanStep"("userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PlanStep_planId_idx" ON "PlanStep"("planId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "PlanStep_planId_order_idx" ON "PlanStep"("planId", "order");

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "PlanStep" ADD CONSTRAINT "PlanStep_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "PlanStep" ADD CONSTRAINT "PlanStep_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
