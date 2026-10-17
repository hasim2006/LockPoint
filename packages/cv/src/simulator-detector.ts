import { IObjectDetector, DetectionResult, ModelMetadata } from './detector.interface';

export class DeterministicSimulatorDetector implements IObjectDetector {
  private injectedResults: DetectionResult[] | null = null;

  constructor(injectedResults?: DetectionResult[]) {
    if (injectedResults) {
      this.injectedResults = injectedResults;
    }
  }

  getMetadata(): ModelMetadata {
    return {
      name: 'YOLOv8-IndoorSimulator',
      version: '8.1.0',
      framework: 'SIMULATOR',
      inputResolution: [640, 640],
      classes: [
        'chair',
        'table',
        'laptop',
        'box',
        'bottle',
        'bag',
        'monitor',
        'keyboard',
        'couch',
        'plant',
        'desk',
        'book',
      ],
      isEdgeOptimized: true,
    };
  }

  setInjectedResults(results: DetectionResult[]) {
    this.injectedResults = results;
  }

  async detect(_imageBuffer: Uint8Array | Buffer | ImageData): Promise<DetectionResult[]> {
    if (this.injectedResults) {
      return [...this.injectedResults];
    }

    // Default realistic indoor room detection fixture
    return [
      {
        category: 'chair',
        confidence: 0.94,
        bbox2D: { xMin: 0.15, yMin: 0.35, xMax: 0.40, yMax: 0.85 },
        estimated3DPose: {
          position: { x: -0.85, y: 0.42, z: 2.10 },
          rotation: { w: 1, x: 0, y: 0, z: 0 },
          dimensions: { width: 0.55, height: 0.85, depth: 0.58 },
        },
      },
      {
        category: 'table',
        confidence: 0.96,
        bbox2D: { xMin: 0.30, yMin: 0.45, xMax: 0.85, yMax: 0.90 },
        estimated3DPose: {
          position: { x: 0.10, y: 0.38, z: 2.45 },
          rotation: { w: 1, x: 0, y: 0, z: 0 },
          dimensions: { width: 1.40, height: 0.75, depth: 0.80 },
        },
      },
      {
        category: 'laptop',
        confidence: 0.91,
        bbox2D: { xMin: 0.45, yMin: 0.40, xMax: 0.60, yMax: 0.55 },
        estimated3DPose: {
          position: { x: 0.05, y: 0.78, z: 2.30 },
          rotation: { w: 1, x: 0, y: 0, z: 0 },
          dimensions: { width: 0.35, height: 0.22, depth: 0.25 },
        },
      },
      {
        category: 'box',
        confidence: 0.88,
        bbox2D: { xMin: 0.70, yMin: 0.65, xMax: 0.88, yMax: 0.88 },
        estimated3DPose: {
          position: { x: 1.15, y: 0.25, z: 2.75 },
          rotation: { w: 1, x: 0, y: 0, z: 0 },
          dimensions: { width: 0.45, height: 0.40, depth: 0.40 },
        },
      },
    ];
  }
}
