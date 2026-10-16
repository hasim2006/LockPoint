import { Vector3D, Quaternion4D, TransformMatrix4x4 } from '@roomtrace/types';

export class VectorMath {
  static add(a: Vector3D, b: Vector3D): Vector3D {
    return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
  }

  static subtract(a: Vector3D, b: Vector3D): Vector3D {
    return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
  }

  static scale(v: Vector3D, s: number): Vector3D {
    return { x: v.x * s, y: v.y * s, z: v.z * s };
  }

  static dot(a: Vector3D, b: Vector3D): number {
    return a.x * b.x + a.y * b.y + a.z * b.z;
  }

  static cross(a: Vector3D, b: Vector3D): Vector3D {
    return {
      x: a.y * b.z - a.z * b.y,
      y: a.z * b.x - a.x * b.z,
      z: a.x * b.y - a.y * b.x,
    };
  }

  static magnitude(v: Vector3D): number {
    return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
  }

  static distance(a: Vector3D, b: Vector3D): number {
    return VectorMath.magnitude(VectorMath.subtract(a, b));
  }

  static normalize(v: Vector3D): Vector3D {
    const mag = VectorMath.magnitude(v);
    if (mag < 1e-9) return { x: 0, y: 0, z: 0 };
    return { x: v.x / mag, y: v.y / mag, z: v.z / mag };
  }

  /**
   * Apply a 4x4 affine transform matrix [R | t] to a 3D point in homogeneous coordinates
   */
  static transformPoint(p: Vector3D, m: TransformMatrix4x4): Vector3D {
    const x = m[0] * p.x + m[1] * p.y + m[2] * p.z + m[3];
    const y = m[4] * p.x + m[5] * p.y + m[6] * p.z + m[7];
    const z = m[8] * p.x + m[9] * p.y + m[10] * p.z + m[11];
    const w = m[12] * p.x + m[13] * p.y + m[14] * p.z + m[15];

    if (Math.abs(w - 1.0) > 1e-6 && Math.abs(w) > 1e-9) {
      return { x: x / w, y: y / w, z: z / w };
    }
    return { x, y, z };
  }

  /**
   * Apply 3x3 rotation matrix to a 3D vector
   */
  static rotatePoint(p: Vector3D, R: [[number, number, number], [number, number, number], [number, number, number]]): Vector3D {
    return {
      x: R[0][0] * p.x + R[0][1] * p.y + R[0][2] * p.z,
      y: R[1][0] * p.x + R[1][1] * p.y + R[1][2] * p.z,
      z: R[2][0] * p.x + R[2][1] * p.y + R[2][2] * p.z,
    };
  }

  /**
   * Calculate angular difference in degrees between two unit quaternions
   */
  static quaternionAngleDifferenceDegrees(q1: Quaternion4D, q2: Quaternion4D): number {
    // Ensure quaternions are normalized
    const dot = Math.abs(q1.w * q2.w + q1.x * q2.x + q1.y * q2.y + q1.z * q2.z);
    const clampedDot = Math.min(1.0, Math.max(-1.0, dot));
    const angleRad = 2.0 * Math.acos(clampedDot);
    return (angleRad * 180.0) / Math.PI;
  }

  /**
   * Rotate a vector by a quaternion: v' = q * v * q^-1
   */
  static rotateByQuaternion(v: Vector3D, q: Quaternion4D): Vector3D {
    const u = { x: q.x, y: q.y, z: q.z };
    const s = q.w;

    // Rodriguez-like formula: v' = 2*(u . v)*u + (s^2 - u.u)*v + 2*s*(u x v)
    const uDotV = VectorMath.dot(u, v);
    const uDotU = VectorMath.dot(u, u);
    const uCrossV = VectorMath.cross(u, v);

    return {
      x: 2 * uDotV * u.x + (s * s - uDotU) * v.x + 2 * s * uCrossV.x,
      y: 2 * uDotV * u.y + (s * s - uDotU) * v.y + 2 * s * uCrossV.y,
      z: 2 * uDotV * u.z + (s * s - uDotU) * v.z + 2 * s * uCrossV.z,
    };
  }

  /**
   * Build 4x4 matrix from 3x3 rotation and translation vector
   */
  static composeTransformMatrix(
    R: [[number, number, number], [number, number, number], [number, number, number]],
    t: Vector3D
  ): TransformMatrix4x4 {
    return [
      R[0][0], R[0][1], R[0][2], t.x,
      R[1][0], R[1][1], R[1][2], t.y,
      R[2][0], R[2][1], R[2][2], t.z,
      0,       0,       0,       1,
    ];
  }

  /**
   * Identity 4x4 matrix
   */
  static identityMatrix(): TransformMatrix4x4 {
    return [
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1,
    ];
  }
}
