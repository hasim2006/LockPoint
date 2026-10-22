import assert from 'node:assert';
import { test } from 'node:test';
import { MovementEngine, VectorMath, Umeyama } from '@roomtrace/spatial';
import { baselineChair, makeInstance } from '../fixtures/spatial-scenarios';
import { Vector3D } from '@roomtrace/types';

const engine = new MovementEngine({
  noiseThresholdMeters: 0.02, // 2 cm
  minorMovementThresholdMeters: 0.10, // 10 cm
  rotationThresholdDegrees: 15.0,
  minTrackingConfidence: 0.60,
  maxRegistrationRmseMeters: 0.08,
});

test('Case 1: Object moved 1 cm (sensor noise jitter below 2 cm threshold) -> STABLE', () => {
  // Baseline position: (1.0, 0.5, 2.0)
  // Current position: (1.01, 0.5, 2.0) -> Exactly 0.01 m = 1 cm
  const currentPos: Vector3D = { x: 1.01, y: 0.5, z: 2.0 };
  const instance = makeInstance(baselineChair.id, currentPos);

  const event = engine.analyzeObjectMovement({
    baselineObject: baselineChair,
    currentInstance: instance,
    wasInCameraFrustum: true,
    registrationRmseMeters: 0.01,
  });

  assert.strictEqual(event.movementStatus, 'STABLE');
  assert.ok(Math.abs(event.displacementEuclideanMeters - 0.01) < 1e-4);
  assert.ok(event.formattedDisplacement.includes('below movement threshold'));
});

test('Case 2: Object moved 5 cm (minor shift between 2 cm and 10 cm) -> MINOR_MOVEMENT', () => {
  // Baseline position: (1.0, 0.5, 2.0)
  // Current position: (1.05, 0.5, 2.0) -> Exactly 0.05 m = 5 cm to the right (+X)
  const currentPos: Vector3D = { x: 1.05, y: 0.5, z: 2.0 };
  const instance = makeInstance(baselineChair.id, currentPos);

  const event = engine.analyzeObjectMovement({
    baselineObject: baselineChair,
    currentInstance: instance,
    wasInCameraFrustum: true,
    registrationRmseMeters: 0.01,
  });

  assert.strictEqual(event.movementStatus, 'MINOR_MOVEMENT');
  assert.ok(Math.abs(event.displacementEuclideanMeters - 0.05) < 1e-4);
  assert.ok(event.directionLabel.includes('to the right'));
  assert.ok(event.formattedDisplacement.includes('5 cm'));
});

test('Case 3: Object moved 50 cm (significant relocation > 10 cm) -> SIGNIFICANT_MOVEMENT', () => {
  // Baseline position: (1.0, 0.5, 2.0)
  // Current position: (1.50, 0.5, 2.0) -> Exactly 0.50 m = 50 cm to the right (+X)
  const currentPos: Vector3D = { x: 1.50, y: 0.5, z: 2.0 };
  const instance = makeInstance(baselineChair.id, currentPos);

  const event = engine.analyzeObjectMovement({
    baselineObject: baselineChair,
    currentInstance: instance,
    wasInCameraFrustum: true,
    registrationRmseMeters: 0.01,
  });

  assert.strictEqual(event.movementStatus, 'SIGNIFICANT_MOVEMENT');
  assert.ok(Math.abs(event.displacementEuclideanMeters - 0.50) < 1e-4);
  assert.ok(event.formattedDisplacement.includes('50 cm to the right'));
});

test('Case 4: Object did not move (0 cm translation) -> STABLE', () => {
  const currentPos: Vector3D = { ...baselineChair.baselinePosition };
  const instance = makeInstance(baselineChair.id, currentPos);

  const event = engine.analyzeObjectMovement({
    baselineObject: baselineChair,
    currentInstance: instance,
    wasInCameraFrustum: true,
    registrationRmseMeters: 0.01,
  });

  assert.strictEqual(event.movementStatus, 'STABLE');
  assert.strictEqual(event.displacementEuclideanMeters, 0);
  assert.ok(event.formattedDisplacement.includes('below movement threshold'));
});

test('Case 5: Object rotated 90 degrees in place without translation -> ROTATED_ONLY', () => {
  const currentPos: Vector3D = { ...baselineChair.baselinePosition };
  // Rotate 90 degrees around Y axis: q = (cos 45, 0, sin 45, 0)
  const rot90Y = { w: Math.SQRT1_2, x: 0, y: Math.SQRT1_2, z: 0 };
  const instance = makeInstance(baselineChair.id, currentPos, rot90Y);

  const event = engine.analyzeObjectMovement({
    baselineObject: baselineChair,
    currentInstance: instance,
    wasInCameraFrustum: true,
    registrationRmseMeters: 0.01,
  });

  assert.strictEqual(event.movementStatus, 'ROTATED_ONLY');
  assert.ok(event.rotationDeltaDegrees >= 89.0 && event.rotationDeltaDegrees <= 91.0);
  assert.ok(event.formattedDisplacement.includes('Rotated 90° in place'));
});

test('Case 6: Object disappeared (was viewed in frustum, but not detected) -> DISAPPEARED', () => {
  const event = engine.analyzeObjectMovement({
    baselineObject: baselineChair,
    currentInstance: undefined,
    wasInCameraFrustum: true,
    registrationRmseMeters: 0.01,
  });

  assert.strictEqual(event.movementStatus, 'DISAPPEARED');
  assert.ok(event.formattedDisplacement.includes('Object missing'));
});

test('Case 7: New object appeared (no baseline counterpart) -> NEW_OBJECT', () => {
  const newPos: Vector3D = { x: 2.2, y: 0.3, z: 3.5 };
  const instance = makeInstance('obj-new-box', newPos);

  const event = engine.createEventForNewObject(instance, 'box-new-01', 'Storage Box New');

  assert.strictEqual(event.movementStatus, 'NEW_OBJECT');
  assert.ok(event.formattedDisplacement.includes('New object appeared'));
});

test('Case 8: Object partially occluded -> OCCLUDED', () => {
  const event = engine.analyzeObjectMovement({
    baselineObject: baselineChair,
    currentInstance: undefined,
    wasInCameraFrustum: true,
    isOccludedByForeground: true,
    registrationRmseMeters: 0.01,
  });

  assert.strictEqual(event.movementStatus, 'OCCLUDED');
  assert.ok(event.formattedDisplacement.includes('occluded'));
});

test('Case 9: Poor tracking / high registration error -> UNCERTAIN_TRACKING', () => {
  const currentPos: Vector3D = { x: 1.4, y: 0.5, z: 2.0 };
  // Low tracking confidence: 0.40 (below minTrackingConfidence 0.60)
  const instance = makeInstance(baselineChair.id, currentPos, undefined, 0.40);

  const event = engine.analyzeObjectMovement({
    baselineObject: baselineChair,
    currentInstance: instance,
    wasInCameraFrustum: true,
    registrationRmseMeters: 0.12, // High RMSE (above 0.08 m limit)
  });

  assert.strictEqual(event.movementStatus, 'UNCERTAIN_TRACKING');
  assert.ok(event.formattedDisplacement.includes('Uncertain Tracking'));
});

test('Case 10: Camera repositioned significantly -> Umeyama aligns frames so stationary objects remain STABLE', () => {
  // In Scan 1 (target coordinate frame):
  // Baseline chair is at (1.0, 0.5, 2.0)
  // Stationary room reference anchors:
  const targetAnchors: Vector3D[] = [
    { x: 0, y: 0, z: 0 },
    { x: 3, y: 0, z: 0 },
    { x: 0, y: 2.5, z: 0 },
    { x: 0, y: 0, z: 4 },
  ];

  // In Scan 2, camera started at a completely different position: translation (+2.0, 0, +1.0)
  const cameraShift: Vector3D = { x: 2.0, y: 0, z: 1.0 };
  const sourceAnchors: Vector3D[] = targetAnchors.map((p) => VectorMath.subtract(p, cameraShift));

  // The chair did NOT move in the physical room. Therefore in Scan 2 camera frame:
  const rawChairInScan2: Vector3D = VectorMath.subtract(baselineChair.baselinePosition, cameraShift);

  // If a naive system simply compared raw coordinates:
  const rawDist = VectorMath.distance(rawChairInScan2, baselineChair.baselinePosition);
  assert.ok(rawDist > 2.0, 'Raw unaligned distance would falsely indicate massive 2+ meter movement!');

  // Run RoomTrace scan-registration pipeline
  const registration = Umeyama.estimateTransform(sourceAnchors, targetAnchors, false);
  assert.ok(registration.isReliable);

  // Transform Scan 2 object position into Scan 1 coordinate frame:
  const transformedChairPos = VectorMath.transformPoint(rawChairInScan2, registration.transform);

  const instance = makeInstance(baselineChair.id, transformedChairPos);
  const event = engine.analyzeObjectMovement({
    baselineObject: baselineChair,
    currentInstance: instance,
    wasInCameraFrustum: true,
    registrationRmseMeters: registration.rmseMeters,
  });

  // VERIFIED: Despite camera viewpoint shifting by over 2 meters, stationary chair is accurately STABLE!
  assert.strictEqual(event.movementStatus, 'STABLE');
  assert.ok(event.displacementEuclideanMeters < 0.001);
});
