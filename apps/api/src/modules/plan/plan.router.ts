import { Router } from 'express'
import { requireAuth } from '../../middleware/auth.js'
import { syncUser } from '../../middleware/syncUser.js'
import { PlanController } from './plan.controller.js'

const router: Router = Router()
const controller = new PlanController()

/**
 * @openapi
 * /api/plans:
 *   get:
 *     summary: List all plans for the current user
 *     tags: [Plans]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: projectId
 *         schema:
 *           type: string
 *         description: Filter by project ID
 *     responses:
 *       200:
 *         description: List of plans
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
 *                     $ref: '#/components/schemas/Plan'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/', requireAuth(), syncUser, (req, res) => controller.listPlans(req, res))

/**
 * @openapi
 * /api/plans/{id}:
 *   get:
 *     summary: Get a plan by ID (includes tasks)
 *     tags: [Plans]
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
 *         description: Plan with tasks
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/PlanWithTasks'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/:id', requireAuth(), syncUser, (req, res) => controller.getPlan(req, res))

/**
 * @openapi
 * /api/plans:
 *   post:
 *     summary: Create a new plan
 *     tags: [Plans]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreatePlanRequest'
 *     responses:
 *       201:
 *         description: Plan created
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post('/', requireAuth(), syncUser, (req, res) => controller.createPlan(req, res))

/**
 * @openapi
 * /api/plans/{id}:
 *   patch:
 *     summary: Update a plan
 *     tags: [Plans]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdatePlanRequest'
 *     responses:
 *       200:
 *         description: Plan updated
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.patch('/:id', requireAuth(), syncUser, (req, res) => controller.updatePlan(req, res))

/**
 * @openapi
 * /api/plans/{id}:
 *   delete:
 *     summary: Delete a plan (tasks become unassigned)
 *     tags: [Plans]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Plan deleted
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.delete('/:id', requireAuth(), syncUser, (req, res) => controller.deletePlan(req, res))

export default router
