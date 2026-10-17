import { Vector3D, PlanarAnchor, TransformMatrix4x4 } from '@roomtrace/types';
import { VectorMath } from '@roomtrace/spatial';
import { DEFAULT_CAMERA_INTRINSICS } from '@roomtrace/config';

export interface CameraIntrinsics {
  fx: number;
  fy: number;
  cx: number;
  cy: number;
  imageWidth: number;
  imageHeight: number;
}

export class Raycasting3DProjector {
  private intrinsics: CameraIntrinsics;

  constructor(intrinsics?: Partial<CameraIntrinsics>) {
    this.intrinsics = { ...DEFAULT_CAMERA_INTRINSICS, ...intrinsics };
  }

  /**
   * Cast a ray from camera optical center through pixel (u, v) into 3D world space
   * @param normalizedU Normalized image X coordinate [0.0, 1.0]
   * @param normalizedV Normalized image Y coordinate [0.0, 1.0]
   * @param cameraPose 4x4 matrix representing camera pose in world frame [R | t]
   */
  createRay(
    normalizedU: number,
    normalizedV: number,
    cameraPose: TransformMatrix4x4
  ): { origin: Vector3D; direction: Vector3D } {
    const px = normalizedU * this.intrinsics.imageWidth;
    const py = normalizedV * this.intrinsics.imageHeight;

    // Direction in camera local coordinates (OpenGL: -Z forward, X right, Y up)
    const xCam = (px - this.intrinsics.cx) / this.intrinsics.fx;
    const yCam = -(py - this.intrinsics.cy) / this.intrinsics.fy; // inverted Y for screen coords
    const zCam = -1.0;

    const dirCamNormalized = VectorMath.normalize({ x: xCam, y: yCam, z: zCam });

    // Extract camera position (translation column of cameraPose)
    const origin: Vector3D = {
      x: cameraPose[3],
      y: cameraPose[7],
      z: cameraPose[11],
    };

    // Transform direction vector by 3x3 rotation of camera pose
    const dirWorld: Vector3D = {
      x: cameraPose[0] * dirCamNormalized.x + cameraPose[1] * dirCamNormalized.y + cameraPose[2] * dirCamNormalized.z,
      y: cameraPose[4] * dirCamNormalized.x + cameraPose[5] * dirCamNormalized.y + cameraPose[6] * dirCamNormalized.z,
      z: cameraPose[8] * dirCamNormalized.x + cameraPose[9] * dirCamNormalized.y + cameraPose[10] * dirCamNormalized.z,
    };

    return {
      origin,
      direction: VectorMath.normalize(dirWorld),
    };
  }

  /**
   * Find intersection point between a 3D ray and an AR plane anchor
   * Plane equation: (p - p0) . normal = 0
   */
  intersectPlane(
    ray: { origin: Vector3D; direction: Vector3D },
    plane: PlanarAnchor
  ): Vector3D | null {
    const denom = VectorMath.dot(ray.direction, plane.normal);
    if (Math.abs(denom) < 1e-6) {
      // Ray is parallel to the plane
      return null;
    }

    const p0MinusOrigin = VectorMath.subtract(plane.center, ray.origin);
    const t = VectorMath.dot(p0MinusOrigin, plane.normal) / denom;

    if (t < 0) {
      // Plane is behind the camera
      return null;
    }

    return VectorMath.add(ray.origin, VectorMath.scale(ray.direction, t));
  }

  /**
   * Estimate 3D position given 2D bbox centroid and a list of detected AR planes
   */
  estimatePositionFromPlanes(
    normalizedU: number,
    normalizedV: number,
    cameraPose: TransformMatrix4x4,
    planes: PlanarAnchor[],
    fallbackDepthMeters: number = 1.5
  ): { position: Vector3D; confidence: number } {
    const ray = this.createRay(normalizedU, normalizedV, cameraPose);

    let closestHit: Vector3D | null = null;
    let closestDist = Infinity;

    for (const plane of planes) {
      const hit = this.intersectPlane(ray, plane);
      if (hit) {
        const dist = VectorMath.distance(ray.origin, hit);
        // Ensure hit is within reasonable indoor room distance (0.3 m to 10 m)
        if (dist >= 0.3 && dist <= 10.0 && dist < closestDist) {
          closestDist = dist;
          closestHit = hit;
        }
      }
    }

    if (closestHit) {
      return { position: closestHit, confidence: 0.90 };
    }

    // Fallback using average depth estimation along ray
    const fallbackPos = VectorMath.add(ray.origin, VectorMath.scale(ray.direction, fallbackDepthMeters));
    return { position: fallbackPos, confidence: 0.55 };
  }
}
