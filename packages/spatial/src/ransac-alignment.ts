import { Vector3D, PointSetRegistrationResult, TransformMatrix4x4 } from '@roomtrace/types';
import { VectorMath } from './vector-math';
import { Umeyama } from './umeyama';

export interface RansacOptions {
  maxIterations?: number;
  inlierThresholdMeters?: number; // Distance tolerance to count as an inlier (e.g. 0.05 m = 5 cm)
  minInliersRatio?: number;       // Ratio of points needed for confident registration (e.g. 0.50)
  maxRegistrationRmse?: number;   // Max acceptable RMSE (e.g. 0.08 m)
}

export class RansacSpatialAligner {
  /**
   * Aligns source points (Scan 2) to target points (Scan 1) using RANSAC-wrapped Umeyama
   */
  static align(
    sourcePoints: Vector3D[],
    targetPoints: Vector3D[],
    options: RansacOptions = {}
  ): PointSetRegistrationResult {
    const maxIterations = options.maxIterations ?? 100;
    const inlierThreshold = options.inlierThresholdMeters ?? 0.05;
    const minInliersRatio = options.minInliersRatio ?? 0.5;
    const maxRegistrationRmse = options.maxRegistrationRmse ?? 0.08;

    const n = sourcePoints.length;
    if (n < 3 || targetPoints.length !== n) {
      return {
        transform: VectorMath.identityMatrix(),
        rotationMatrix: [
          [1, 0, 0],
          [0, 1, 0],
          [0, 0, 1],
        ],
        translation: { x: 0, y: 0, z: 0 },
        scale: 1.0,
        rmseMeters: 999.0,
        inlierRatio: 0.0,
        isReliable: false,
      };
    }

    if (n === 3) {
      // Exactly 3 points: run closed-form Umeyama directly
      return Umeyama.estimateTransform(sourcePoints, targetPoints, false);
    }

    let bestInliers: number[] = [];
    let bestTransform: TransformMatrix4x4 = VectorMath.identityMatrix();
    let bestRmse = Infinity;

    for (let iter = 0; iter < maxIterations; iter++) {
      // 1. Randomly sample 3 non-collinear indices
      const idxs = RansacSpatialAligner.sampleRandomIndices(n, 3);
      const srcSample = [sourcePoints[idxs[0]], sourcePoints[idxs[1]], sourcePoints[idxs[2]]];
      const tgtSample = [targetPoints[idxs[0]], targetPoints[idxs[1]], targetPoints[idxs[2]]];

      try {
        const candidate = Umeyama.estimateTransform(srcSample, tgtSample, false);

        // 2. Count inliers across all points
        const currentInliers: number[] = [];
        let errorSum = 0;

        for (let i = 0; i < n; i++) {
          const transformed = VectorMath.transformPoint(sourcePoints[i], candidate.transform);
          const dist = VectorMath.distance(transformed, targetPoints[i]);
          if (dist <= inlierThreshold) {
            currentInliers.push(i);
            errorSum += dist * dist;
          }
        }

        const candidateRmse = currentInliers.length > 0 ? Math.sqrt(errorSum / currentInliers.length) : Infinity;

        if (
          currentInliers.length > bestInliers.length ||
          (currentInliers.length === bestInliers.length && candidateRmse < bestRmse)
        ) {
          bestInliers = currentInliers;
          bestRmse = candidateRmse;
          bestTransform = candidate.transform;
        }

        // Early exit if almost all points are inliers with very low RMSE
        if (bestInliers.length >= n * 0.95 && bestRmse < 0.02) {
          break;
        }
      } catch {
        // Degenerate collinear sample, continue
      }
    }

    // 3. Re-estimate Umeyama on all inliers for optimal refined fit
    if (bestInliers.length >= 3) {
      const refinedSrc = bestInliers.map((i) => sourcePoints[i]);
      const refinedTgt = bestInliers.map((i) => targetPoints[i]);
      const refinedResult = Umeyama.estimateTransform(refinedSrc, refinedTgt, false);

      const inlierRatio = bestInliers.length / n;
      const isReliable = inlierRatio >= minInliersRatio && refinedResult.rmseMeters <= maxRegistrationRmse;

      return {
        ...refinedResult,
        inlierRatio,
        isReliable,
      };
    }

    // Fallback if RANSAC failed to find consensus
    return {
      transform: bestTransform,
      rotationMatrix: [
        [1, 0, 0],
        [0, 1, 0],
        [0, 0, 1],
      ],
      translation: { x: 0, y: 0, z: 0 },
      scale: 1.0,
      rmseMeters: bestRmse,
      inlierRatio: bestInliers.length / n,
      isReliable: false,
    };
  }

  private static sampleRandomIndices(n: number, k: number): number[] {
    const indices = new Set<number>();
    while (indices.size < k) {
      const r = Math.floor(Math.random() * n);
      indices.add(r);
    }
    return Array.from(indices);
  }
}
