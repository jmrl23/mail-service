import { wrapper } from '@jmrl23/express-helper';
import { Router } from 'express';
import { serve, setup } from 'swagger-ui-express';
import swaggerJsDoc, { type OAS3Options } from 'swagger-jsdoc';

export const controller = Router();

const swaggerSpec = swaggerJsDoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Mail service',
      version: '1.0.0',
    },
    servers: [
      {
        url: 'http://localhost:3001',
        description: 'Local development',
      },
      {
        url: 'https://service-mail-0023.onrender.com',
        description: 'Render',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
        },
      },
      schemas: {
        MailSend: {
          type: 'object',
          properties: {
            from: {
              type: 'string',
            },
            to: {
              type: 'array',
              items: {
                type: 'string',
                format: 'email',
              },
              required: true,
            },
            subject: {
              type: 'string',
            },
            text: {
              type: 'string',
            },
            html: {
              type: 'string',
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/controllers/**/*.controller.ts'],
} satisfies OAS3Options);

controller

  .use(serve)

  .get('/', setup(swaggerSpec))

  .get(
    '/data',
    wrapper(() => swaggerSpec),
  );
