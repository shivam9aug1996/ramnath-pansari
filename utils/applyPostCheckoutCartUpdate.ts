import AsyncStorage from "@react-native-async-storage/async-storage";
import { cartApi } from "@/redux/features/cartSlice";
import store from "@/redux/store";
import {
  patchSyncedProductsInCache,
  SyncedProductResult,
} from "./patchSyncedProductsInCache";

type CartResponse = {
  cart?: {
    items?: unknown[];
  };
};

export async function applyPostCheckoutCartUpdate(
  dispatch: typeof store.dispatch,
  userId: string,
  newCartData: CartResponse | undefined,
  syncedProducts?: SyncedProductResult[] | null,
) {
  if (newCartData) {
    dispatch(cartApi.util.upsertQueryData("fetchCart", { userId }, newCartData));
    await AsyncStorage.setItem(
      `cartData-${userId}`,
      JSON.stringify(newCartData.cart?.items ?? []),
    );
    await AsyncStorage.setItem(`cartData-${userId}-needToSync`, "false");
  }

  await patchSyncedProductsInCache(dispatch, syncedProducts ?? []);
}
