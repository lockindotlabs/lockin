-- Admin access is database-backed. These Clerk users are the initial
-- administrators and can grant the same role to other users from the Admin UI.
INSERT INTO "User" ("id", "role", "updatedAt")
VALUES
  ('user_3H4V7C0RXLYZwtQrzND3kEZyta5', 'admin', CURRENT_TIMESTAMP),
  ('user_3EwrcMY0w6mxqer7s1CgKvEtXiS', 'admin', CURRENT_TIMESTAMP),
  ('user_3EzieQEexavAukibaZm7WwPT0lb', 'admin', CURRENT_TIMESTAMP),
  ('user_3F1dqJUc0quZrThz7zMvSYzqVTN', 'admin', CURRENT_TIMESTAMP),
  ('user_3FGmwTN2lqUmHWzlWlCYuTbsLwI', 'admin', CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO UPDATE
SET "role" = EXCLUDED."role",
    "updatedAt" = CURRENT_TIMESTAMP;
