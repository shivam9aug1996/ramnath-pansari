import { debounce } from "lodash";
import { devError, devLog, devWarn } from "@/utils/devLog";
import AsyncStorage from "@react-native-async-storage/async-storage";

class CartDebounceManager {
  private static instance: CartDebounceManager;
  private debouncedUpdate: (cartData: any, userId: string) => void;

  private constructor() {
    this.debouncedUpdate = debounce(async (cartData: any, userId: string) => {
      try {
        await AsyncStorage.setItem(
          `cartData-${userId}`,
          JSON.stringify(cartData),
        );
        await AsyncStorage.setItem(`cartData-${userId}-needToSync`, "true");
      } catch (error) {
        devError("Error updating cart in AsyncStorage:", error);
      }
    }, 1000);
  }

  public static getInstance(): CartDebounceManager {
    if (!CartDebounceManager.instance) {
      CartDebounceManager.instance = new CartDebounceManager();
    }
    return CartDebounceManager.instance;
  }

  public updateCart(cartData: any, userId: string) {
    this.debouncedUpdate(cartData, userId);
  }

  public cancelPendingUpdate() {
    this.debouncedUpdate.cancel();
  }
}

export default CartDebounceManager;
