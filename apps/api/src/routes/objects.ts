import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { getDatabase } from '@roomtrace/database';

export async function objectsRoutes(fastify: FastifyInstance, _opts: FastifyPluginOptions) {
  const db = getDatabase();

  // GET /api/v1/rooms/:roomId/objects
  fastify.get('/rooms/:roomId/objects', async (request, reply) => {
    const { roomId } = request.params as { roomId: string };
    const objects = await db.findObjectsByRoom(roomId);
    return reply.send({ success: true, data: objects });
  });

  // GET /api/v1/objects/:id
  fastify.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const obj = await db.findObjectById(id);
    if (!obj) {
      return reply.code(404).send({
        success: false,
        error: { code: 'OBJECT_NOT_FOUND', message: `Object ${id} not found` },
      });
    }

    const movements = await db.findMovementsByObject(id);
    return reply.send({
      success: true,
      data: {
        ...obj,
        movements,
      },
    });
  });

  // PATCH /api/v1/objects/:id
  fastify.patch('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as any;

    if (!body?.userDefinedName) {
      return reply.code(400).send({
        success: false,
        error: { code: 'INVALID_INPUT', message: 'userDefinedName is required' },
      });
    }

    try {
      const updated = await db.updateObjectName(id, body.userDefinedName);
      return reply.send({ success: true, data: updated });
    } catch {
      return reply.code(404).send({
        success: false,
        error: { code: 'OBJECT_NOT_FOUND', message: `Object ${id} not found` },
      });
    }
  });

  // GET /api/v1/objects/:id/movements
  fastify.get('/:id/movements', async (request, reply) => {
    const { id } = request.params as { id: string };
    const movements = await db.findMovementsByObject(id);
    return reply.send({ success: true, data: movements });
  });
}
