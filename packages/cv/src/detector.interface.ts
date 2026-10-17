import { BoundingBox2D, ObjectCategory, Vector3D, Dimensions3D, Quaternion4D } from '@roomtrace/types';

export interface DetectionResult {
  category: ObjectCategory;
  confidence: number;
  bbox2D: BoundingBox2D;
  featureDescriptor?: number[];
  estimated3DPose?: {
    position: Vector3D;
    rotation: Quaternion4D;
    dimensions: Dimensions3D;
  };
}

export interface ModelMetadata {
  name: string;
  version: string;
  framework: 'ONNX' | 'TFLITE' | 'TENSORRT' | 'SIMULATOR';
  inputResolution: [number, number];
  classes: ObjectCategory[];
  isEdgeOptimized: boolean;
}

export interface IObjectDetector {
  getMetadata(): ModelMetadata;
  detect(imageBuffer: Uint8Array | Buffer | ImageData): Promise<DetectionResult[]>;
  dispose?(): Promise<void>;
}
