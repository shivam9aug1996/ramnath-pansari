// // utils/ItemTaskQueueManager.ts

// type Task = () => Promise<void>;
// type OnQueueEmptyCallback = (itemId: string) => void;

// class PerItemQueueManager {
//   private queues: Map<string, Task[]> = new Map();
//   private processing: Map<string, boolean> = new Map();
//   private onQueueEmptyListeners: Set<OnQueueEmptyCallback> = new Set();


//   public addTask(itemId: string, task: Task) {
//     if (!this.queues.has(itemId)) {
//       this.queues.set(itemId, []);
//     }

//     const queue = this.queues.get(itemId)!;
//     queue.push(task);

//     // Only start if not already processing
//     if (!this.processing.get(itemId)) {
//       this.processQueue(itemId);
//     }
//   }
//   public runAfterQueueEmpty(itemId: string, callback: () => void) {
//     // Run immediately if empty
//     if (this.isQueueEmpty(itemId)) {
//       callback();
//       return;
//     }

//     // Replace previous callback with latest one
//     this.onQueueEmptyListener.set(itemId, callback);
//   }
//   public isQueueEmpty(itemId: string): boolean {
//     const queue = this.queues.get(itemId);
//     const isProcessing = this.processing.get(itemId);
//     return (!queue || queue.length === 0) && !isProcessing;
//   }

//   public hasPendingTasks(itemId: string): boolean {
//     const queue = this.queues.get(itemId);
//     const isProcessing = this.processing.get(itemId);
//     return (queue && queue.length > 0) || !!isProcessing;
//   }

//   public onQueueEmpty(cb: OnQueueEmptyCallback) {
//     this.onQueueEmptyListeners.add(cb);
//   }

//   public removeQueueEmptyListener(cb: OnQueueEmptyCallback) {
//     this.onQueueEmptyListeners.delete(cb);
//   }

//   private async processQueue(itemId: string) {
//     const queue = this.queues.get(itemId);
//     if (!queue || queue.length === 0) return;

//     this.processing.set(itemId, true);

//     while (queue.length > 0) {
//       const task = queue.shift();
//       if (task) {
//         try {
//           await task(); // wait before starting next
//         } catch (err) {
//           console.error(`Error in task for ${itemId}:`, err);
//         }
//       }
//     }

//     this.processing.set(itemId, false);
//     this.onQueueEmptyListeners.forEach(cb => cb(itemId));

//   }
// }

// export const ItemTaskQueue = new PerItemQueueManager();




type Task = () => Promise<void>;

class PerItemQueueManager {
  private queues: Map<string, Task[]> = new Map();
  private processing: Map<string, boolean> = new Map();
  private lastTaskStatus: Map<string, "success" | "error" | null> = new Map();
  private globalEmptyCallbacks: Set<() => void> = new Set();

  // ✅ This replaces Set<OnQueueEmptyCallback>
  private onQueueEmptyListener: Map<string, () => void> = new Map();


  public onAllQueuesEmpty(cb: () => void) {
    this.globalEmptyCallbacks.add(cb);
  }

  public removeOnAllQueuesEmpty(cb: () => void) {
    this.globalEmptyCallbacks.delete(cb);
  }

  private checkIfAllQueuesEmpty() {
    const allEmpty = Array.from(this.processing.values()).every((val) => !val) &&
      Array.from(this.queues.values()).every((q) => q.length === 0);

    if (allEmpty) {
      for (const cb of this.globalEmptyCallbacks) {
        cb();
      }
    }
  }

  public isIdle(): boolean {
    return Array.from(this.processing.values()).every((val) => !val) &&
           Array.from(this.queues.values()).every((q) => q.length === 0);
  }

  public addTask(itemId: string, task: Task) {
    if (!this.queues.has(itemId)) {
      this.queues.set(itemId, []);
    }

    const queue = this.queues.get(itemId)!;
    queue.push(task);

    // Only start if not already processing
    if (!this.processing.get(itemId)) {
      this.processQueue(itemId);
    }
  }

  public runAfterQueueEmpty(itemId: string, callback: () => void) {
    // Run immediately if queue is already empty
    if (this.isQueueEmpty(itemId)) {
      callback();
      return;
    }

    // ✅ Store the latest callback (replace old one)
    this.onQueueEmptyListener.set(itemId, callback);
  }

  public isQueueEmpty(itemId: string): boolean {
    const queue = this.queues.get(itemId);
    const isProcessing = this.processing.get(itemId);
    return (!queue || queue.length === 0) && !isProcessing;
  }

  public hasPendingTasks(itemId: string): boolean {
    const queue = this.queues.get(itemId);
    const isProcessing = this.processing.get(itemId);
    return (queue && queue.length > 0) || !!isProcessing;
  }

  public getLastTaskStatus(itemId: string): "success" | "error" | null | undefined {
    return this.lastTaskStatus.get(itemId);
  }
  public setLastTaskStatus(itemId: string, status: "success" | "error") {
    this.lastTaskStatus.set(itemId, status);
  }

  private async processQueue(itemId: string) {
    const queue = this.queues.get(itemId);
    if (!queue || queue.length === 0) return;

    this.processing.set(itemId, true);

    while (queue.length > 0) {
      const task = queue.shift();
      if (task) {
        try {
          await task(); // wait before starting next
          console.log("🎉 Task completed successfully for:", itemId);
          this.lastTaskStatus.set(itemId, "success");
        } catch (err) {
          console.error(`Error in task for ${itemId}:`, err);
          this.lastTaskStatus.set(itemId, "error");
          
        }
      }
    }

    this.processing.set(itemId, false);

    // ✅ Run the latest callback (if any) and clean it up
    const cb = this.onQueueEmptyListener.get(itemId);
    if (cb) {
      this.onQueueEmptyListener.delete(itemId);
      cb();
    }
    this.checkIfAllQueuesEmpty();
  }
}

export const ItemTaskQueue = new PerItemQueueManager();
