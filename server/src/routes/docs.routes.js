import { Router } from 'express';
import swaggerUi from 'swagger-ui-express';

const router = Router();

export const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'WaterLeak Watch API',
    version: '1.0.0',
    description:
      'Community Water Leak Reporting and Resolution-Tracking Platform with Automated Proximity Clustering and SLA Engine'
  },
  servers: [
    {
      url: '/api/v1',
      description: 'API v1'
    }
  ],
  paths: {
    '/auth/register': {
      post: {
        summary: 'Register a new user',
        tags: ['Auth'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  email: { type: 'string' },
                  password: { type: 'string' },
                  phone: { type: 'string' },
                  role: { type: 'string', enum: ['citizen', 'crew', 'admin'] }
                },
                required: ['name', 'email', 'password']
              }
            }
          }
        },
        responses: { 201: { description: 'User registered successfully' } }
      }
    },
    '/auth/login': {
      post: {
        summary: 'Log in and receive tokens',
        tags: ['Auth'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  email: { type: 'string' },
                  password: { type: 'string' }
                },
                required: ['email', 'password']
              }
            }
          }
        },
        responses: { 200: { description: 'Logged in successfully' } }
      }
    },
    '/reports': {
      post: {
        summary: 'Submit a leak report with photos',
        tags: ['Reports'],
        requestBody: {
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  latitude: { type: 'number' },
                  longitude: { type: 'number' },
                  area: { type: 'string' },
                  severity: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
                  leakType: { type: 'string', enum: ['pipe_burst', 'dripping_tap', 'valve_leak', 'sewage_overflow', 'other'] },
                  description: { type: 'string' },
                  photos: { type: 'array', items: { type: 'string', format: 'binary' } }
                }
              }
            }
          }
        },
        responses: { 201: { description: 'Report created or clustered' } }
      },
      get: {
        summary: 'List reports with filtering & pagination',
        tags: ['Reports'],
        responses: { 200: { description: 'List of reports' } }
      }
    },
    '/reports/nearby': {
      get: {
        summary: 'Proximity detection: check for nearby active incidents within 50m',
        tags: ['Reports'],
        parameters: [
          { name: 'lat', in: 'query', required: true, schema: { type: 'number' } },
          { name: 'lng', in: 'query', required: true, schema: { type: 'number' } },
          { name: 'radius', in: 'query', schema: { type: 'number', default: 50 } }
        ],
        responses: { 200: { description: 'List of nearby incidents with distance in meters' } }
      }
    },
    '/reports/track/{trackingId}': {
      get: {
        summary: 'Track report and incident status publicly',
        tags: ['Reports'],
        parameters: [{ name: 'trackingId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Report and incident details' } }
      }
    },
    '/incidents': {
      get: {
        summary: 'Get incidents list with SLA status, severity, and filters',
        tags: ['Incidents'],
        responses: { 200: { description: 'List of incident clusters' } }
      }
    },
    '/incidents/{id}': {
      get: {
        summary: 'Get incident details with timeline and photos',
        tags: ['Incidents'],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Incident details' } }
      }
    },
    '/incidents/{id}/status': {
      patch: {
        summary: 'Update incident status (enforced finite state machine)',
        tags: ['Incidents'],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Updated incident status' } }
      }
    },
    '/incidents/{id}/upvote': {
      post: {
        summary: 'Confirm duplicate report ("I see this too")',
        tags: ['Incidents'],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'Upvote recorded' } }
      }
    },
    '/analytics/summary': {
      get: {
        summary: 'Get overall KPI metrics (open count, resolved count, MTTR, water saved, SLA %)',
        tags: ['Analytics'],
        responses: { 200: { description: 'Summary KPI data' } }
      }
    }
  }
};

router.use('/', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

export default router;

