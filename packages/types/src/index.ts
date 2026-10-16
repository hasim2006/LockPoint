/**
 * RoomTrace Domain Types and Data Transfer Objects
 * Coordinate System: Right-handed Cartesian (Meters)
 * X: Right, Y: Up (against gravity), Z: Depth / Forward
 */

export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

export interface Quaternion4D {
  w: number;
  x: number;
  y: number;
  z: number;
}

export interface Dimensions3D {
  width: number;  // along local X in meters
  height: number; // along local Y in meters
  depth: number;  // along local Z in meters
}

export interface BoundingBox2D {
  xMin: number; // normalized [0, 1]
  yMin: number;
  xMax: number;
  yMax: number;
}

export interface BoundingBox3D {
  center: Vector3D;
  dimensions: Dimensions3D;
  rotation: Quaternion4D;
}

export type TransformMatrix4x4 = [
  number, number, number, number,
  number, number, number, number,
  number, number, number, number,
  number, number, number, number
];

export type Role = 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';

export type MovementStatus =
  | 'STABLE'                // Displacement < noise threshold (e.g. < 2 cm)
  | 'MINOR_MOVEMENT'        // 2 cm <= Displacement < 10 cm
  | 'SIGNIFICANT_MOVEMENT'  // Displacement >= 10 cm
  | 'ROTATED_ONLY'          // Displacement < 2 cm, but rotation delta >= 15 deg
  | 'NEW_OBJECT'            // Detected in current scan, absent in baseline
  | 'DISAPPEARED'           // Present in baseline, camera viewed area, absent now
  | 'OCCLUDED'              // Expected position occluded by another object/structure
  | 'UNCERTAIN_TRACKING';   // AR tracking quality insufficient for centimeter precision

export type ScanQuality = 'EXCELLENT' | 'GOOD' | 'ACCEPTABLE' | 'POOR' | 'UNRELIABLE';

export type ScanStatus = 'PENDING' | 'UPLOADING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export type JobStatus = 'QUEUED' | 'ACTIVE' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

export type ObjectCategory =
  | 'chair'
  | 'table'
  | 'laptop'
  | 'box'
  | 'bottle'
  | 'bag'
  | 'monitor'
  | 'keyboard'
  | 'couch'
  | 'plant'
  | 'desk'
  | 'book'
  | 'backpack'
  | 'cabinet'
  | 'other';

export interface PlanarAnchor {
  id: string;
  normal: Vector3D;
  center: Vector3D;
  extentX: number;
  extentZ: number;
  planeType: 'HORIZONTAL_UPWARD' | 'HORIZONTAL_DOWNWARD' | 'VERTICAL';
}

export interface SpatialKeypoint {
  id: string;
  position: Vector3D;
  descriptor?: number[];
  confidence: number;
}

export interface PointSetRegistrationResult {
  transform: TransformMatrix4x4;
  rotationMatrix: [
    [number, number, number],
    [number, number, number],
    [number, number, number]
  ];
  translation: Vector3D;
  scale: number;
  rmseMeters: number;
  inlierRatio: number;
  isReliable: boolean;
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  plan: 'FREE' | 'PRO' | 'TEAM' | 'ENTERPRISE';
  maxRooms: number;
  maxScansPerMonth: number;
  createdAt: string;
  updatedAt: string;
}

export interface Room {
  id: string;
  organizationId: string;
  name: string;
  floor?: string;
  building?: string;
  dimensions?: Dimensions3D;
  baselineScanId?: string;
  objectCount: number;
  latestScanAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RoomScan {
  id: string;
  roomId: string;
  userId: string;
  deviceId: string;
  scanType: 'BASELINE' | 'REPEAT';
  status: ScanStatus;
  qualityScore: number; // 0 - 100
  qualityLevel: ScanQuality;
  featureCount: number;
  planeCount: number;
  detectedObjectCount: number;
  trackingLossCount: number;
  pointCloudUri?: string;
  planeMeshUri?: string;
  thumbnailUri?: string;
  registrationRmseMeters?: number;
  createdAt: string;
  updatedAt: string;
}

export interface TrackedObject {
  id: string;
  roomId: string;
  persistentId: string; // e.g. "chair-01", "laptop-02"
  category: ObjectCategory;
  userDefinedName: string;
  baselinePosition: Vector3D;
  baselineDimensions: Dimensions3D;
  lastSeenPosition?: Vector3D;
  lastMovementStatus?: MovementStatus;
  totalMovementsCount: number;
  status?: 'ACTIVE' | 'ARCHIVED' | 'MISSING';
  createdAt: string;
  updatedAt: string;
}

export interface ObjectInstance {
  id: string;
  objectId: string;
  scanId: string;
  category: ObjectCategory;
  boundingBox2D: BoundingBox2D;
  boundingBox3D: BoundingBox3D;
  position: Vector3D;
  rotation: Quaternion4D;
  dimensions: Dimensions3D;
  detectionConfidence: number; // 0.0 - 1.0
  trackingConfidence: number;  // 0.0 - 1.0
  depthUncertaintyMeters: number;
  createdAt: string;
}

export interface MovementEvent {
  id: string;
  objectId: string;
  persistentId: string;
  objectName: string;
  category: ObjectCategory;
  baselineScanId: string;
  currentScanId: string;
  movementStatus: MovementStatus;
  displacementEuclideanMeters: number;
  displacementHorizontalMeters: number;
  displacementVerticalMeters: number;
  displacementVector: Vector3D;
  rotationDeltaDegrees: number;
  directionLabel: string;
  formattedDisplacement: string; // e.g. "Moved 43 cm to the right"
  confidenceScore: number;       // 0 - 100%
  uncertaintyRadiusMeters: number;
  baselinePosition: Vector3D;
  currentPosition: Vector3D;
  baselineTimestamp: string;
  currentTimestamp: string;
  notes?: string;
  createdAt: string;
}

export interface MovementConfig {
  noiseThresholdMeters: number;         // default: 0.02 (2 cm)
  minorMovementThresholdMeters: number; // default: 0.10 (10 cm)
  rotationThresholdDegrees: number;     // default: 15.0 deg
  minTrackingConfidence: number;        // default: 0.60
  maxRegistrationRmseMeters: number;    // default: 0.08 (8 cm)
  coordinateUnit: 'METERS' | 'CENTIMETERS';
}

export interface ScanProcessingJobPayload {
  scanId: string;
  roomId: string;
  scanType: 'BASELINE' | 'REPEAT';
  baselineScanId?: string;
  deviceInfo: {
    model: string;
    hasLidar: boolean;
    arEngine: 'ARCORE' | 'ARKIT' | 'SIMULATOR';
  };
  planes: PlanarAnchor[];
  keypoints: SpatialKeypoint[];
  rawDetections?: {
    category: ObjectCategory;
    bbox2d: BoundingBox2D;
    confidence: number;
    depthAtCenterMeters?: number;
    estimatedPose?: {
      position: Vector3D;
      rotation: Quaternion4D;
      dimensions: Dimensions3D;
    };
  }[];
}

export interface MovementReportSummary {
  roomId: string;
  roomName: string;
  baselineScan: {
    id: string;
    timestamp: string;
  };
  currentScan: {
    id: string;
    timestamp: string;
  };
  totalObjectsTracked: number;
  stableCount: number;
  minorMovementCount: number;
  significantMovementCount: number;
  newObjectsCount: number;
  disappearedCount: number;
  occludedCount: number;
  uncertainTrackingCount: number;
  events: MovementEvent[];
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    requestId?: string;
    details?: any;
  };
}
