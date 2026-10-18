import {
  User,
  Organization,
  Room,
  RoomScan,
  TrackedObject,
  ObjectInstance,
  MovementEvent,
  ScanProcessingJobPayload,
} from '@roomtrace/types';
import { IDatabaseRepository } from './repository.interface';

export class MemoryDatabaseRepository implements IDatabaseRepository {
  private users: Map<string, User & { passwordHash: string }> = new Map();
  private organizations: Map<string, Organization> = new Map();
  private rooms: Map<string, Room> = new Map();
  private scans: Map<string, RoomScan> = new Map();
  private objects: Map<string, TrackedObject> = new Map();
  private instances: Map<string, ObjectInstance> = new Map();
  private movements: Map<string, MovementEvent> = new Map();
  private jobs: Map<string, { id: string; scanId: string; status: string; progress: number; error?: string; payload: ScanProcessingJobPayload }> = new Map();

  constructor() {
    this.seedDefaultData();
  }

  private seedDefaultData() {
    // 1. Seed Organization
    const orgId = 'org-acme-01';
    this.organizations.set(orgId, {
      id: orgId,
      name: 'Acme Spatial Labs',
      slug: 'acme-spatial',
      plan: 'PRO',
      maxRooms: 20,
      maxScansPerMonth: 250,
      createdAt: '2026-01-10T08:00:00.000Z',
      updatedAt: '2026-01-10T08:00:00.000Z',
    });

    // 2. Seed User
    const userId = 'user-alex-01';
    this.users.set(userId, {
      id: userId,
      email: 'alex@roomtrace.io',
      fullName: 'Alex Rivera',
      role: 'ADMIN',
      organizationId: orgId,
      passwordHash: '$2b$12$K8y57tqZ0M6m9FhW/rJk.eX0ZgD6.1u7sP.T0V1N1Y4b3Q8c8j8g2', // "password123"
      createdAt: '2026-01-10T08:00:00.000Z',
      updatedAt: '2026-01-10T08:00:00.000Z',
    });

    // 3. Seed Rooms
    const room1Id = 'room-conf-3b';
    const baselineScanId = 'scan-baseline-01';
    const latestScanId = 'scan-repeat-02';

    this.rooms.set(room1Id, {
      id: room1Id,
      organizationId: orgId,
      name: 'Main Conference Room 3B',
      floor: '3rd Floor',
      building: 'Tech Tower West',
      dimensions: { width: 6.5, height: 3.0, depth: 8.2 },
      baselineScanId,
      objectCount: 5,
      latestScanAt: '2026-09-14T18:45:00.000Z',
      createdAt: '2026-08-01T09:00:00.000Z',
      updatedAt: '2026-09-14T18:45:00.000Z',
    });

    const room2Id = 'room-design-studio';
    this.rooms.set(room2Id, {
      id: room2Id,
      organizationId: orgId,
      name: 'Executive Design Studio',
      floor: '4th Floor',
      building: 'Tech Tower West',
      dimensions: { width: 5.2, height: 2.8, depth: 6.0 },
      baselineScanId: undefined,
      objectCount: 0,
      createdAt: '2026-08-15T11:30:00.000Z',
      updatedAt: '2026-08-15T11:30:00.000Z',
    });

    // 4. Seed Scans for Room 1
    this.scans.set(baselineScanId, {
      id: baselineScanId,
      roomId: room1Id,
      userId,
      deviceId: 'dev-pixel-9-pro',
      scanType: 'BASELINE',
      status: 'COMPLETED',
      qualityScore: 94,
      qualityLevel: 'EXCELLENT',
      featureCount: 1420,
      planeCount: 6,
      detectedObjectCount: 5,
      trackingLossCount: 0,
      pointCloudUri: '/assets/spatial/scan-01-cloud.ply',
      planeMeshUri: '/assets/spatial/scan-01-mesh.obj',
      thumbnailUri: '/assets/thumbnails/room3b-baseline.webp',
      registrationRmseMeters: 0.012,
      createdAt: '2026-09-10T14:30:00.000Z',
      updatedAt: '2026-09-10T14:35:00.000Z',
    });

    this.scans.set(latestScanId, {
      id: latestScanId,
      roomId: room1Id,
      userId,
      deviceId: 'dev-pixel-9-pro',
      scanType: 'REPEAT',
      status: 'COMPLETED',
      qualityScore: 91,
      qualityLevel: 'EXCELLENT',
      featureCount: 1380,
      planeCount: 6,
      detectedObjectCount: 6,
      trackingLossCount: 0,
      pointCloudUri: '/assets/spatial/scan-02-cloud.ply',
      planeMeshUri: '/assets/spatial/scan-02-mesh.obj',
      thumbnailUri: '/assets/thumbnails/room3b-repeat.webp',
      registrationRmseMeters: 0.018,
      createdAt: '2026-09-14T18:40:00.000Z',
      updatedAt: '2026-09-14T18:45:00.000Z',
    });

    // 5. Seed Objects in Room 1
    const objChair1: TrackedObject = {
      id: 'obj-chair-01',
      roomId: room1Id,
      persistentId: 'chair-01',
      category: 'chair',
      userDefinedName: 'Ergonomic Task Chair 01',
      baselinePosition: { x: -0.85, y: 0.42, z: 2.10 },
      baselineDimensions: { width: 0.60, height: 0.88, depth: 0.62 },
      lastSeenPosition: { x: -0.42, y: 0.42, z: 2.12 },
      lastMovementStatus: 'SIGNIFICANT_MOVEMENT',
      totalMovementsCount: 1,
      createdAt: '2026-09-10T14:30:00.000Z',
      updatedAt: '2026-09-14T18:45:00.000Z',
    };

    const objTable1: TrackedObject = {
      id: 'obj-table-01',
      roomId: room1Id,
      persistentId: 'table-01',
      category: 'table',
      userDefinedName: 'Main Conference Table',
      baselinePosition: { x: 0.10, y: 0.38, z: 2.50 },
      baselineDimensions: { width: 1.80, height: 0.76, depth: 0.90 },
      lastSeenPosition: { x: 0.11, y: 0.38, z: 2.51 },
      lastMovementStatus: 'STABLE',
      totalMovementsCount: 0,
      createdAt: '2026-09-10T14:30:00.000Z',
      updatedAt: '2026-09-14T18:45:00.000Z',
    };

    const objLaptop1: TrackedObject = {
      id: 'obj-laptop-01',
      roomId: room1Id,
      persistentId: 'laptop-01',
      category: 'laptop',
      userDefinedName: 'MacBook Pro 16" Presenter',
      baselinePosition: { x: 0.15, y: 0.77, z: 2.35 },
      baselineDimensions: { width: 0.36, height: 0.24, depth: 0.25 },
      lastSeenPosition: { x: 0.16, y: 0.77, z: 2.34 },
      lastMovementStatus: 'STABLE',
      totalMovementsCount: 0,
      createdAt: '2026-09-10T14:30:00.000Z',
      updatedAt: '2026-09-14T18:45:00.000Z',
    };

    const objBox2: TrackedObject = {
      id: 'obj-box-02',
      roomId: room1Id,
      persistentId: 'box-02',
      category: 'box',
      userDefinedName: 'Logistics Storage Box B',
      baselinePosition: { x: 1.25, y: 0.20, z: 2.80 },
      baselineDimensions: { width: 0.45, height: 0.35, depth: 0.40 },
      lastSeenPosition: { x: 1.25, y: 0.20, z: 2.62 },
      lastMovementStatus: 'SIGNIFICANT_MOVEMENT',
      totalMovementsCount: 1,
      createdAt: '2026-09-10T14:30:00.000Z',
      updatedAt: '2026-09-14T18:45:00.000Z',
    };

    const objPlant1: TrackedObject = {
      id: 'obj-plant-01',
      roomId: room1Id,
      persistentId: 'plant-01',
      category: 'plant',
      userDefinedName: 'Fiddle Leaf Fig Planter',
      baselinePosition: { x: -1.60, y: 0.45, z: 3.20 },
      baselineDimensions: { width: 0.40, height: 1.10, depth: 0.40 },
      lastSeenPosition: { x: -1.60, y: 0.45, z: 3.20 },
      lastMovementStatus: 'ROTATED_ONLY',
      totalMovementsCount: 1,
      createdAt: '2026-09-10T14:30:00.000Z',
      updatedAt: '2026-09-14T18:45:00.000Z',
    };

    this.objects.set(objChair1.id, objChair1);
    this.objects.set(objTable1.id, objTable1);
    this.objects.set(objLaptop1.id, objLaptop1);
    this.objects.set(objBox2.id, objBox2);
    this.objects.set(objPlant1.id, objPlant1);

    // 6. Seed Movement Events for Scan 2
    const mvtChair: MovementEvent = {
      id: 'mvt-chair-01',
      objectId: objChair1.id,
      persistentId: 'chair-01',
      objectName: objChair1.userDefinedName,
      category: 'chair',
      baselineScanId,
      currentScanId: latestScanId,
      movementStatus: 'SIGNIFICANT_MOVEMENT',
      displacementEuclideanMeters: 0.43,
      displacementHorizontalMeters: 0.43,
      displacementVerticalMeters: 0.00,
      displacementVector: { x: 0.43, y: 0.00, z: 0.02 },
      rotationDeltaDegrees: 4.2,
      directionLabel: 'to the right (+X)',
      formattedDisplacement: 'Moved 43 cm to the right',
      confidenceScore: 94,
      uncertaintyRadiusMeters: 0.02,
      baselinePosition: objChair1.baselinePosition,
      currentPosition: objChair1.lastSeenPosition!,
      baselineTimestamp: '2026-09-10T14:30:00.000Z',
      currentTimestamp: '2026-09-14T18:40:00.000Z',
      createdAt: '2026-09-14T18:45:00.000Z',
    };

    const mvtTable: MovementEvent = {
      id: 'mvt-table-01',
      objectId: objTable1.id,
      persistentId: 'table-01',
      objectName: objTable1.userDefinedName,
      category: 'table',
      baselineScanId,
      currentScanId: latestScanId,
      movementStatus: 'STABLE',
      displacementEuclideanMeters: 0.021,
      displacementHorizontalMeters: 0.021,
      displacementVerticalMeters: 0.00,
      displacementVector: { x: 0.01, y: 0.00, z: 0.01 },
      rotationDeltaDegrees: 0.8,
      directionLabel: 'in place',
      formattedDisplacement: 'Moved 2.1 cm, below movement threshold',
      confidenceScore: 96,
      uncertaintyRadiusMeters: 0.015,
      baselinePosition: objTable1.baselinePosition,
      currentPosition: objTable1.lastSeenPosition!,
      baselineTimestamp: '2026-09-10T14:30:00.000Z',
      currentTimestamp: '2026-09-14T18:40:00.000Z',
      createdAt: '2026-09-14T18:45:00.000Z',
    };

    const mvtLaptop: MovementEvent = {
      id: 'mvt-laptop-01',
      objectId: objLaptop1.id,
      persistentId: 'laptop-01',
      objectName: objLaptop1.userDefinedName,
      category: 'laptop',
      baselineScanId,
      currentScanId: latestScanId,
      movementStatus: 'STABLE',
      displacementEuclideanMeters: 0.014,
      displacementHorizontalMeters: 0.014,
      displacementVerticalMeters: 0.00,
      displacementVector: { x: 0.01, y: 0.00, z: -0.01 },
      rotationDeltaDegrees: 2.1,
      directionLabel: 'in place',
      formattedDisplacement: 'No significant movement (1.4 cm shift)',
      confidenceScore: 92,
      uncertaintyRadiusMeters: 0.018,
      baselinePosition: objLaptop1.baselinePosition,
      currentPosition: objLaptop1.lastSeenPosition!,
      baselineTimestamp: '2026-09-10T14:30:00.000Z',
      currentTimestamp: '2026-09-14T18:40:00.000Z',
      createdAt: '2026-09-14T18:45:00.000Z',
    };

    const mvtBox: MovementEvent = {
      id: 'mvt-box-02',
      objectId: objBox2.id,
      persistentId: 'box-02',
      objectName: objBox2.userDefinedName,
      category: 'box',
      baselineScanId,
      currentScanId: latestScanId,
      movementStatus: 'SIGNIFICANT_MOVEMENT',
      displacementEuclideanMeters: 0.18,
      displacementHorizontalMeters: 0.18,
      displacementVerticalMeters: 0.00,
      displacementVector: { x: 0.00, y: 0.00, z: -0.18 },
      rotationDeltaDegrees: 3.5,
      directionLabel: 'forward (-Z)',
      formattedDisplacement: 'Moved 18 cm forward',
      confidenceScore: 89,
      uncertaintyRadiusMeters: 0.025,
      baselinePosition: objBox2.baselinePosition,
      currentPosition: objBox2.lastSeenPosition!,
      baselineTimestamp: '2026-09-10T14:30:00.000Z',
      currentTimestamp: '2026-09-14T18:40:00.000Z',
      createdAt: '2026-09-14T18:45:00.000Z',
    };

    const mvtPlant: MovementEvent = {
      id: 'mvt-plant-01',
      objectId: objPlant1.id,
      persistentId: 'plant-01',
      objectName: objPlant1.userDefinedName,
      category: 'plant',
      baselineScanId,
      currentScanId: latestScanId,
      movementStatus: 'ROTATED_ONLY',
      displacementEuclideanMeters: 0.008,
      displacementHorizontalMeters: 0.008,
      displacementVerticalMeters: 0.00,
      displacementVector: { x: 0.00, y: 0.00, z: 0.00 },
      rotationDeltaDegrees: 45.0,
      directionLabel: 'in place',
      formattedDisplacement: 'Rotated 45° in place (position stable)',
      confidenceScore: 90,
      uncertaintyRadiusMeters: 0.02,
      baselinePosition: objPlant1.baselinePosition,
      currentPosition: objPlant1.lastSeenPosition!,
      baselineTimestamp: '2026-09-10T14:30:00.000Z',
      currentTimestamp: '2026-09-14T18:40:00.000Z',
      createdAt: '2026-09-14T18:45:00.000Z',
    };

    this.movements.set(mvtChair.id, mvtChair);
    this.movements.set(mvtTable.id, mvtTable);
    this.movements.set(mvtLaptop.id, mvtLaptop);
    this.movements.set(mvtBox.id, mvtBox);
    this.movements.set(mvtPlant.id, mvtPlant);
  }

  // Users & Auth
  async findUserByEmail(email: string): Promise<User | null> {
    for (const user of this.users.values()) {
      if (user.email.toLowerCase() === email.toLowerCase()) {
        const { passwordHash: _, ...rest } = user;
        return rest;
      }
    }
    return null;
  }

  async findUserById(id: string): Promise<User | null> {
    const user = this.users.get(id);
    if (!user) return null;
    const { passwordHash: _, ...rest } = user;
    return rest;
  }

  async createUser(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>, passwordHash: string): Promise<User> {
    const id = `user-${Math.random().toString(36).substring(2, 9)}`;
    const now = new Date().toISOString();
    const newUser = {
      id,
      ...user,
      passwordHash,
      createdAt: now,
      updatedAt: now,
    };
    this.users.set(id, newUser);
    const { passwordHash: _, ...rest } = newUser;
    return rest;
  }

  // Organizations
  async findOrganizationById(id: string): Promise<Organization | null> {
    return this.organizations.get(id) || null;
  }

  async createOrganization(org: Omit<Organization, 'id' | 'createdAt' | 'updatedAt'>): Promise<Organization> {
    const id = `org-${Math.random().toString(36).substring(2, 9)}`;
    const now = new Date().toISOString();
    const newOrg: Organization = { id, ...org, createdAt: now, updatedAt: now };
    this.organizations.set(id, newOrg);
    return newOrg;
  }

  // Rooms
  async findRoomsByOrg(orgId: string): Promise<Room[]> {
    return Array.from(this.rooms.values()).filter((r) => r.organizationId === orgId);
  }

  async findRoomById(id: string): Promise<Room | null> {
    return this.rooms.get(id) || null;
  }

  async createRoom(room: Omit<Room, 'id' | 'createdAt' | 'updatedAt' | 'objectCount'>): Promise<Room> {
    const id = `room-${Math.random().toString(36).substring(2, 9)}`;
    const now = new Date().toISOString();
    const newRoom: Room = {
      id,
      ...room,
      objectCount: 0,
      createdAt: now,
      updatedAt: now,
    };
    this.rooms.set(id, newRoom);
    return newRoom;
  }

  async deleteRoom(id: string): Promise<boolean> {
    return this.rooms.delete(id);
  }

  // Scans
  async findScansByRoom(roomId: string): Promise<RoomScan[]> {
    return Array.from(this.scans.values())
      .filter((s) => s.roomId === roomId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async findScanById(id: string): Promise<RoomScan | null> {
    return this.scans.get(id) || null;
  }

  async createScan(scan: Omit<RoomScan, 'id' | 'createdAt' | 'updatedAt'>): Promise<RoomScan> {
    const id = `scan-${Math.random().toString(36).substring(2, 9)}`;
    const now = new Date().toISOString();
    const newScan: RoomScan = {
      id,
      ...scan,
      createdAt: now,
      updatedAt: now,
    };
    this.scans.set(id, newScan);

    // Update room latest scan
    const room = this.rooms.get(scan.roomId);
    if (room) {
      room.latestScanAt = now;
      if (scan.scanType === 'BASELINE' || !room.baselineScanId) {
        room.baselineScanId = id;
      }
    }

    return newScan;
  }

  async updateScanStatus(id: string, status: RoomScan['status'], extra?: Partial<RoomScan>): Promise<RoomScan> {
    const scan = this.scans.get(id);
    if (!scan) throw new Error(`Scan ${id} not found`);
    scan.status = status;
    scan.updatedAt = new Date().toISOString();
    if (extra) Object.assign(scan, extra);
    return scan;
  }

  // Tracked Objects
  async findObjectsByRoom(roomId: string): Promise<TrackedObject[]> {
    return Array.from(this.objects.values()).filter((o) => o.roomId === roomId);
  }

  async findObjectById(id: string): Promise<TrackedObject | null> {
    return this.objects.get(id) || null;
  }

  async saveTrackedObject(obj: Omit<TrackedObject, 'id' | 'createdAt' | 'updatedAt'>): Promise<TrackedObject> {
    const id = `obj-${Math.random().toString(36).substring(2, 9)}`;
    const now = new Date().toISOString();
    const newObj: TrackedObject = { id, ...obj, createdAt: now, updatedAt: now };
    this.objects.set(id, newObj);

    // Update object count on room
    const room = this.rooms.get(obj.roomId);
    if (room) {
      room.objectCount = Array.from(this.objects.values()).filter((o) => o.roomId === obj.roomId).length;
    }

    return newObj;
  }

  async updateObjectName(id: string, name: string): Promise<TrackedObject> {
    const obj = this.objects.get(id);
    if (!obj) throw new Error(`Object ${id} not found`);
    obj.userDefinedName = name;
    obj.updatedAt = new Date().toISOString();
    return obj;
  }

  // Instances
  async saveObjectInstance(instance: Omit<ObjectInstance, 'id' | 'createdAt'>): Promise<ObjectInstance> {
    const id = `inst-${Math.random().toString(36).substring(2, 9)}`;
    const now = new Date().toISOString();
    const newInst: ObjectInstance = { id, ...instance, createdAt: now };
    this.instances.set(id, newInst);
    return newInst;
  }

  async findInstancesByScan(scanId: string): Promise<ObjectInstance[]> {
    return Array.from(this.instances.values()).filter((i) => i.scanId === scanId);
  }

  // Movement Events
  async saveMovementEvent(event: Omit<MovementEvent, 'id' | 'createdAt'>): Promise<MovementEvent> {
    const id = `mvt-${Math.random().toString(36).substring(2, 9)}`;
    const now = new Date().toISOString();
    const newEvent: MovementEvent = { id, ...event, createdAt: now };
    this.movements.set(id, newEvent);

    // Update object last status
    const obj = this.objects.get(event.objectId);
    if (obj) {
      obj.lastSeenPosition = event.currentPosition;
      obj.lastMovementStatus = event.movementStatus;
      if (event.movementStatus === 'SIGNIFICANT_MOVEMENT' || event.movementStatus === 'MINOR_MOVEMENT') {
        obj.totalMovementsCount += 1;
      }
      obj.updatedAt = now;
    }

    return newEvent;
  }

  async findMovementsByScan(scanId: string): Promise<MovementEvent[]> {
    return Array.from(this.movements.values()).filter((m) => m.currentScanId === scanId);
  }

  async findMovementsByRoom(roomId: string): Promise<MovementEvent[]> {
    const roomObjects = await this.findObjectsByRoom(roomId);
    const objectIds = new Set(roomObjects.map((o) => o.id));
    return Array.from(this.movements.values()).filter((m) => objectIds.has(m.objectId));
  }

  async findMovementsByObject(objectId: string): Promise<MovementEvent[]> {
    return Array.from(this.movements.values())
      .filter((m) => m.objectId === objectId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  // Processing Jobs
  async createProcessingJob(scanId: string, payload: ScanProcessingJobPayload): Promise<string> {
    const id = `job-${Math.random().toString(36).substring(2, 9)}`;
    this.jobs.set(id, {
      id,
      scanId,
      status: 'QUEUED',
      progress: 0,
      payload,
    });
    return id;
  }

  async getProcessingJob(jobId: string): Promise<{ id: string; status: string; progress: number } | null> {
    const job = this.jobs.get(jobId);
    if (!job) return null;
    return { id: job.id, status: job.status, progress: job.progress };
  }

  async updateProcessingJob(jobId: string, status: string, progress: number, error?: string): Promise<void> {
    const job = this.jobs.get(jobId);
    if (job) {
      job.status = status;
      job.progress = progress;
      if (error) job.error = error;
    }
  }
}
