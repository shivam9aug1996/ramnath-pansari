import AsyncStorage from "@react-native-async-storage/async-storage";
import { cartApi } from "@/redux/features/cartSlice";
import store from "@/redux/store";
import {
  patchSyncedProductsInCache,
  SyncedProductResult,
} from "./patchSyncedProductsInCache";
import { devLog } from "@/utils/devLog";

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
  devLog("[cart-sync] applyPostCheckoutCartUpdate:start", {
    userId,
    cartItemCount: newCartData?.cart?.items?.length ?? 0,
    syncResultCount: syncedProducts?.length ?? 0,
  });

  if (newCartData) {
    dispatch(cartApi.util.upsertQueryData("fetchCart", { userId }, newCartData));
    await AsyncStorage.setItem(
      `cartData-${userId}`,
      JSON.stringify(newCartData.cart?.items ?? []),
    );
    await AsyncStorage.setItem(`cartData-${userId}-needToSync`, "false");

    devLog("[cart-sync] applyPostCheckoutCartUpdate:cart cache updated", {
      items: (newCartData.cart?.items ?? []).map((item: any) => ({
        productId: item?.productDetails?._id ?? item?.productId,
        quantity: item?.quantity,
        maxQuantity: item?.productDetails?.maxQuantity ?? null,
        discountedPrice: item?.productDetails?.discountedPrice ?? null,
        isOutOfStock: item?.productDetails?.isOutOfStock ?? null,
      })),
    });
  }

  await patchSyncedProductsInCache(dispatch, syncedProducts ?? []);

  devLog("[cart-sync] applyPostCheckoutCartUpdate:done");
}
