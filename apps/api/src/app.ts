import express, { Express } from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import { clerkMiddleware } from '@clerk/express'
import webhookRouter from './modules/webhook/webhook.router.js'
import authRouter from './modules/auth/auth.router.js'
import settingsRouter from './modules/settings/settings.router.js'
import planRouter from './modules/plan/plan.router.js'
import taskRouter from './modules/task/task.router.js'
import projectRouter from './modules/project/project.router.js'
import focusSessionRouter from './modules/focus-session/focus-session.router.js'
import { requireAuth } from './middleware/auth.js'
import { syncUser } from './middleware/syncUser.js'
import { errorBoundary } from './middleware/errorBoundary.js'
import { setupSwagger } from './config/swagger.js'

export const app: Express = express()

// CORS — in production, restrict to known origins via ALLOWED_ORIGINS env var
const rawOrigins = process.env.ALLOWED_ORIGINS
const allowedOrigins = rawOrigins ? rawOrigins.split(',').map(s => s.trim()).filter(Boolean) : []

app.use(cors({
  origin: (origin, callback) => {
    // Allow same-origin and no-origin requests (mobile, curl, server-to-server)
    if (!origin) return callback(null, true)
    // In dev or if no whitelist configured, allow all
    if (allowedOrigins.length === 0) return callback(null, true)
    if (allowedOrigins.includes(origin)) return callback(null, true)
    callback(new Error(`CORS: origin ${origin} not allowed`))
  },
  credentials: true,
}))

app.use(cookieParser())

// Must be before express.json() — Clerk webhook needs raw body for signature verification
app.use('/webhooks', webhookRouter)

app.use(express.json())
app.use(clerkMiddleware())

setupSwagger(app)

app.get('/', (_req, res) => {
  res.json({ ok: true, service: 'lockin-api' })
})

app.get('/api/me', requireAuth(), syncUser, (req, res) => {
  res.json(req.dbUser)
})

app.use('/api/auth/extension-tokens', authRouter)
app.use('/api/settings', settingsRouter)
app.use('/api/projects', projectRouter)
app.use('/api/plans', planRouter)
app.use('/api/tasks', taskRouter)
app.use('/api/focus-sessions', focusSessionRouter)

app.use(errorBoundary)
