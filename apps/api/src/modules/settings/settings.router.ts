import { Router } from 'express'
import { requireAuth } from '../../middleware/auth.js'
import { syncUser } from '../../middleware/syncUser.js'
import { SettingsController } from './settings.controller.js'

const router: Router = Router()
const controller = new SettingsController()

/**
 * @openapi
 * /api/settings:
 *   get:
 *     summary: Get current user settings (auto-creates defaults if missing)
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User settings
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/UserSettings'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/', requireAuth(), syncUser, (req, res) => controller.getSettings(req, res))

/**
 * @openapi
 * /api/settings:
 *   patch:
 *     summary: Update current user settings
 *     tags: [Settings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateSettingsRequest'
 *     responses:
 *       200:
 *         description: Updated settings
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/UserSettings'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.patch('/', requireAuth(), syncUser, (req, res) => controller.updateSettings(req, res))

export default router
