// import { useEffect, useRef, useCallback, startTransition } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import {
//   cartApi,
//   setCartItemQuantity,
//   setIsCartOperationProcessing,
// } from "@/redux/features/cartSlice";

// import {
//   hapticFeedback,
//   hideAllToast,
//   showToast,
// } from "@/utils/utils";
// import { RootState, Product } from "@/types/global";
// import { router } from "expo-router";
// import store from "@/redux/store";
// import CartDebounceManager from "./CartDebounceManager";
// import { offerApi } from "@/redux/features/offerSlice";
// import { applyOptimisticOffersToCart } from "@/utils/applyOptimisticOffers";
// import { computeOrderDiscountFromOffers } from "@/utils/cartOfferUtils";
// import { getPaidCartSubtotal } from "@/utils/deliveryFee";

// const LOG_PREFIX = "[CartButton:flicker]";

// const logCartOps = (event: string, payload?: Record<string, unknown>) => {
//   console.log(LOG_PREFIX, event, payload ?? "");
// };

// export const useCartOperations = (item: Product, initialValue: number) => {
//   const isCartOperationProcessing = useSelector(
//     (state: RootState) => state?.cart?.isCartOperationProcessing,
//   );
//   const isClearCartLoading = useSelector(
//     (state: RootState) => state?.cart?.isClearCartLoading,
//   );
//   const dispatch = useDispatch();
//   const buttonClicked = useRef(false);
//   const userInfo = useSelector((state: RootState) => state.auth.userData);
//   const userId = userInfo?._id;
//   const isGuestUser = userInfo?.isGuestUser;

//   const storedQuantity = useSelector(
//     (state: RootState) => state.cart.cartItemQuantity[item._id],
//   );
//   const quantity = storedQuantity ?? initialValue ?? 0;

//   useEffect(() => {
//     if (storedQuantity !== initialValue) {
//       logCartOps("sync storedQuantity from initialValue", {
//         productId: item._id,
//         storedQuantity,
//         initialValue,
//         resolvedQuantity: initialValue ?? 0,
//       });
//       dispatch(
//         setCartItemQuantity({
//           productId: item._id,
//           quantity: initialValue ?? 0,
//         }),
//       );
//     }
//   }, [dispatch, item._id, initialValue, storedQuantity]);

//   const updateCartItems = useCallback(
//     async (newQuantity: number) => {
//       logCartOps("updateCartItems", {
//         productId: item._id,
//         previousQuantity: quantity,
//         newQuantity,
//         initialValue,
//         storedQuantity,
//       });
//       dispatch(
//         setCartItemQuantity({ productId: item._id, quantity: newQuantity }),
//       );

//       startTransition(() => {
//         dispatch(
//           cartApi.util.updateQueryData("fetchCart", { userId }, (draft) => {
//             let items = [...(draft.cart.items || [])];
//             const index = items.findIndex(
//               (i) =>
//                 i.productDetails?._id === item._id && !i.isPromoFreebie,
//             );

//             if (newQuantity === 0 && index !== -1) {
//               items.splice(index, 1);
//             } else if (index !== -1) {
//               items[index] = { ...items[index], quantity: newQuantity };
//             } else if (newQuantity > 0) {
//               items.push({
//                 _id: `temp-${Date.now()}`,
//                 productId: item._id,
//                 quantity: newQuantity,
//                 productDetails: item,
//               });
//             }

//             const offers =
//               offerApi.endpoints.fetchOffers.select()(
//                 store.getState() as never,
//               )?.data?.offers ?? [];

//             draft.cart.items = applyOptimisticOffersToCart(items, offers);
//             draft.orderDiscount = computeOrderDiscountFromOffers(
//               getPaidCartSubtotal(items),
//               offers,
//             );
//           }),
//         );
//       });

//       startTransition(() => {
//         let updatedCart =
//           store.getState().cartApi.queries[`fetchCart({"userId":"${userId}"})`]
//             ?.data;

//         updatedCart = updatedCart?.cart?.items || [];

//         if (updatedCart?.length >= 0) {
//           CartDebounceManager.getInstance().updateCart(updatedCart, userId);
//         }
//       });
//     },
//     [dispatch, item, userId, quantity, initialValue, storedQuantity],
//   );

//   const handleAdd = useCallback(() => {
//     if (isCartOperationProcessing || isClearCartLoading) {
//       showToast({
//         type: "info",
//         text2: "Please wait a moment — we're still updating your cart.",
//       });
//       return;
//     }
//     if (isGuestUser) {
//       showToast({
//         type: "info",
//         text2: "🛍️ Tap here to log in and start filling your cart!",
//         onPress() {
//           router.push("/login");
//           hideAllToast();
//         },
//       });
//       return;
//     }

//     hapticFeedback();
//     const maxQuantity = item?.maxQuantity ?? 5;
//     if (quantity < maxQuantity) {
//       buttonClicked.current = true;
//       updateCartItems(quantity + 1);
//     } else {
//       showToast({
//         type: "info",
//         text2:
//           "You have reached the maximum limit allowed for purchase of this item.",
//       });
//     }
//   }, [
//     isGuestUser,
//     quantity,
//     item?.maxQuantity,
//     updateCartItems,
//     isCartOperationProcessing,
//     isClearCartLoading,
//   ]);

//   const handleRemove = useCallback(() => {
//     if (isCartOperationProcessing || isClearCartLoading) {
//       showToast({
//         type: "info",
//         text2: "Please wait a moment — we're still updating your cart.",
//       });
//       return;
//     }
//     hapticFeedback();
//     if (quantity > 0) {
//       buttonClicked.current = true;
//       updateCartItems(quantity - 1);
//     }
//   }, [
//     quantity,
//     updateCartItems,
//     isCartOperationProcessing,
//     isClearCartLoading,
//   ]);

//   const handleClearAll = useCallback(() => {
//     hapticFeedback();
//     if (quantity > 0) {
//       buttonClicked.current = true;
//       updateCartItems(0);
//     }
//   }, [quantity, updateCartItems]);

//   return {
//     quantity,
//     handleAdd,
//     handleRemove,
//     handleClearAll,
//     buttonClicked,
//   };
// };





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

export const useCartOperations = (item: Product, initialValue: number) => {
  const isCartOperationProcessing = useSelector(
    (state: RootState) => state?.cart?.isCartOperationProcessing,
  );
  const isClearCartLoading = useSelector(
    (state: RootState) => state?.cart?.isClearCartLoading,
  );
  const dispatch = useDispatch();
  const buttonClicked = useRef(false);
  const userInfo = useSelector((state: RootState) => state.auth.userData);
  const userId = userInfo?._id;
  const isGuestUser = userInfo?.isGuestUser;

  const storedQuantity = useSelector(
    (state: RootState) => state.cart.cartItemQuantity[item._id],
  );
  const quantity = storedQuantity ?? initialValue ?? 0;

  useEffect(() => {
    if (buttonClicked.current) {
      if (storedQuantity === initialValue) {
        buttonClicked.current = false;
      }
      return;
    }

    if (storedQuantity !== initialValue) {
      dispatch(
        setCartItemQuantity({
          productId: item._id,
          quantity: initialValue ?? 0,
        }),
      );
    }
  }, [dispatch, item._id, initialValue, storedQuantity]);

  const updateCartItems = useCallback(
    async (newQuantity: number) => {
      dispatch(
        setCartItemQuantity({ productId: item._id, quantity: newQuantity }),
      );

      dispatch(
        cartApi.util.updateQueryData("fetchCart", { userId }, (draft) => {
          const items = [...(draft.cart.items || [])];
          const index = items.findIndex(
            (i) =>
              i.productDetails?._id === item._id && !i.isPromoFreebie,
          );

          if (newQuantity === 0 && index !== -1) {
            items.splice(index, 1);
          } else if (index !== -1) {
            items[index] = { ...items[index], quantity: newQuantity };
          } else if (newQuantity > 0) {
            items.push({
              _id: `temp-${Date.now()}`,
              productId: item._id,
              quantity: newQuantity,
              productDetails: item,
            });
          }

          const offers =
            offerApi.endpoints.fetchOffers.select()(
              store.getState() as never,
            )?.data?.offers ?? [];

          draft.cart.items = applyOptimisticOffersToCart(items, offers);
          draft.orderDiscount = computeOrderDiscountFromOffers(
            getPaidCartSubtotal(items),
            offers,
          );
        }),
      );

      const updatedCart =
        store.getState().cartApi.queries[`fetchCart({"userId":"${userId}"})`]
          ?.data?.cart?.items ?? [];

      CartDebounceManager.getInstance().updateCart(updatedCart, userId);
    },
    [dispatch, item, userId],
  );

  const handleAdd = useCallback(() => {
    if (isCartOperationProcessing || isClearCartLoading) {
      showToast({
        type: "info",
        text2: "Please wait a moment — we're still updating your cart.",
      });
      return;
    }
    if (isGuestUser) {
      showToast({
        type: "info",
        text2: "🛍️ Tap here to log in and start filling your cart!",
        onPress() {
          router.push("/login");
          hideAllToast();
        },
      });
      return;
    }

    hapticFeedback();
    const maxQuantity = item?.maxQuantity ?? 5;
    if (quantity < maxQuantity) {
      buttonClicked.current = true;
      updateCartItems(quantity + 1);
    } else {
      showToast({
        type: "info",
        text2:
          "You have reached the maximum limit allowed for purchase of this item.",
      });
    }
  }, [
    isGuestUser,
    quantity,
    item?.maxQuantity,
    updateCartItems,
    isCartOperationProcessing,
    isClearCartLoading,
  ]);

  const handleRemove = useCallback(() => {
    if (isCartOperationProcessing || isClearCartLoading) {
      showToast({
        type: "info",
        text2: "Please wait a moment — we're still updating your cart.",
      });
      return;
    }
    hapticFeedback();
    if (quantity > 0) {
      buttonClicked.current = true;
      updateCartItems(quantity - 1);
    }
  }, [
    quantity,
    updateCartItems,
    isCartOperationProcessing,
    isClearCartLoading,
  ]);

  const handleClearAll = useCallback(() => {
    hapticFeedback();
    if (quantity > 0) {
      buttonClicked.current = true;
      updateCartItems(0);
    }
  }, [quantity, updateCartItems]);

  return {
    quantity,
    handleAdd,
    handleRemove,
    handleClearAll,
    buttonClicked,
  };
};