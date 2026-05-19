import express, { Router, type IRouter } from 'express'
import { clerkWebhookHandler } from './webhook.controller.js'

const router: IRouter = Router()

// Clerk requires raw body for signature verification
router.post('/clerk', express.raw({ type: 'application/json' }), clerkWebhookHandler)

export default router
