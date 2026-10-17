import {
  Vector3D,
  Quaternion4D,
  MovementStatus,
  MovementEvent,
  MovementConfig,
  TrackedObject,
  ObjectInstance,
} from '@roomtrace/types';
import { DEFAULT_MOVEMENT_CONFIG } from '@roomtrace/config';
import { VectorMath } from './vector-math';

export interface MovementAnalysisInput {
  baselineObject: TrackedObject;
  currentInstance?: ObjectInstance;
  wasInCameraFrustum: boolean;
  isOccludedByForeground?: boolean;
  registrationRmseMeters: number;
  config?: Partial<MovementConfig>;
}

export class MovementEngine {
  private config: MovementConfig;

  constructor(config?: Partial<MovementConfig>) {
    this.config = { ...DEFAULT_MOVEMENT_CONFIG, ...config };
  }

  /**
   * Compare an object between baseline scan and current scan
   */
  analyzeObjectMovement(input: MovementAnalysisInput): MovementEvent {
    const {
      baselineObject,
      currentInstance,
      wasInCameraFrustum,
      isOccludedByForeground = false,
      registrationRmseMeters,
    } = input;

    const baselinePos = baselineObject.baselinePosition;
    const now = new Date().toISOString();

    // Case 1: Object was not detected in the current scan
    if (!currentInstance) {
      if (isOccludedByForeground) {
        return this.createMovementEvent({
          objectId: baselineObject.id,
          persistentId: baselineObject.persistentId,
          objectName: baselineObject.userDefinedName,
          category: baselineObject.category,
          baselineScanId: 'baseline-scan',
          currentScanId: 'current-scan',
          movementStatus: 'OCCLUDED',
          displacementEuclideanMeters: 0,
          displacementHorizontalMeters: 0,
          displacementVerticalMeters: 0,
          displacementVector: { x: 0, y: 0, z: 0 },
          rotationDeltaDegrees: 0,
          directionLabel: 'Occluded by foreground object',
          formattedDisplacement: 'Object partially or fully occluded',
          confidenceScore: 50,
          uncertaintyRadiusMeters: 0.20,
          baselinePosition: baselinePos,
          currentPosition: baselinePos,
          baselineTimestamp: baselineObject.createdAt,
          currentTimestamp: now,
          notes: 'Expected location blocked by foreground entity in current scan.',
        });
      }

      if (wasInCameraFrustum) {
        return this.createMovementEvent({
          objectId: baselineObject.id,
          persistentId: baselineObject.persistentId,
          objectName: baselineObject.userDefinedName,
          category: baselineObject.category,
          baselineScanId: 'baseline-scan',
          currentScanId: 'current-scan',
          movementStatus: 'DISAPPEARED',
          displacementEuclideanMeters: 0,
          displacementHorizontalMeters: 0,
          displacementVerticalMeters: 0,
          displacementVector: { x: 0, y: 0, z: 0 },
          rotationDeltaDegrees: 0,
          directionLabel: 'No longer visible in room',
          formattedDisplacement: 'Object missing from baseline location',
          confidenceScore: 85,
          uncertaintyRadiusMeters: 0.10,
          baselinePosition: baselinePos,
          currentPosition: baselinePos,
          baselineTimestamp: baselineObject.createdAt,
          currentTimestamp: now,
          notes: 'Area was scanned with clear line of sight, but object was not present.',
        });
      }

      // Not viewed in camera frustum during this scan
      return this.createMovementEvent({
        objectId: baselineObject.id,
        persistentId: baselineObject.persistentId,
        objectName: baselineObject.userDefinedName,
        category: baselineObject.category,
        baselineScanId: 'baseline-scan',
        currentScanId: 'current-scan',
        movementStatus: 'STABLE',
        displacementEuclideanMeters: 0,
        displacementHorizontalMeters: 0,
        displacementVerticalMeters: 0,
        displacementVector: { x: 0, y: 0, z: 0 },
        rotationDeltaDegrees: 0,
        directionLabel: 'Unobserved in current pass',
        formattedDisplacement: 'Not in current camera field of view',
        confidenceScore: 40,
        uncertaintyRadiusMeters: 0.25,
        baselinePosition: baselinePos,
        currentPosition: baselinePos,
        baselineTimestamp: baselineObject.createdAt,
        currentTimestamp: now,
        notes: 'Camera did not cover this sector of the room.',
      });
    }

    // Case 2: Object was detected. Compute displacements
    const currentPos = currentInstance.position;
    const deltaVector = VectorMath.subtract(currentPos, baselinePos);
    const euclideanDisplacement = VectorMath.magnitude(deltaVector);
    const horizontalDisplacement = Math.sqrt(deltaVector.x * deltaVector.x + deltaVector.z * deltaVector.z);
    const verticalDisplacement = Math.abs(deltaVector.y);

    // Compute rotation delta
    let rotationDeltaDegrees = 0;
    if (currentInstance.rotation) {
      const baselineRot: Quaternion4D = { w: 1, x: 0, y: 0, z: 0 }; // Default upright
      rotationDeltaDegrees = VectorMath.quaternionAngleDifferenceDegrees(baselineRot, currentInstance.rotation);
    }

    // Compute composite confidence
    const detConf = currentInstance.detectionConfidence ?? 0.85;
    const trackConf = currentInstance.trackingConfidence ?? 0.80;
    const depthUncertainty = currentInstance.depthUncertaintyMeters ?? 0.03;

    // Check if tracking is degraded
    if (trackConf < this.config.minTrackingConfidence || registrationRmseMeters > this.config.maxRegistrationRmseMeters) {
      const formatted = `${this.formatMetricDistance(euclideanDisplacement)} (Uncertain Tracking)`;
      return this.createMovementEvent({
        objectId: baselineObject.id,
        persistentId: baselineObject.persistentId,
        objectName: baselineObject.userDefinedName,
        category: baselineObject.category,
        baselineScanId: 'baseline-scan',
        currentScanId: currentInstance.scanId,
        movementStatus: 'UNCERTAIN_TRACKING',
        displacementEuclideanMeters: euclideanDisplacement,
        displacementHorizontalMeters: horizontalDisplacement,
        displacementVerticalMeters: verticalDisplacement,
        displacementVector: deltaVector,
        rotationDeltaDegrees,
        directionLabel: 'Uncertain tracking',
        formattedDisplacement: formatted,
        confidenceScore: Math.round(trackConf * 50),
        uncertaintyRadiusMeters: Math.max(depthUncertainty, registrationRmseMeters),
        baselinePosition: baselinePos,
        currentPosition: currentPos,
        baselineTimestamp: baselineObject.createdAt,
        currentTimestamp: now,
        notes: 'Low ARCore feature tracking confidence or high spatial registration residual.',
      });
    }

    // Calculate uncertainty radius
    const uncertaintyRadius = Math.sqrt(depthUncertainty * depthUncertainty + registrationRmseMeters * registrationRmseMeters);

    // Determine direction label
    const directionLabel = this.decomposeDirection(deltaVector, euclideanDisplacement);

    // Determine movement classification status
    let status: MovementStatus;
    let formattedDisplacement: string;

    if (euclideanDisplacement < this.config.noiseThresholdMeters) {
      if (rotationDeltaDegrees >= this.config.rotationThresholdDegrees) {
        status = 'ROTATED_ONLY';
        formattedDisplacement = `Rotated ${Math.round(rotationDeltaDegrees)}° in place (position stable)`;
      } else {
        status = 'STABLE';
        const cm = (euclideanDisplacement * 100).toFixed(1);
        formattedDisplacement = `Moved ${cm} cm, below movement threshold`;
      }
    } else if (euclideanDisplacement < this.config.minorMovementThresholdMeters) {
      status = 'MINOR_MOVEMENT';
      formattedDisplacement = `Minor shift: ${this.formatMetricDistance(euclideanDisplacement)} ${directionLabel}`;
    } else {
      status = 'SIGNIFICANT_MOVEMENT';
      formattedDisplacement = `Moved ${this.formatMetricDistance(euclideanDisplacement)} ${directionLabel}`;
    }

    // Composite confidence score [0 - 100]
    const compositeConfidence = Math.min(
      99,
      Math.max(
        10,
        Math.round((detConf * 0.4 + trackConf * 0.4 + (1.0 - Math.min(1.0, registrationRmseMeters / 0.10)) * 0.2) * 100)
      )
    );

    return this.createMovementEvent({
      objectId: baselineObject.id,
      persistentId: baselineObject.persistentId,
      objectName: baselineObject.userDefinedName,
      category: baselineObject.category,
      baselineScanId: 'baseline-scan',
      currentScanId: currentInstance.scanId,
      movementStatus: status,
      displacementEuclideanMeters: euclideanDisplacement,
      displacementHorizontalMeters: horizontalDisplacement,
      displacementVerticalMeters: verticalDisplacement,
      displacementVector: deltaVector,
      rotationDeltaDegrees,
      directionLabel,
      formattedDisplacement,
      confidenceScore: compositeConfidence,
      uncertaintyRadiusMeters: uncertaintyRadius,
      baselinePosition: baselinePos,
      currentPosition: currentPos,
      baselineTimestamp: baselineObject.createdAt,
      currentTimestamp: now,
    });
  }

  /**
   * Helper for new object detected in current scan with no baseline counterpart
   */
  createEventForNewObject(
    instance: ObjectInstance,
    persistentId: string,
    objectName: string
  ): MovementEvent {
    const now = new Date().toISOString();
    return this.createMovementEvent({
      objectId: instance.objectId,
      persistentId,
      objectName,
      category: instance.category,
      baselineScanId: 'none',
      currentScanId: instance.scanId,
      movementStatus: 'NEW_OBJECT',
      displacementEuclideanMeters: 0,
      displacementHorizontalMeters: 0,
      displacementVerticalMeters: 0,
      displacementVector: { x: 0, y: 0, z: 0 },
      rotationDeltaDegrees: 0,
      directionLabel: 'New object in room',
      formattedDisplacement: 'New object appeared',
      confidenceScore: Math.round((instance.detectionConfidence ?? 0.85) * 100),
      uncertaintyRadiusMeters: instance.depthUncertaintyMeters ?? 0.05,
      baselinePosition: instance.position,
      currentPosition: instance.position,
      baselineTimestamp: now,
      currentTimestamp: now,
      notes: 'Not observed in baseline spatial map.',
    });
  }

  /**
   * Decompose 3D displacement vector into intuitive cardinal directions
   * Coordinate system: +X right, -X left, +Y up, -Y down, -Z forward, +Z backward
   */
  decomposeDirection(delta: Vector3D, magnitude: number): string {
    if (magnitude < 0.01) return 'in place';

    const parts: string[] = [];
    const absX = Math.abs(delta.x);
    const absY = Math.abs(delta.y);
    const absZ = Math.abs(delta.z);

    // Primary horizontal movement
    if (absX >= 0.03) {
      parts.push(delta.x > 0 ? 'to the right' : 'to the left');
    }
    if (absZ >= 0.03) {
      parts.push(delta.z < 0 ? 'forward' : 'backward');
    }
    // Vertical movement
    if (absY >= 0.04) {
      parts.push(delta.y > 0 ? 'upward' : 'downward');
    }

    if (parts.length === 0) return 'in place';
    return parts.join(' and ');
  }

  /**
   * Format metric distance sensibly without false precision
   */
  formatMetricDistance(meters: number): string {
    const cm = meters * 100;
    if (cm < 1.0) {
      return `${(cm * 10).toFixed(0)} mm`;
    }
    if (meters < 1.0) {
      // Under 1 meter: round to nearest integer centimeter
      return `${Math.round(cm)} cm`;
    }
    // Greater than 1 meter: format as meters with 2 decimal places (e.g. 1.45 m)
    return `${meters.toFixed(2)} m (${Math.round(cm)} cm)`;
  }

  private createMovementEvent(data: Omit<MovementEvent, 'id' | 'createdAt'>): MovementEvent {
    return {
      id: `mvt-${Math.random().toString(36).substring(2, 11)}`,
      createdAt: new Date().toISOString(),
      ...data,
    };
  }
}
