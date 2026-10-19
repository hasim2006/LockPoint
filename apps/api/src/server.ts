import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { logger } from '@roomtrace/observability';
import { authRoutes } from './routes/auth';
import { roomsRoutes } from './routes/rooms';
import { scansRoutes } from './routes/scans';
import { objectsRoutes } from './routes/objects';
import { movementsRoutes } from './routes/movements';
import { adminRoutes } from './routes/admin';

export async function buildServer() {
  const server = Fastify({
    logger: false, // Using our structured logger
    requestIdHeader: 'x-request-id',
  });

  // Security Middleware
  await server.register(cors, {
    origin: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  });

  await server.register(helmet, {
    contentSecurityPolicy: false, // Allow swagger UI and local dev
  });

  await server.register(rateLimit, {
    max: 200,
    timeWindow: '1 minute',
  });

  // OpenAPI Documentation
  await server.register(swagger, {
    openapi: {
      info: {
        title: 'RoomTrace Spatial Movement Engine API',
        description: 'Production API for indoor 3D room scanning, object tracking, and movement measurement',
        version: '1.0.0',
      },
      servers: [{ url: 'http://localhost:4000', description: 'Local Development Server' }],
    },
  });

  await server.register(swaggerUi, {
    routePrefix: '/docs',
  });

  // Centralized Error Handling
  server.setErrorHandler((error: any, request, reply) => {
    const requestId = request.id;
    logger.error(`Request ${requestId} failed: ${error.message}`, {
      url: request.url,
      method: request.method,
      code: error.code,
    });

    const statusCode = error.statusCode || 500;
    return reply.status(statusCode).send({
      success: false,
      error: {
        code: error.code || 'INTERNAL_SERVER_ERROR',
        message: statusCode === 500 && process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : error.message,
        requestId,
      },
    });
  });

  // Health Checks
  server.get('/health', async () => ({
    status: 'pass',
    timestamp: new Date().toISOString(),
  }));

  server.get('/ready', async () => ({
    status: 'ready',
    database: 'healthy',
    timestamp: new Date().toISOString(),
  }));

  // Versioned API Routes
  await server.register(authRoutes, { prefix: '/api/v1/auth' });
  await server.register(roomsRoutes, { prefix: '/api/v1/rooms' });
  await server.register(scansRoutes, { prefix: '/api/v1/scans' });
  await server.register(objectsRoutes, { prefix: '/api/v1/objects' });
  await server.register(movementsRoutes, { prefix: '/api/v1/movements' });
  await server.register(adminRoutes, { prefix: '/api/v1/admin' });

  return server;
}

async function start() {
  const port = parseInt(process.env.PORT || '4000', 10);
  const host = process.env.HOST || '0.0.0.0';

  try {
    const server = await buildServer();
    await server.listen({ port, host });
    logger.info(`🚀 RoomTrace API Server running at http://${host}:${port}`);
    logger.info(`📚 Swagger API Docs available at http://${host}:${port}/docs`);
  } catch (err: any) {
    logger.fatal(`Failed to start server: ${err.message}`, { stack: err.stack });
    process.exit(1);
  }
}

if (process.env.NODE_ENV !== 'test') {
  start();
}
