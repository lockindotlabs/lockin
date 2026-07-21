import fs from "fs"
import path from "path"

const envPath = path.resolve(process.cwd(), "apps/api/.env")
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8")
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim()
    if (trimmed && !trimmed.startsWith("#")) {
      const parts = trimmed.split("=")
      if (parts.length >= 2) {
        const key = parts[0].trim()
        const value = parts.slice(1).join("=").trim().replace(/^['"]|['"]$/g, "")
        process.env[key] = value
      }
    }
  }
}

// For migrations and schema pushes, rewrite Supabase pooler port 6543 to direct connection port 5432
let databaseUrl = process.env.DATABASE_URL || ""
if (databaseUrl.includes(":6543")) {
  databaseUrl = databaseUrl.replace(":6543", ":5432")
}

export default {
  schema: "apps/api/prisma/schema.prisma",
  migrations: {
    seed: "tsx apps/api/prisma/seed.ts",
  },
  datasource: {
    url: databaseUrl,
  },
}
