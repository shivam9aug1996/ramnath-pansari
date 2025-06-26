// utils/CartQueueManager.ts

type Task = () => Promise<void>;

export class CartQueueManager {
  private queue: Task[] = [];
  private processing = false;

  public addTask(task: Task) {
    console.log("ad567890-dTask-",task);
    this.queue.push(task);
    this.processQueue();
  }

  private async processQueue() {
    console.log("processQueue-",this.queue,this.processing);
    if (this.processing || this.queue.length === 0) return;

    this.processing = true;

    const nextTask = this.queue.shift();
    if (nextTask) {
      try {
        await nextTask();
      } catch (e) {
        console.error("Cart task failed:", e);
      }
    }

    this.processing = false;

    if (this.queue.length > 0) {
      this.processQueue();
    }
  }

  public isQueueProcessing(): boolean {
    return this.processing;
  }

  public clearQueue() {
    this.queue = [];
  }

  public getQueueLength() {
    return this.queue.length;
  }
}

// ✅ Singleton instance
export const cartQueueManager = new CartQueueManager();
