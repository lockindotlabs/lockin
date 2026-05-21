import 'dotenv/config'
import express from 'express'
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

const app = express()
const port = process.env.PORT || 3001

app.use(cors({ origin: true, credentials: true }))
app.use(cookieParser())

// Must be before express.json() — Clerk webhook needs raw body for signature verification
app.use('/webhooks', webhookRouter)

app.use(express.json())
app.use(clerkMiddleware())

setupSwagger(app)

app.get('/', (_req, res) => {
  res.json({ message: 'Hello from Express API!' })
})

/**
 * @openapi
 * /api/me:
 *   get:
 *     summary: Get current authenticated user
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user record from database
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Missing or invalid token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
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

app.listen(port, () => {
  console.log(`API server running on port ${port}`)
})
