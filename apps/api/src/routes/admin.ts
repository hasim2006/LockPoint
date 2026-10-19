import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { getDatabase } from '@roomtrace/database';

export async function adminRoutes(fastify: FastifyInstance, _opts: FastifyPluginOptions) {
  const db = getDatabase();

  fastify.get('/health', async (_request, reply) => {
    return reply.send({
      success: true,
      status: 'HEALTHY',
      timestamp: new Date().toISOString(),
      services: {
        database: 'CONNECTED',
        redisQueue: 'IDLE',
        objectStorage: 'ONLINE',
        cvInferenceEngine: 'SIMULATOR_READY',
      },
      version: '1.0.0',
    });
  });

  fastify.get('/stats', async (_request, reply) => {
    const orgId = 'org-acme-01';
    const rooms = await db.findRoomsByOrg(orgId);

    let totalScans = 0;
    let totalObjects = 0;
    let totalMovements = 0;

    for (const room of rooms) {
      const scans = await db.findScansByRoom(room.id);
      const objects = await db.findObjectsByRoom(room.id);
      const movements = await db.findMovementsByRoom(room.id);

      totalScans += scans.length;
      totalObjects += objects.length;
      totalMovements += movements.length;
    }

    return reply.send({
      success: true,
      data: {
        roomsCount: rooms.length,
        totalScans,
        totalObjectsTracked: totalObjects,
        totalMovementEvents: totalMovements,
        uptimeSeconds: process.uptime(),
        memoryUsage: process.memoryUsage(),
      },
    });
  });
}
