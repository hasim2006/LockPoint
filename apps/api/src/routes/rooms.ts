import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { getDatabase } from '@roomtrace/database';

export async function roomsRoutes(fastify: FastifyInstance, _opts: FastifyPluginOptions) {
  const db = getDatabase();

  // GET /api/v1/rooms
  fastify.get('/', async (_request, reply) => {
    // Default organization for development
    const orgId = 'org-acme-01';
    const rooms = await db.findRoomsByOrg(orgId);
    return reply.send({
      success: true,
      data: rooms,
    });
  });

  // GET /api/v1/rooms/:id
  fastify.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const room = await db.findRoomById(id);
    if (!room) {
      return reply.code(404).send({
        success: false,
        error: { code: 'ROOM_NOT_FOUND', message: `Room ${id} not found` },
      });
    }

    const scans = await db.findScansByRoom(id);
    const objects = await db.findObjectsByRoom(id);

    return reply.send({
      success: true,
      data: {
        ...room,
        scans,
        objects,
      },
    });
  });

  // POST /api/v1/rooms
  fastify.post('/', async (request, reply) => {
    const body = request.body as any;
    if (!body?.name) {
      return reply.code(400).send({
        success: false,
        error: { code: 'INVALID_INPUT', message: 'Room name is required' },
      });
    }

    const orgId = 'org-acme-01';
    const room = await db.createRoom({
      organizationId: orgId,
      name: body.name,
      floor: body.floor || '1st Floor',
      building: body.building || 'Main Building',
      dimensions: body.dimensions || { width: 5.0, height: 2.8, depth: 6.0 },
    });

    return reply.code(201).send({
      success: true,
      data: room,
    });
  });

  // DELETE /api/v1/rooms/:id
  fastify.delete('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const success = await db.deleteRoom(id);
    return reply.send({
      success,
      data: { id, deleted: success },
    });
  });
}
