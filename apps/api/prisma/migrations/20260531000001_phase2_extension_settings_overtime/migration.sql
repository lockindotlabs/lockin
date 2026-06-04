-- Phase 2: Extension settings sync + overtime tracking
-- Safe to run on DB that already has these columns (IF NOT EXISTS / IF NOT EXISTS equivalent)

-- AlterTable: UserSettings — add extension settings fields
ALTER TABLE "UserSettings"
  ADD COLUMN IF NOT EXISTS "blocklistHard"   TEXT[]   NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS "blocklistSoft"   TEXT[]   NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS "hudStyle"        TEXT     NOT NULL DEFAULT 'pill+ring',
  ADD COLUMN IF NOT EXISTS "reminderStyle"   TEXT     NOT NULL DEFAULT 'banner',
  ADD COLUMN IF NOT EXISTS "blockTone"       TEXT     NOT NULL DEFAULT 'calm',
  ADD COLUMN IF NOT EXISTS "popupView"       TEXT     NOT NULL DEFAULT 'standard',
  ADD COLUMN IF NOT EXISTS "defaultDuration" INTEGER  NOT NULL DEFAULT 25,
  ADD COLUMN IF NOT EXISTS "tabGuard"        BOOLEAN  NOT NULL DEFAULT false;

-- AlterTable: FocusSession — track overtime duration
ALTER TABLE "FocusSession"
  ADD COLUMN IF NOT EXISTS "overtimeDuration" INTEGER DEFAULT 0;
