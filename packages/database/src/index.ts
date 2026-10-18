import { IDatabaseRepository } from './repository.interface';
import { MemoryDatabaseRepository } from './memory-store';

export * from './repository.interface';
export * from './memory-store';

let globalRepo: IDatabaseRepository | null = null;

export function getDatabase(): IDatabaseRepository {
  if (!globalRepo) {
    globalRepo = new MemoryDatabaseRepository();
  }
  return globalRepo;
}
