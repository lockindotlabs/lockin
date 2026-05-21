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
      },
    },
  },
  apis: ['./src/routes/*.ts', './src/index.ts'],
}

export const swaggerSpec = swaggerJsdoc(options)

export const setupSwagger = (app: Application) => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))
}
