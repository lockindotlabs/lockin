import { Router } from 'express'
import { authMiddleware } from '../../middleware/auth.js'
import {
  registerHandler,
  loginHandler,
  refreshHandler,
  logoutHandler,
  meHandler,
} from './auth.controller.js'

const router = Router()

router.post('/register', registerHandler)
router.post('/login', loginHandler)
router.post('/refresh', refreshHandler)
router.post('/logout', authMiddleware, logoutHandler)
router.get('/me', authMiddleware, meHandler)

export default router
