import { Router } from 'express'
import { requireAuth } from '../../middleware/auth.js'
import { syncUser } from '../../middleware/syncUser.js'
import { AuthController } from './auth.controller.js'

const router: Router = Router()
const controller = new AuthController()

/**
 * @openapi
 * /api/auth/extension-tokens:
 *   post:
 *     summary: Generate a long-lived extension token
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string, example: My Extension }
 *     responses:
 *       201:
 *         description: Token created — plaintext token returned only once
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     id: { type: string }
 *                     name: { type: string }
 *                     token: { type: string, description: 'Plaintext token — save it now, never shown again' }
 *                     createdAt: { type: string, format: date-time }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post('/', requireAuth(), syncUser, (req, res) => controller.createToken(req, res))

/**
 * @openapi
 * /api/auth/extension-tokens:
 *   get:
 *     summary: List all extension tokens (without plaintext)
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of tokens
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/', requireAuth(), syncUser, (req, res) => controller.listTokens(req, res))

/**
 * @openapi
 * /api/auth/extension-tokens/{id}:
 *   delete:
 *     summary: Revoke an extension token
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       204:
 *         description: Token revoked
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.delete('/:id', requireAuth(), syncUser, (req, res) => controller.deleteToken(req, res))

export default router
