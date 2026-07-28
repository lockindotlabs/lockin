-- These are existing Production Clerk users. UPDATE avoids creating placeholder
-- Production accounts when the same migration runs in Development or Staging.
UPDATE "User"
SET "role" = 'admin',
    "updatedAt" = CURRENT_TIMESTAMP
WHERE "id" IN (
  'user_3H4V7C0RXLYZwtQrzND3kEZyta5',
  'user_3EwrcMY0w6mxqer7s1CgKvEtXiS',
  'user_3EzieQEexavAukibaZm7WwPT0lb',
  'user_3F1dqJUc0quZrThz7zMvSYzqVTN',
  'user_3FGmwTN2lqUmHWzlWlCYuTbsLwI',
  'user_3EGetydbFoSyf5UZCO5uMhxiVkc'
);
