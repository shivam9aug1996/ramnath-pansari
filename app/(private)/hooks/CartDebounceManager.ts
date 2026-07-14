import AsyncStorage from "@react-native-async-storage/async-storage";
import { devError } from "@/utils/devLog";

const DEBOUNCE_MS = 1000;

type PendingWrite = {
  userId: string;
  cartData: unknown;
};

/**
 * Singleton that coalesces cart persistence into one trailing AsyncStorage write.
 * Rapid quantity taps replace `pending` instead of queuing N JSON serializations.
 */
class CartDebounceManager {
  private static instance: CartDebounceManager;

  private timer: ReturnType<typeof setTimeout> | null = null;
  private pending: PendingWrite | null = null;
  private writing = false;
  private lastSerializedByUser = new Map<string, string>();

  public static getInstance(): CartDebounceManager {
    if (!CartDebounceManager.instance) {
      CartDebounceManager.instance = new CartDebounceManager();
    }
    return CartDebounceManager.instance;
  }

  public updateCart(cartData: unknown, userId: string | undefined | null) {
    if (!userId) return;

    this.pending = { userId, cartData };

    if (this.timer) {
      clearTimeout(this.timer);
    }

    this.timer = setTimeout(() => {
      this.timer = null;
      void this.flush();
    }, DEBOUNCE_MS);
  }

  /** Drop pending write without persisting (e.g. logout / clear cart). */
  public cancelPendingUpdate() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this.pending = null;
  }

  /** Clear memoized payloads when local cart is replaced outside this manager. */
  public invalidateCache(userId?: string | null) {
    if (userId) {
      this.lastSerializedByUser.delete(userId);
      return;
    }
    this.lastSerializedByUser.clear();
  }

  /** Persist immediately — call before checkout or app background. */
  public flush(): Promise<void> {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    return this.persistPending();
  }

  public hasPendingUpdate(): boolean {
    return this.pending != null || this.timer != null || this.writing;
  }

  private async persistPending(): Promise<void> {
    if (this.writing) return;
    if (!this.pending) return;

    this.writing = true;

    try {
      // Drain: if updateCart runs mid-write, loop until latest pending is stored.
      while (this.pending) {
        const { userId, cartData } = this.pending;
        this.pending = null;

        let serialized: string;
        try {
          serialized = JSON.stringify(cartData);
        } catch (error) {
          devError("Error serializing cart for AsyncStorage:", error);
          continue;
        }

        // Bounce back to last flushed cart within the debounce window — no-op.
        if (this.lastSerializedByUser.get(userId) === serialized) {
          continue;
        }

        try {
          await AsyncStorage.multiSet([
            [`cartData-${userId}`, serialized],
            [`cartData-${userId}-needToSync`, "true"],
          ]);
          this.lastSerializedByUser.set(userId, serialized);
        } catch (error) {
          devError("Error updating cart in AsyncStorage:", error);
          // Re-queue so a later flush can retry the latest payload.
          if (!this.pending) {
            this.pending = { userId, cartData };
          }
          break;
        }
      }
    } finally {
      this.writing = false;
      // A write arrived after the loop finished but before writing cleared.
      if (this.pending && !this.timer) {
        void this.persistPending();
      }
    }
  }
}

export default CartDebounceManager;
