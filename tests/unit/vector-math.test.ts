import assert from 'node:assert';
import { test } from 'node:test';
import { VectorMath } from '@roomtrace/spatial';

test('VectorMath: addition, subtraction, distance, magnitude', () => {
  const a = { x: 1.0, y: 2.0, z: 3.0 };
  const b = { x: 4.0, y: 6.0, z: 8.0 };

  const added = VectorMath.add(a, b);
  assert.strictEqual(added.x, 5.0);
  assert.strictEqual(added.y, 8.0);
  assert.strictEqual(added.z, 11.0);

  const sub = VectorMath.subtract(b, a);
  assert.strictEqual(sub.x, 3.0);
  assert.strictEqual(sub.y, 4.0);
  assert.strictEqual(sub.z, 5.0);

  const dist = VectorMath.distance({ x: 0, y: 0, z: 0 }, { x: 3, y: 4, z: 0 });
  assert.strictEqual(dist, 5.0);
});

test('VectorMath: quaternion angular difference', () => {
  // Unit quaternion (0 deg rotation)
  const q0 = { w: 1, x: 0, y: 0, z: 0 };
  // 90 degree rotation around Y axis
  // cos(45 deg) = 0.70710678, sin(45 deg) = 0.70710678
  const q90Y = { w: Math.SQRT1_2, x: 0, y: Math.SQRT1_2, z: 0 };

  const angle = VectorMath.quaternionAngleDifferenceDegrees(q0, q90Y);
  assert.ok(Math.abs(angle - 90.0) < 0.01, `Expected ~90 deg, got ${angle}`);
});
