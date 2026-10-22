import assert from 'node:assert';
import { test } from 'node:test';
import { Umeyama, RansacSpatialAligner, VectorMath } from '@roomtrace/spatial';
import { Vector3D } from '@roomtrace/types';

test('Umeyama: recovers pure 3D translation exactly', () => {
  const targetPoints: Vector3D[] = [
    { x: 0, y: 0, z: 0 },
    { x: 2, y: 0, z: 0 },
    { x: 0, y: 3, z: 0 },
    { x: 0, y: 0, z: 4 },
  ];

  // Source points shifted by (+1.5, -0.8, +2.3)
  const shift = { x: 1.5, y: -0.8, z: 2.3 };
  const sourcePoints: Vector3D[] = targetPoints.map((p) => VectorMath.subtract(p, shift));

  const result = Umeyama.estimateTransform(sourcePoints, targetPoints, false);

  assert.ok(result.isReliable, 'Registration must be reliable');
  assert.ok(result.rmseMeters < 1e-4, `RMSE must be near zero, got ${result.rmseMeters}`);
  assert.ok(Math.abs(result.translation.x - shift.x) < 1e-4);
  assert.ok(Math.abs(result.translation.y - shift.y) < 1e-4);
  assert.ok(Math.abs(result.translation.z - shift.z) < 1e-4);
});

test('RANSAC Aligner: filters out outlier moving objects during background alignment', () => {
  // 6 static room feature points
  const targetPoints: Vector3D[] = [
    { x: 1, y: 0, z: 1 },
    { x: 3, y: 0, z: 1 },
    { x: 1, y: 2, z: 1 },
    { x: 3, y: 2, z: 1 },
    { x: 2, y: 0, z: 4 },
    { x: 2, y: 3, z: 4 },
    { x: 10, y: 10, z: 10 }, // Outlier: an object that moved wildly
  ];

  // In source frame, static points are shifted by translation (+0.5, 0, +0.5)
  const sourcePoints: Vector3D[] = [
    { x: 0.5, y: 0, z: 0.5 },
    { x: 2.5, y: 0, z: 0.5 },
    { x: 0.5, y: 2, z: 0.5 },
    { x: 2.5, y: 2, z: 0.5 },
    { x: 1.5, y: 0, z: 3.5 },
    { x: 1.5, y: 3, z: 3.5 },
    { x: -5, y: 8, z: 2 }, // Corrupted position
  ];

  const result = RansacSpatialAligner.align(sourcePoints, targetPoints, {
    inlierThresholdMeters: 0.05,
  });

  assert.ok(result.isReliable, 'RANSAC should find the consensus static transform');
  assert.ok(result.inlierRatio >= 6 / 7, `Expected at least 6/7 inliers, got ${result.inlierRatio}`);
  assert.ok(result.rmseMeters < 0.02, `Refined RMSE should be < 2 cm, got ${result.rmseMeters}`);
});
