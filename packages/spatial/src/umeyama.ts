import { Vector3D, PointSetRegistrationResult } from '@roomtrace/types';
import { VectorMath } from './vector-math';

type Matrix3x3 = [
  [number, number, number],
  [number, number, number],
  [number, number, number]
];

export class Umeyama {
  /**
   * Estimate rigid body transformation [R | t] from source points to target points
   * target ~ R * source + t
   * @param sourcePoints Set of 3D points in Scan 2
   * @param targetPoints Corresponding set of 3D points in Scan 1
   * @param withScaling Allow uniform scaling if camera depth scales slightly (default: false for metric AR)
   */
  static estimateTransform(
    sourcePoints: Vector3D[],
    targetPoints: Vector3D[],
    withScaling: boolean = false
  ): PointSetRegistrationResult {
    const n = sourcePoints.length;
    if (n < 3 || targetPoints.length !== n) {
      throw new Error(`Umeyama registration requires at least 3 matched corresponding points (got ${n})`);
    }

    // 1. Calculate centroids
    let srcCentroid: Vector3D = { x: 0, y: 0, z: 0 };
    let tgtCentroid: Vector3D = { x: 0, y: 0, z: 0 };

    for (let i = 0; i < n; i++) {
      srcCentroid = VectorMath.add(srcCentroid, sourcePoints[i]);
      tgtCentroid = VectorMath.add(tgtCentroid, targetPoints[i]);
    }
    srcCentroid = VectorMath.scale(srcCentroid, 1 / n);
    tgtCentroid = VectorMath.scale(tgtCentroid, 1 / n);

    // 2. Center the points and compute variances
    const srcCentered: Vector3D[] = [];
    const tgtCentered: Vector3D[] = [];
    let srcVar = 0;

    for (let i = 0; i < n; i++) {
      const sc = VectorMath.subtract(sourcePoints[i], srcCentroid);
      const tc = VectorMath.subtract(targetPoints[i], tgtCentroid);
      srcCentered.push(sc);
      tgtCentered.push(tc);
      srcVar += VectorMath.dot(sc, sc);
    }
    srcVar /= n;

    // 3. Compute 3x3 cross-covariance matrix H = (1/n) * sum(tgt_i * src_i^T)
    const H: Matrix3x3 = [
      [0, 0, 0],
      [0, 0, 0],
      [0, 0, 0],
    ];

    for (let i = 0; i < n; i++) {
      const tc = tgtCentered[i];
      const sc = srcCentered[i];

      H[0][0] += tc.x * sc.x;
      H[0][1] += tc.x * sc.y;
      H[0][2] += tc.x * sc.z;

      H[1][0] += tc.y * sc.x;
      H[1][1] += tc.y * sc.y;
      H[1][2] += tc.y * sc.z;

      H[2][0] += tc.z * sc.x;
      H[2][1] += tc.z * sc.y;
      H[2][2] += tc.z * sc.z;
    }

    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        H[r][c] /= n;
      }
    }

    // 4. Compute SVD of H: H = U * S * V^T
    const { U, S, V } = Umeyama.svd3x3(H);

    // 5. Compute rotation: R = U * D * V^T
    // Where D = diag(1, 1, det(U)*det(V)) to ensure proper rotation (det(R) = +1, no reflection)
    const detU = Umeyama.det3x3(U);
    const detV = Umeyama.det3x3(V);
    const d = detU * detV < 0 ? -1 : 1;

    const D: Matrix3x3 = [
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, d],
    ];

    const UD = Umeyama.multiply3x3(U, D);
    const Vt = Umeyama.transpose3x3(V);
    const R = Umeyama.multiply3x3(UD, Vt);

    // 6. Compute scale
    let scale = 1.0;
    if (withScaling && srcVar > 1e-9) {
      const traceDS = S[0] * D[0][0] + S[1] * D[1][1] + S[2] * D[2][2];
      scale = traceDS / srcVar;
    }

    // 7. Compute translation: t = tgtCentroid - scale * R * srcCentroid
    const rotatedSrcCentroid = VectorMath.rotatePoint(srcCentroid, R);
    const scaledRotatedSrcCentroid = VectorMath.scale(rotatedSrcCentroid, scale);
    const translation = VectorMath.subtract(tgtCentroid, scaledRotatedSrcCentroid);

    // 8. Calculate registration error (RMSE)
    const transform = VectorMath.composeTransformMatrix(R, translation);
    let sumSqError = 0;
    for (let i = 0; i < n; i++) {
      const transformedSource = VectorMath.transformPoint(sourcePoints[i], transform);
      const err = VectorMath.distance(transformedSource, targetPoints[i]);
      sumSqError += err * err;
    }
    const rmse = Math.sqrt(sumSqError / n);

    return {
      transform,
      rotationMatrix: R,
      translation,
      scale,
      rmseMeters: rmse,
      inlierRatio: 1.0,
      isReliable: rmse < 0.08,
    };
  }

  static det3x3(m: Matrix3x3): number {
    return (
      m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1]) -
      m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0]) +
      m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0])
    );
  }

  static transpose3x3(m: Matrix3x3): Matrix3x3 {
    return [
      [m[0][0], m[1][0], m[2][0]],
      [m[0][1], m[1][1], m[2][1]],
      [m[0][2], m[1][2], m[2][2]],
    ];
  }

  static multiply3x3(a: Matrix3x3, b: Matrix3x3): Matrix3x3 {
    const result: Matrix3x3 = [
      [0, 0, 0],
      [0, 0, 0],
      [0, 0, 0],
    ];
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        result[r][c] = a[r][0] * b[0][c] + a[r][1] * b[1][c] + a[r][2] * b[2][c];
      }
    }
    return result;
  }

  /**
   * Deterministic Hestenes One-Sided Jacobi SVD for 3x3 matrices
   * Numerically stable without squaring condition numbers
   */
  static svd3x3(A: Matrix3x3): { U: Matrix3x3; S: [number, number, number]; V: Matrix3x3 } {
    const a: [[number, number, number], [number, number, number], [number, number, number]] = [
      [A[0][0], A[1][0], A[2][0]],
      [A[0][1], A[1][1], A[2][1]],
      [A[0][2], A[1][2], A[2][2]],
    ];

    const v: [[number, number, number], [number, number, number], [number, number, number]] = [
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 1],
    ];

    for (let sweep = 0; sweep < 25; sweep++) {
      for (let p = 0; p < 2; p++) {
        for (let q = p + 1; q < 3; q++) {
          const ap = a[p];
          const aq = a[q];

          const alpha = ap[0] * ap[0] + ap[1] * ap[1] + ap[2] * ap[2];
          const beta = aq[0] * aq[0] + aq[1] * aq[1] + aq[2] * aq[2];
          const gamma = ap[0] * aq[0] + ap[1] * aq[1] + ap[2] * aq[2];

          if (Math.abs(gamma) < 1e-12 * Math.sqrt(alpha * beta + 1e-18)) {
            continue;
          }

          const zeta = (beta - alpha) / (2 * gamma);
          const t = (zeta >= 0 ? 1 : -1) / (Math.abs(zeta) + Math.sqrt(1 + zeta * zeta));
          const c = 1 / Math.sqrt(1 + t * t);
          const s = t * c;

          for (let r = 0; r < 3; r++) {
            const apr = ap[r];
            const aqr = aq[r];
            ap[r] = c * apr - s * aqr;
            aq[r] = s * apr + c * aqr;

            const vpr = v[p][r];
            const vqr = v[q][r];
            v[p][r] = c * vpr - s * vqr;
            v[q][r] = s * vpr + c * vqr;
          }
        }
      }
    }

    const s0 = Math.sqrt(a[0][0] * a[0][0] + a[0][1] * a[0][1] + a[0][2] * a[0][2]);
    const s1 = Math.sqrt(a[1][0] * a[1][0] + a[1][1] * a[1][1] + a[1][2] * a[1][2]);
    const s2 = Math.sqrt(a[2][0] * a[2][0] + a[2][1] * a[2][1] + a[2][2] * a[2][2]);

    const U: Matrix3x3 = [
      [s0 > 1e-9 ? a[0][0] / s0 : 1, s1 > 1e-9 ? a[1][0] / s1 : 0, s2 > 1e-9 ? a[2][0] / s2 : 0],
      [s0 > 1e-9 ? a[0][1] / s0 : 0, s1 > 1e-9 ? a[1][1] / s1 : 1, s2 > 1e-9 ? a[2][1] / s2 : 0],
      [s0 > 1e-9 ? a[0][2] / s0 : 0, s1 > 1e-9 ? a[1][2] / s1 : 0, s2 > 1e-9 ? a[2][2] / s2 : 1],
    ];

    const V: Matrix3x3 = [
      [v[0][0], v[1][0], v[2][0]],
      [v[0][1], v[1][1], v[2][1]],
      [v[0][2], v[1][2], v[2][2]],
    ];

    return { U, S: [s0, s1, s2], V };
  }
}
