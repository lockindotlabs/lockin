ALTER TABLE "WorkflowTemplate" ADD COLUMN "goalTemplate" TEXT;
CREATE TYPE "ScaffoldQuestionPurpose" AS ENUM ('ADJUST_GOAL', 'GENERATE_STEPS', 'ESTIMATE_TIMEBOX', 'IDENTIFY_OBSTACLE');
ALTER TABLE "WorkflowTemplate" ADD COLUMN "customRequirements" JSONB NOT NULL DEFAULT '[]';
ALTER TABLE "WorkflowScaffoldQuestion" ADD COLUMN "aiPurpose" "ScaffoldQuestionPurpose" NOT NULL DEFAULT 'GENERATE_STEPS';
