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

export interface IDatabaseRepository {
  // Users & Auth
  findUserByEmail(email: string): Promise<User | null>;
  findUserById(id: string): Promise<User | null>;
  createUser(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>, passwordHash: string): Promise<User>;

  // Organizations
  findOrganizationById(id: string): Promise<Organization | null>;
  createOrganization(org: Omit<Organization, 'id' | 'createdAt' | 'updatedAt'>): Promise<Organization>;

  // Rooms
  findRoomsByOrg(orgId: string): Promise<Room[]>;
  findRoomById(id: string): Promise<Room | null>;
  createRoom(room: Omit<Room, 'id' | 'createdAt' | 'updatedAt' | 'objectCount'>): Promise<Room>;
  deleteRoom(id: string): Promise<boolean>;

  // Scans
  findScansByRoom(roomId: string): Promise<RoomScan[]>;
  findScanById(id: string): Promise<RoomScan | null>;
  createScan(scan: Omit<RoomScan, 'id' | 'createdAt' | 'updatedAt'>): Promise<RoomScan>;
  updateScanStatus(id: string, status: RoomScan['status'], extra?: Partial<RoomScan>): Promise<RoomScan>;

  // Tracked Objects
  findObjectsByRoom(roomId: string): Promise<TrackedObject[]>;
  findObjectById(id: string): Promise<TrackedObject | null>;
  saveTrackedObject(obj: Omit<TrackedObject, 'id' | 'createdAt' | 'updatedAt'>): Promise<TrackedObject>;
  updateObjectName(id: string, name: string): Promise<TrackedObject>;

  // Instances & Observations
  saveObjectInstance(instance: Omit<ObjectInstance, 'id' | 'createdAt'>): Promise<ObjectInstance>;
  findInstancesByScan(scanId: string): Promise<ObjectInstance[]>;

  // Movement Events
  saveMovementEvent(event: Omit<MovementEvent, 'id' | 'createdAt'>): Promise<MovementEvent>;
  findMovementsByScan(scanId: string): Promise<MovementEvent[]>;
  findMovementsByRoom(roomId: string): Promise<MovementEvent[]>;
  findMovementsByObject(objectId: string): Promise<MovementEvent[]>;

  // Processing Jobs
  createProcessingJob(scanId: string, payload: ScanProcessingJobPayload): Promise<string>;
  getProcessingJob(jobId: string): Promise<{ id: string; status: string; progress: number } | null>;
  updateProcessingJob(jobId: string, status: string, progress: number, error?: string): Promise<void>;
}
