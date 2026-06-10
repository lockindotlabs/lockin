import type { Request, Response } from 'express'
import { Webhook } from 'svix'
import prisma from '../../lib/prisma.js'

type UserDeletedEvent = {
  type: 'user.deleted'
  data: { id: string; deleted: boolean }
}

type ClerkEvent = UserDeletedEvent | { type: string; data: unknown }

export async function clerkWebhookHandler(req: Request, res: Response) {
  const secret = process.env.CLERK_WEBHOOK_SECRET
  if (!secret) {
    res.status(500).json({ error: 'Webhook secret not configured' })
    return
  }

  const wh = new Webhook(secret)
  let event: ClerkEvent

  try {
    event = wh.verify(req.body, {
      'svix-id': req.headers['svix-id'] as string,
      'svix-timestamp': req.headers['svix-timestamp'] as string,
      'svix-signature': req.headers['svix-signature'] as string,
    }) as ClerkEvent
  } catch {
    res.status(400).json({ error: 'Invalid webhook signature' })
    return
  }

  if (event.type === 'user.deleted') {
    const { id } = (event as UserDeletedEvent).data
    await prisma.user.updateMany({
      where: { id },
      data: { isActive: false },
    })
  }

  res.status(200).json({ received: true })
}
