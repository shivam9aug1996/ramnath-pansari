import { useRef, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { router } from "expo-router";

import store from "@/redux/store";
import { cartApi, setCartItemQuantity } from "@/redux/features/cartSlice";
import { offerApi } from "@/redux/features/offerSlice";

import { RootState, Product } from "@/types/global";
import { hapticFeedback, hideAllToast, showToast } from "@/utils/utils";
import { applyOptimisticOffersToCart } from "@/utils/applyOptimisticOffers";
import { computeOrderDiscountFromOffers } from "@/utils/cartOfferUtils";
import { getPaidCartSubtotal } from "@/utils/deliveryFee";
import CartDebounceManager from "./CartDebounceManager";

// --- Toast Constants ---

const BUSY_TOAST = {
  type: "info" as const,
  text2: "Please wait a moment — we're still updating your cart.",
};

const GUEST_TOAST = {
  type: "info" as const,
  text2: "🛍️ Tap here to log in and start filling your cart!",
  onPress() {
    router.push("/login");
    hideAllToast();
  },
};

const MAX_QTY_TOAST = {
  type: "info" as const,
  text2: "You have reached the maximum limit allowed for purchase of this item.",
};

// --- Helpers ---

function isCartBusy(state: RootState): boolean {
  return (
    Boolean((state as any)?.cart?.isCartOperationProcessing) ||
    Boolean((state as any)?.cart?.isClearCartLoading)
  );
}

function resolveQuantity(state: RootState, productId: string, fallback: number): number {
  const stored = (state as any)?.cart?.cartItemQuantity?.[productId];
  return stored !== undefined ? stored : fallback;
}

/**
 * Mutates or patches cart items array safely for draft updates.
 */
function patchCartItems(items: any[], product: Product, newQuantity: number): any[] {
  const next = [...items];
  const index = next.findIndex(
    (i) => i.productDetails?._id === product._id && !i.isPromoFreebie,
  );

  if (newQuantity === 0) {
    if (index !== -1) {
      next.splice(index, 1);
    }
    return next;
  }

  if (index !== -1) {
    next[index] = { ...next[index], quantity: newQuantity };
    return next;
  }

  next.push({
    _id: `temp-${product._id}`,
    productId: product._id,
    quantity: newQuantity,
    productDetails: product,
  });

  return next;
}

// --- Main Hook ---

export const useCartOperations = (item: Product, initialValue: number) => {
  const productId = item?._id;
  const dispatch = useDispatch();

  const itemRef = useRef(item);
  const initialValueRef = useRef(initialValue);

  itemRef.current = item;
  initialValueRef.current = initialValue;

  const storedQuantity = useSelector(
    (state: RootState) => (state.cart as any)?.cartItemQuantity?.[productId],
  );

  const quantity = storedQuantity ?? initialValue ?? 0;

  const updateCartItems = useCallback(
    (newQuantity: number) => {
      const product = itemRef.current;
      const currentState = store.getState() as RootState;
      const userId = (currentState as any)?.auth?.userData?._id;

      if (!userId || !product?._id) return;

      // Update Redux state immediately for local optimistic UI
      dispatch(
        setCartItemQuantity({ productId: product._id, quantity: newQuantity }),
      );

      let itemsForStorage: any[] = [];

      // Update RTK Query Cache Optimistically
      dispatch(
        cartApi.util.updateQueryData("fetchCart", { userId }, (draft: any) => {
          if (!draft?.cart) return;

          const currentItems = draft.cart.items ?? [];
          const patched = patchCartItems(currentItems, product, newQuantity);

          const offers =
            offerApi.endpoints.fetchOffers.select()(
              currentState as never,
            )?.data?.offers ?? [];

          const withOffers = applyOptimisticOffersToCart(patched, offers);

          draft.cart.items = withOffers;
          draft.orderDiscount = computeOrderDiscountFromOffers(
            getPaidCartSubtotal(patched),
            offers,
          );

          itemsForStorage = withOffers;
        }) as any,
      );

      // Debounce persistence call to backend
      CartDebounceManager.getInstance().updateCart(itemsForStorage, userId);
    },
    [dispatch],
  );

  const handleAdd = useCallback(() => {
    const currentState = store.getState() as RootState;

    if (isCartBusy(currentState)) {
      showToast(BUSY_TOAST);
      return;
    }

    if ((currentState as any)?.auth?.userData?.isGuestUser) {
      showToast(GUEST_TOAST);
      return;
    }

    hapticFeedback();

    const current = resolveQuantity(
      currentState,
      productId,
      initialValueRef.current ?? 0,
    );
    const maxQuantity = itemRef.current?.maxQuantity ?? 5;

    if (current >= maxQuantity) {
      showToast(MAX_QTY_TOAST);
      return;
    }

    updateCartItems(current + 1);
  }, [productId, updateCartItems]);

  const handleRemove = useCallback(() => {
    const currentState = store.getState() as RootState;

    if (isCartBusy(currentState)) {
      showToast(BUSY_TOAST);
      return;
    }

    hapticFeedback();

    const current = resolveQuantity(
      currentState,
      productId,
      initialValueRef.current ?? 0,
    );

    if (current <= 0) return;

    updateCartItems(current - 1);
  }, [productId, updateCartItems]);

  const handleClearAll = useCallback(() => {
    const currentState = store.getState() as RootState;

    hapticFeedback();

    const current = resolveQuantity(
      currentState,
      productId,
      initialValueRef.current ?? 0,
    );

    if (current <= 0) return;

    updateCartItems(0);
  }, [productId, updateCartItems]);

  return {
    quantity,
    handleAdd,
    handleRemove,
    handleClearAll,
  };
};