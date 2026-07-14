import { useEffect, useRef, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  cartApi,
  setCartItemQuantity,
} from "@/redux/features/cartSlice";
import {
  hapticFeedback,
  hideAllToast,
  showToast,
} from "@/utils/utils";
import { RootState, Product } from "@/types/global";
import { router } from "expo-router";
import store from "@/redux/store";
import CartDebounceManager from "./CartDebounceManager";
import { offerApi } from "@/redux/features/offerSlice";
import { applyOptimisticOffersToCart } from "@/utils/applyOptimisticOffers";
import { computeOrderDiscountFromOffers } from "@/utils/cartOfferUtils";
import { getPaidCartSubtotal } from "@/utils/deliveryFee";

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
  text2:
    "You have reached the maximum limit allowed for purchase of this item.",
};

function isCartBusy(state: any) {
  return (
    !!state?.cart?.isCartOperationProcessing || !!state?.cart?.isClearCartLoading
  );
}

function resolveQuantity(state: any, productId: string, fallback: number) {
  const stored = state?.cart?.cartItemQuantity?.[productId];
  return stored !== undefined ? stored : fallback;
}

function patchCartItems(items: any[], product: Product, newQuantity: number) {
  const next = items.slice();
  const index = next.findIndex(
    (i) => i.productDetails?._id === product._id && !i.isPromoFreebie,
  );

  if (newQuantity === 0) {
    if (index !== -1) next.splice(index, 1);
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

export const useCartOperations = (item: Product, initialValue: number) => {
  const productId = item._id;
  const dispatch = useDispatch();
  const buttonClicked = useRef(false);
  const itemRef = useRef(item);
  const initialValueRef = useRef(initialValue);

  itemRef.current = item;
  initialValueRef.current = initialValue;

  const storedQuantity = useSelector(
    (state: RootState) => (state.cart as any).cartItemQuantity?.[productId],
  );

  const quantity = storedQuantity ?? initialValue ?? 0;

  // Redux is the source of truth once a quantity is stored (taps / fetchCart).
  // Never copy initialValue back into Redux — list + detail each mount this hook
  // with their own refs, and a stale parent value was resetting optimistic qty.
  useEffect(() => {
    if (!buttonClicked.current) return;
    if (storedQuantity === initialValue) {
      buttonClicked.current = false;
    }
  }, [initialValue, storedQuantity]);

  const updateCartItems = useCallback(
    (newQuantity: number) => {
      const product = itemRef.current;
      const userId = (store.getState() as any).auth?.userData?._id;
      if (!userId || !product?._id) return;

      dispatch(
        setCartItemQuantity({ productId: product._id, quantity: newQuantity }),
      );

      let itemsForStorage: any[] = [];

      dispatch(
        cartApi.util.updateQueryData("fetchCart", { userId }, (draft: any) => {
          const currentItems = draft.cart?.items ?? [];
          const patched = patchCartItems(currentItems, product, newQuantity);

          const offers =
            offerApi.endpoints.fetchOffers.select()(
              store.getState() as never,
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

      CartDebounceManager.getInstance().updateCart(itemsForStorage, userId);
    },
    [dispatch],
  );

  const handleAdd = useCallback(() => {
    const state = store.getState() as any;
    if (isCartBusy(state)) {
      showToast(BUSY_TOAST);
      return;
    }
    if (state.auth?.userData?.isGuestUser) {
      showToast(GUEST_TOAST);
      return;
    }

    hapticFeedback();

    const current = resolveQuantity(
      state,
      productId,
      initialValueRef.current ?? 0,
    );
    const maxQuantity = itemRef.current?.maxQuantity ?? 5;

    if (current >= maxQuantity) {
      showToast(MAX_QTY_TOAST);
      return;
    }

    buttonClicked.current = true;
    updateCartItems(current + 1);
  }, [productId, updateCartItems]);

  const handleRemove = useCallback(() => {
    const state = store.getState() as any;
    if (isCartBusy(state)) {
      showToast(BUSY_TOAST);
      return;
    }

    hapticFeedback();

    const current = resolveQuantity(
      state,
      productId,
      initialValueRef.current ?? 0,
    );
    if (current <= 0) return;

    buttonClicked.current = true;
    updateCartItems(current - 1);
  }, [productId, updateCartItems]);

  const handleClearAll = useCallback(() => {
    hapticFeedback();

    const current = resolveQuantity(
      store.getState() as any,
      productId,
      initialValueRef.current ?? 0,
    );
    if (current <= 0) return;

    buttonClicked.current = true;
    updateCartItems(0);
  }, [productId, updateCartItems]);

  return {
    quantity,
    handleAdd,
    handleRemove,
    handleClearAll,
    buttonClicked,
  };
};
