import { ScanProcessingJobPayload } from '@roomtrace/types';

export interface QueuedScan {
  id: string;
  roomId: string;
  createdAt: string;
  payload: ScanProcessingJobPayload;
  syncAttempts: number;
  lastError?: string;
}

export class OfflineScanQueue {
  private queue: QueuedScan[] = [];
  private isSyncing = false;
  private apiBaseUrl: string;

  constructor(apiBaseUrl: string = 'http://localhost:4000/api/v1') {
    this.apiBaseUrl = apiBaseUrl;
  }

  enqueue(roomId: string, payload: ScanProcessingJobPayload): QueuedScan {
    const item: QueuedScan = {
      id: `offline-scan-${Date.now()}`,
      roomId,
      createdAt: new Date().toISOString(),
      payload,
      syncAttempts: 0,
    };
    this.queue.push(item);
    return item;
  }

  getPendingScans(): QueuedScan[] {
    return [...this.queue];
  }

  async syncPending(onProgress?: (synced: number, total: number) => void): Promise<{ success: number; failed: number }> {
    if (this.isSyncing || this.queue.length === 0) {
      return { success: 0, failed: 0 };
    }

    this.isSyncing = true;
    let successCount = 0;
    let failedCount = 0;
    const total = this.queue.length;

    const remaining: QueuedScan[] = [];

    for (const scan of this.queue) {
      try {
        scan.syncAttempts++;
        const res = await fetch(`${this.apiBaseUrl}/rooms/${scan.roomId}/scans`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(scan.payload),
        });

        if (res.ok) {
          successCount++;
        } else {
          scan.lastError = `HTTP ${res.status}: ${await res.text()}`;
          remaining.push(scan);
          failedCount++;
        }
      } catch (err: any) {
        scan.lastError = err.message || 'Network unreachable';
        remaining.push(scan);
        failedCount++;
      }

      if (onProgress) {
        onProgress(successCount + failedCount, total);
      }
    }

    this.queue = remaining;
    this.isSyncing = false;
    return { success: successCount, failed: failedCount };
  }
}
