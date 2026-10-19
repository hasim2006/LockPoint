import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { getDatabase } from '@roomtrace/database';
import { ScanProcessorService } from '../processor/scan-processor';
import { ScanProcessingJobPayload } from '@roomtrace/types';

export async function scansRoutes(fastify: FastifyInstance, _opts: FastifyPluginOptions) {
  const db = getDatabase();
  const processor = new ScanProcessorService();

  // GET /api/v1/rooms/:roomId/scans
  fastify.get('/rooms/:roomId/scans', async (request, reply) => {
    const { roomId } = request.params as { roomId: string };
    const scans = await db.findScansByRoom(roomId);
    return reply.send({ success: true, data: scans });
  });

  // GET /api/v1/scans/:id
  fastify.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const scan = await db.findScanById(id);
    if (!scan) {
      return reply.code(404).send({
        success: false,
        error: { code: 'SCAN_NOT_FOUND', message: `Scan ${id} not found` },
      });
    }

    const instances = await db.findInstancesByScan(id);
    const movements = await db.findMovementsByScan(id);

    return reply.send({
      success: true,
      data: {
        ...scan,
        instances,
        movements,
      },
    });
  });

  // POST /api/v1/rooms/:roomId/scans
  fastify.post('/rooms/:roomId/scans', async (request, reply) => {
    const { roomId } = request.params as { roomId: string };
    const body = (request.body || {}) as Partial<ScanProcessingJobPayload>;

    const room = await db.findRoomById(roomId);
    if (!room) {
      return reply.code(404).send({
        success: false,
        error: { code: 'ROOM_NOT_FOUND', message: `Room ${roomId} not found` },
      });
    }

    const scanType = body.scanType || (room.baselineScanId ? 'REPEAT' : 'BASELINE');
    const scan = await db.createScan({
      roomId,
      userId: 'user-alex-01',
      deviceId: 'dev-web-scanner-01',
      scanType,
      status: 'PROCESSING',
      qualityScore: 88,
      qualityLevel: 'GOOD',
      featureCount: body.keypoints?.length || 420,
      planeCount: body.planes?.length || 4,
      detectedObjectCount: 0,
      trackingLossCount: 0,
      pointCloudUri: `/assets/spatial/${roomId}-scan.ply`,
      planeMeshUri: `/assets/spatial/${roomId}-planes.obj`,
      thumbnailUri: `/assets/thumbnails/${roomId}.webp`,
    });

    // Create asynchronous processing job
    const jobPayload: ScanProcessingJobPayload = {
      scanId: scan.id,
      roomId,
      scanType,
      baselineScanId: room.baselineScanId || undefined,
      deviceInfo: body.deviceInfo || {
        model: 'Web Simulator / ARCore Bridge',
        hasLidar: false,
        arEngine: 'SIMULATOR',
      },
      planes: body.planes || [],
      keypoints: body.keypoints || [],
      rawDetections: body.rawDetections,
    };

    const jobId = await db.createProcessingJob(scan.id, jobPayload);

    // Process job asynchronously
    processor.processScan(jobId, jobPayload).catch((err) => {
      fastify.log.error(`Background scan job ${jobId} failed: ${err.message}`);
    });

    return reply.code(202).send({
      success: true,
      data: {
        scan,
        jobId,
        message: 'Scan created and processing initiated',
      },
    });
  });

  // GET /api/v1/scans/jobs/:jobId/status
  fastify.get('/jobs/:jobId/status', async (request, reply) => {
    const { jobId } = request.params as { jobId: string };
    const job = await db.getProcessingJob(jobId);
    if (!job) {
      return reply.code(404).send({
        success: false,
        error: { code: 'JOB_NOT_FOUND', message: `Job ${jobId} not found` },
      });
    }
    return reply.send({ success: true, data: job });
  });
}
