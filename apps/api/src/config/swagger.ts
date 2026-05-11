import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { Application } from "express";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "User Management API",
      version: "1.0.0",
      description: "API for managing users and authentication",
    },
    servers: [
      {
        url: "http://localhost:3001",
        description: "Development server",
      },
    ],
    components: {
      schemas: {
        User: {
          type: "object",
          required: ["id", "name", "email"],
          properties: {
            id: {
              type: "string",
              description: "Unique user identifier",
            },
            name: {
              type: "string",
              description: "User's full name",
            },
            email: {
              type: "string",
              format: "email",
              description: "User's email address",
            },
          },
        },
        CreateUserRequest: {
          type: "object",
          required: ["name", "email"],
          properties: {
            name: {
              type: "string",
            },
            email: {
              type: "string",
              format: "email",
            },
          },
        },
        Error: {
          type: "object",
          required: ["code", "message"],
          properties: {
            code: {
              type: "string",
            },
            message: {
              type: "string",
            },
          },
        },
      },
    },
  },
  apis: ["./src/routes/*.ts"],
};

export const swaggerSpec = swaggerJsdoc(options);

export const setupSwagger = (app: Application) => {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
};
