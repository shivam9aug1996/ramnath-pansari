// utils/CartDebounceManager.ts
import { debounce } from "lodash";
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";

class CartDebounceManager {
  private static instance: CartDebounceManager;
  private debouncedUpdate: (cartData: any, userId: string) => void;

  private constructor() {
    this.debouncedUpdate = debounce(
      async (cartData: any, userId: string) => {
        try {
          console.log("cartData345678765434567890", cartData.length);
          // await SecureStore.setItemAsync(
          //   `cartData-${userId}`,
          //   JSON.stringify(cartData)
          // );
          // await SecureStore.setItemAsync(`cartData-${userId}-needToSync`, "true");
          await AsyncStorage.setItem(`cartData-${userId}`, JSON.stringify(cartData));
          await AsyncStorage.setItem(`cartData-${userId}-needToSync`, "true");
        } catch (error) {
          console.error("Error updating cart in SecureStore:", error);
        }
      },
      1000,
      
    );
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
}

export default CartDebounceManager;
