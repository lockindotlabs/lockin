import swaggerJsdoc from 'swagger-jsdoc'
import swaggerUi from 'swagger-ui-express'
import { Application } from 'express'

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'LockIn API',
      version: '1.0.0',
      description: 'LockIn backend API. Authenticate via Clerk — paste a Bearer token to test protected routes.',
    },
    servers: [{ url: 'http://localhost:3001', description: 'Development server' }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Clerk session token. Get it from the browser console: `await window.Clerk.session.getToken()`',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'user_2abc...' },
            isActive: { type: 'boolean', example: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string', example: 'Unauthorized' },
          },
        },
        UserSettings: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            userId: { type: 'string' },
            theme: { type: 'string', enum: ['light', 'dark', 'system'], example: 'system' },
            language: { type: 'string', example: 'en' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        UpdateSettingsRequest: {
          type: 'object',
          properties: {
            theme: { type: 'string', enum: ['light', 'dark', 'system'] },
            language: { type: 'string', example: 'en' },
          },
        },
        Project: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            userId: { type: 'string' },
            name: { type: 'string', example: 'LockIn App' },
            description: { type: 'string', nullable: true },
            color: { type: 'string', example: '#6366f1', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        CreateProjectRequest: {
          type: 'object',
          required: ['name'],
          properties: {
            name: { type: 'string', example: 'LockIn App' },
            description: { type: 'string' },
            color: { type: 'string', example: '#6366f1', description: 'Hex color code' },
          },
        },
        UpdateProjectRequest: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            description: { type: 'string' },
            color: { type: 'string' },
          },
        },
        Plan: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            userId: { type: 'string' },
            projectId: { type: 'string', nullable: true },
            name: { type: 'string', example: 'Plan 1' },
            goal: { type: 'string', nullable: true },
            status: { type: 'string', enum: ['PLANNING', 'ACTIVE', 'COMPLETED', 'CANCELLED'] },
            startDate: { type: 'string', format: 'date-time', nullable: true },
            endDate: { type: 'string', format: 'date-time', nullable: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        PlanWithTasks: {
          allOf: [
            { $ref: '#/components/schemas/Plan' },
            {
              type: 'object',
              properties: {
                tasks: { type: 'array', items: { $ref: '#/components/schemas/Task' } },
                project: { $ref: '#/components/schemas/Project' },
              },
            },
          ],
        },
        CreatePlanRequest: {
          type: 'object',
          required: ['name'],
          properties: {
            name: { type: 'string', example: 'Plan 1' },
            goal: { type: 'string' },
            projectId: { type: 'string' },
            startDate: { type: 'string', format: 'date-time' },
            endDate: { type: 'string', format: 'date-time' },
          },
        },
        UpdatePlanRequest: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            goal: { type: 'string' },
            projectId: { type: 'string', nullable: true },
            status: { type: 'string', enum: ['PLANNING', 'ACTIVE', 'COMPLETED', 'CANCELLED'] },
            startDate: { type: 'string', format: 'date-time' },
            endDate: { type: 'string', format: 'date-time' },
          },
        },
        Task: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            userId: { type: 'string' },
            planId: { type: 'string', nullable: true },
            title: { type: 'string', example: 'Implement login page' },
            description: { type: 'string', nullable: true },
            status: { type: 'string', enum: ['TODO', 'IN_PROGRESS', 'DONE', 'CANCELLED'] },
            priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] },
            dueDate: { type: 'string', format: 'date-time', nullable: true },
            order: { type: 'integer', example: 0 },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        CreateTaskRequest: {
          type: 'object',
          required: ['title'],
          properties: {
            title: { type: 'string', example: 'Implement login page' },
            description: { type: 'string' },
            planId: { type: 'string' },
            status: { type: 'string', enum: ['TODO', 'IN_PROGRESS', 'DONE', 'CANCELLED'] },
            priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] },
            dueDate: { type: 'string', format: 'date-time' },
            order: { type: 'integer' },
          },
        },
        UpdateTaskRequest: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            description: { type: 'string' },
            planId: { type: 'string' },
            status: { type: 'string', enum: ['TODO', 'IN_PROGRESS', 'DONE', 'CANCELLED'] },
            priority: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] },
            dueDate: { type: 'string', format: 'date-time' },
            order: { type: 'integer' },
          },
        },
        ReorderTasksRequest: {
          type: 'object',
          required: ['tasks'],
          properties: {
            tasks: {
              type: 'array',
              items: {
                type: 'object',
                required: ['id', 'order'],
                properties: {
                  id: { type: 'string' },
                  order: { type: 'integer' },
                },
              },
            },
          },
        },
        FocusSession: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            userId: { type: 'string' },
            planId: { type: 'string' },
            startedAt: { type: 'string', format: 'date-time' },
            endedAt: { type: 'string', format: 'date-time', nullable: true },
            duration: { type: 'integer', nullable: true, description: 'Duration in seconds' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        StartSessionRequest: {
          type: 'object',
          required: ['planId'],
          properties: {
            planId: { type: 'string' },
          },
        },
      },
      responses: {
        Unauthorized: {
          description: 'Missing or invalid auth token',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
        },
        NotFound: {
          description: 'Resource not found',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
        },
        BadRequest: {
          description: 'Invalid request body',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
        },
      },
    },
  },
  apis: ['./src/modules/**/*.router.ts', './src/index.ts'],
}

export const swaggerSpec = swaggerJsdoc(options)

export const setupSwagger = (app: Application) => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))
}
