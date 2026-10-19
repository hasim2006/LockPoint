import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { getDatabase } from '@roomtrace/database';
import { MovementReportSummary } from '@roomtrace/types';

export async function movementsRoutes(fastify: FastifyInstance, _opts: FastifyPluginOptions) {
  const db = getDatabase();

  // GET /api/v1/rooms/:roomId/movements
  fastify.get('/rooms/:roomId/movements', async (request, reply) => {
    const { roomId } = request.params as { roomId: string };
    const movements = await db.findMovementsByRoom(roomId);
    return reply.send({ success: true, data: movements });
  });

  // GET /api/v1/scans/:scanId/movements
  fastify.get('/scans/:scanId/movements', async (request, reply) => {
    const { scanId } = request.params as { scanId: string };
    const movements = await db.findMovementsByScan(scanId);
    return reply.send({ success: true, data: movements });
  });

  // GET /api/v1/rooms/:roomId/reports/summary
  fastify.get('/rooms/:roomId/reports/summary', async (request, reply) => {
    const { roomId } = request.params as { roomId: string };
    const room = await db.findRoomById(roomId);
    if (!room) {
      return reply.code(404).send({
        success: false,
        error: { code: 'ROOM_NOT_FOUND', message: `Room ${roomId} not found` },
      });
    }

    const scans = await db.findScansByRoom(roomId);
    const baselineScan = scans.find((s) => s.scanType === 'BASELINE') || scans[scans.length - 1];
    const latestScan = scans.find((s) => s.scanType === 'REPEAT') || scans[0];

    const movements = latestScan ? await db.findMovementsByScan(latestScan.id) : [];

    const summary: MovementReportSummary = {
      roomId,
      roomName: room.name,
      baselineScan: {
        id: baselineScan?.id || 'none',
        timestamp: baselineScan?.createdAt || new Date().toISOString(),
      },
      currentScan: {
        id: latestScan?.id || 'none',
        timestamp: latestScan?.createdAt || new Date().toISOString(),
      },
      totalObjectsTracked: room.objectCount,
      stableCount: movements.filter((m) => m.movementStatus === 'STABLE').length,
      minorMovementCount: movements.filter((m) => m.movementStatus === 'MINOR_MOVEMENT').length,
      significantMovementCount: movements.filter((m) => m.movementStatus === 'SIGNIFICANT_MOVEMENT').length,
      newObjectsCount: movements.filter((m) => m.movementStatus === 'NEW_OBJECT').length,
      disappearedCount: movements.filter((m) => m.movementStatus === 'DISAPPEARED').length,
      occludedCount: movements.filter((m) => m.movementStatus === 'OCCLUDED').length,
      uncertainTrackingCount: movements.filter((m) => m.movementStatus === 'UNCERTAIN_TRACKING').length,
      events: movements,
    };

    return reply.send({ success: true, data: summary });
  });
}
