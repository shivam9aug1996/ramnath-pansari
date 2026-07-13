import AsyncStorage from "@react-native-async-storage/async-storage";
import { devLog } from "@/utils/devLog";
import { applyPostCheckoutCartUpdate } from "./applyPostCheckoutCartUpdate";

type CartItem = {
  productId?: unknown;
  productDetails?: { _id?: unknown };
};

/**
 * Removes held SKUs from server cart and local AsyncStorage before fetchCart,
 * so fetchCart does not re-push stale local items when needToSync is true.
 */
export async function removeHeldProductsFromCart({
  dispatch,
  userId,
  heldProductIds,
  currentCartItems,
  bulkUpdateCart,
  fetchCartData,
}: {
  dispatch: (action: unknown) => void;
  userId: string;
  heldProductIds: string[];
  currentCartItems: CartItem[];
  bulkUpdateCart: (args: {
    body: { items: Array<{ productId: string; quantity: number }> };
    params: { userId: string };
  }) => { unwrap: () => Promise<{ failedItems?: unknown[] }> };
  fetchCartData: (
    args: { userId: string },
    preferCache: boolean,
  ) => { unwrap: () => Promise<{ cart?: { items?: unknown[] } }> };
}) {
  const heldIdSet = new Set(heldProductIds.map(String));

  const removePayload = (currentCartItems ?? [])
    .map((item) => {
      const productId = String(item?.productDetails?._id ?? item?.productId ?? "");
      if (!productId) return null;
      return {
        productId,
        quantity: heldIdSet.has(productId) ? 0 : (item as { quantity?: number }).quantity ?? 0,
      };
    })
    .filter(
      (entry): entry is { productId: string; quantity: number } => entry != null,
    );

  if (removePayload.length === 0) {
    removePayload.push(
      ...heldProductIds.map((productId) => ({ productId, quantity: 0 })),
    );
  }

  devLog("[product-lock] removeHeldProducts:bulk-payload", {
    userId,
    removePayload,
  });

  const bulkResult = await bulkUpdateCart({
    body: { items: removePayload },
    params: { userId },
  }).unwrap();

  const localItems = (currentCartItems ?? []).filter(
    (item) =>
      !heldIdSet.has(String(item?.productDetails?._id ?? item?.productId)),
  );

  await AsyncStorage.setItem(`cartData-${userId}`, JSON.stringify(localItems));
  await AsyncStorage.setItem(`cartData-${userId}-needToSync`, "false");

  devLog("[product-lock] removeHeldProducts:local-cleared", {
    userId,
    heldProductIds,
    remainingLocalCount: localItems.length,
  });

  const newCartData = await fetchCartData({ userId }, false).unwrap();

  devLog("[product-lock] removeHeldProducts:server-cart", {
    userId,
    itemCount: newCartData?.cart?.items?.length ?? 0,
    productIds: (newCartData?.cart?.items ?? []).map((item: any) =>
      String(item?.productDetails?._id ?? item?.productId),
    ),
  });

  await applyPostCheckoutCartUpdate(dispatch, userId, newCartData, null);

  return { bulkResult, newCartData };
}
