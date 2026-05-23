import type { User } from '../generated/prisma/index.js'

declare global {
  namespace Express {
    interface Request {
      dbUser?: User
      extensionTokenUserId?: string
    }
  }
}
