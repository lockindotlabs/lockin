import { Router } from 'express'
import { requireAuth } from '../../middleware/auth.js'
import { syncUser } from '../../middleware/syncUser.js'
import { FocusSessionController } from './focus-session.controller.js'

const router: Router = Router()
const controller = new FocusSessionController()

/**
 * @openapi
 * /api/focus-sessions:
 *   get:
 *     summary: List focus sessions for the current user
 *     tags: [FocusSessions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: planId
 *         schema:
 *           type: string
 *         description: Filter by plan ID
 *     responses:
 *       200:
 *         description: List of sessions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/FocusSession'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/', requireAuth(), syncUser, (req, res) => controller.listSessions(req, res))

/**
 * @openapi
 * /api/focus-sessions:
 *   post:
 *     summary: Start a new focus session on a plan
 *     tags: [FocusSessions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/StartSessionRequest'
 *     responses:
 *       201:
 *         description: Session started
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post('/', requireAuth(), syncUser, (req, res) => controller.startSession(req, res))

/**
 * @openapi
 * /api/focus-sessions/{id}:
 *   get:
 *     summary: Get a session by ID
 *     tags: [FocusSessions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Session
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/:id', requireAuth(), syncUser, (req, res) => controller.getSession(req, res))

/**
 * @openapi
 * /api/focus-sessions/{id}/end:
 *   patch:
 *     summary: End a focus session (computes duration automatically)
 *     tags: [FocusSessions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Session ended with duration
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.patch('/:id/end', requireAuth(), syncUser, (req, res) => controller.endSession(req, res))

export default router
