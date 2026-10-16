import { MovementConfig } from '@roomtrace/types';

export const DEFAULT_MOVEMENT_CONFIG: MovementConfig = {
  // Threshold below which displacement is considered sensor noise / tracking jitter
  noiseThresholdMeters: 0.02, // 2 cm

  // Threshold above which displacement is considered significant movement
  minorMovementThresholdMeters: 0.10, // 10 cm

  // Rotation threshold in degrees to distinguish pure rotation in-place
  rotationThresholdDegrees: 15.0,

  // Minimum tracking confidence score from ARCore/ARKit to produce centimeter precision
  minTrackingConfidence: 0.60,

  // Maximum root-mean-square error for scan alignment before flagging alignment uncertainty
  maxRegistrationRmseMeters: 0.08, // 8 cm

  coordinateUnit: 'CENTIMETERS',
};

export const AR_TRACKING_THRESHOLDS = {
  MIN_FEATURES_REQUIRED: 30,
  MIN_PLANES_REQUIRED: 1,
  OPTIMAL_LIGHT_LUX_MIN: 100,
  OPTIMAL_LIGHT_LUX_MAX: 1500,
  MAX_ALLOWED_CAMERA_VELOCITY_MPS: 1.5, // 1.5 m/s motion blur limit
};

export const DEFAULT_CAMERA_INTRINSICS = {
  fx: 1050.0,
  fy: 1050.0,
  cx: 960.0,
  cy: 540.0,
  imageWidth: 1920,
  imageHeight: 1080,
};

export const SYSTEM_LIMITS = {
  MAX_ROOMS_FREE_PLAN: 3,
  MAX_SCANS_PER_MONTH_FREE: 25,
  MAX_STORAGE_BYTES_FREE: 500 * 1024 * 1024, // 500 MB
  MAX_OBJECTS_PER_ROOM: 100,
  SCAN_EXPIRY_DAYS: 365,
};
