import express, { type Express } from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
import { clerkMiddleware } from "@clerk/express"
import webhookRouter from "./modules/webhook/webhook.router.js"
import authRouter from "./modules/auth/auth.router.js"
import settingsRouter from "./modules/settings/settings.router.js"
import taskRouter from "./modules/task/task.router.js"
import projectRouter from "./modules/project/project.router.js"
import focusSessionRouter from "./modules/focus-session/focus-session.router.js"
import { requireAuth } from "./middleware/auth.js"
import { syncUser } from "./middleware/syncUser.js"
import { errorBoundary } from "./middleware/errorBoundary.js"
import { setupSwagger } from "./config/swagger.js"

export const app: Express = express()

// CORS — in production, restrict to known origins via ALLOWED_ORIGINS env var
const rawOrigins = process.env.ALLOWED_ORIGINS
const allowedOrigins = rawOrigins
  ? rawOrigins
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
  : []

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow same-origin and no-origin requests (mobile, curl, server-to-server)
      if (!origin) return callback(null, true)
      // In dev or if no whitelist configured, allow all
      if (allowedOrigins.length === 0) return callback(null, true)
      if (allowedOrigins.includes(origin)) return callback(null, true)
      callback(new Error(`CORS: origin ${origin} not allowed`))
    },
    credentials: true,
  })
)

app.use(cookieParser())

// Must be before express.json() — Clerk webhook needs raw body for signature verification
app.use("/webhooks", webhookRouter)

// clerkMiddleware only reads headers — safe to apply globally
app.use(clerkMiddleware())

setupSwagger(app)

// express.json() is scoped to Express-owned routes only.
// Applying it globally would consume the request body stream, preventing
// Next.js route handlers (e.g. /api/chat streaming POST) from reading it.
const jsonBody = express.json()

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "lockin-api" })
})

app.get("/api/me", jsonBody, requireAuth(), syncUser, (req, res) => {
  res.json(req.dbUser)
})

app.use("/api/auth/extension-tokens", jsonBody, authRouter)
app.use("/api/settings", jsonBody, settingsRouter)
app.use("/api/projects", jsonBody, projectRouter)
app.use("/api/tasks", jsonBody, taskRouter)
app.use("/api/focus-sessions", jsonBody, focusSessionRouter)
// /api/plans is intentionally omitted — handled by Next.js app/api/plans/route.ts

app.use(errorBoundary)
