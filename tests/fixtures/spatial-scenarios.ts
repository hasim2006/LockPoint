import { TrackedObject, ObjectInstance, Vector3D } from '@roomtrace/types';

export const baselineChair: TrackedObject = {
  id: 'test-chair-01',
  roomId: 'test-room-01',
  persistentId: 'chair-01',
  category: 'chair',
  userDefinedName: 'Test Office Chair',
  baselinePosition: { x: 1.0, y: 0.5, z: 2.0 },
  baselineDimensions: { width: 0.6, height: 0.9, depth: 0.6 },
  totalMovementsCount: 0,
  createdAt: '2026-09-01T10:00:00.000Z',
  updatedAt: '2026-09-01T10:00:00.000Z',
};

export function makeInstance(
  objectId: string,
  pos: Vector3D,
  rot = { w: 1, x: 0, y: 0, z: 0 },
  trackingConf = 0.90,
  depthUncertainty = 0.02
): ObjectInstance {
  return {
    id: `inst-${Date.now()}-${Math.random()}`,
    objectId,
    scanId: 'scan-repeat-test',
    category: 'chair',
    boundingBox2D: { xMin: 0.2, yMin: 0.3, xMax: 0.4, yMax: 0.7 },
    boundingBox3D: {
      center: pos,
      dimensions: { width: 0.6, height: 0.9, depth: 0.6 },
      rotation: rot,
    },
    position: pos,
    rotation: rot,
    dimensions: { width: 0.6, height: 0.9, depth: 0.6 },
    detectionConfidence: 0.95,
    trackingConfidence: trackingConf,
    depthUncertaintyMeters: depthUncertainty,
    createdAt: new Date().toISOString(),
  };
}
