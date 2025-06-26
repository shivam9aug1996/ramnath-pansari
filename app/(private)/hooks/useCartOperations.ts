import { useEffect, useRef, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  cartApi,
  setCartItemQuantity,
  setIsCartOperationProcessing,
  setNeedToSyncWithBackend,
} from "@/redux/features/cartSlice";

import {
  hapticFeedback,
  hideAllToast,
  showToast,
} from "@/utils/utils";
import { RootState, Product } from "@/types/global";
import { calculateTotalAmount } from "@/components/cart/utils";
import { router } from "expo-router";


const FREE_ITEM_ID = "676da9f75763ded56d43032d";
const FREE_ITEM = {
  _id: FREE_ITEM_ID,
  productId: FREE_ITEM_ID,
  quantity: 1,
  productDetails: {
    _id: FREE_ITEM_ID,
    name: "UTTAM SUGAR Sulphurfree Sugar (Refined Safed Cheeni)",
    categoryPath: [
      "66a2495650d9ec140942917c",
      "676da1e1e48e180ad5a91181",
      "676da298e48e180ad5a91182",
    ],
    image:
      "https://rukminim2.flixcart.com/image/832/832/xif0q/sugar/i/a/q/-original-imagtxubkgmbwpa6.jpeg?q=70",
    discountedPrice: 0,
    price: 65,
    size: "1 kg",
    category: "Sugar",
    lastUpdated: "2025-05-24T19:48:11.668Z",
  },
};

export const useCartOperations = (item: Product, initialValue: number) => {
  const isCartOperationProcessing = useSelector((state: RootState) => state?.cart?.isCartOperationProcessing);
  const dispatch = useDispatch();
  const buttonClicked = useRef(false);
  const userInfo = useSelector((state: RootState) => state.auth.userData);
  const userId = userInfo?._id;
  const isGuestUser = userInfo?.isGuestUser;

  const quantity = useSelector(
    (state: RootState) => state.cart.cartItemQuantity[item._id]
  );

  useEffect(() => {
    dispatch(
      setCartItemQuantity({ productId: item._id, quantity: initialValue })
    );
  }, [dispatch, item._id, initialValue]);

  const updateCartItems = useCallback(
    async(newQuantity: number) => {
      dispatch(setNeedToSyncWithBackend({status:true}));  
      
      dispatch(setCartItemQuantity({ productId: item._id, quantity: newQuantity }));

      dispatch(
        cartApi.util.updateQueryData("fetchCart", { userId }, (draft) => {
          const items = draft.cart.items || [];
          const index = items.findIndex(i => i.productDetails?._id === item._id);

          if (newQuantity === 0 && index !== -1) {
            items.splice(index, 1); // ❌ Remove item
          } else if (index !== -1) {
            items[index].quantity = newQuantity; // ✅ Update
          } else if (newQuantity > 0) {
            items.push({
              _id: `temp-${Date.now()}`,
              productId: item._id,
              quantity: newQuantity,
              productDetails: item,
            }); // 🆕 Add
          }

          // Handle free item logic
          const totalAmount = calculateTotalAmount(items);
          const hasFreeItem = items.some(i => i.productDetails?._id === FREE_ITEM_ID);

          if (totalAmount >= 1000 && !hasFreeItem) {
            items.unshift(FREE_ITEM); // Add free item at top
          } else if (totalAmount < 1000 && hasFreeItem) {
            const freeItemIndex = items.findIndex(i => i.productDetails?._id === FREE_ITEM_ID);
            if (freeItemIndex !== -1) {
              items.splice(freeItemIndex, 1); // Remove free item
            }
          }
        })
      );

      //  let updatedCart = store.getState().cartApi.queries[
      //   `fetchCart({"userId":"${userId}"})`
      // ]?.data;

      // updatedCart = updatedCart?.cart?.items;

      // if (updatedCart) {
      //  await SecureStore.setItemAsync(`cartData-${userId}`, JSON.stringify(updatedCart))
      //  await SecureStore.setItemAsync(`cartData-${userId}-needToSync`, JSON.stringify(true))
      // }
    },
    [dispatch, item, userId]
  );

  const handleAdd = useCallback(() => {
    if(isCartOperationProcessing){
      showToast({
        type: "info",
        text2: "Please wait a moment — we’re still updating your cart.",
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
    if (quantity < 5) {
      buttonClicked.current = true;
      updateCartItems(quantity + 1);
    } else {
      showToast({
        type: "info",
        text2: "You have reached the maximum limit allowed for purchase of this item.",
      });
      
    }
  }, [isGuestUser, quantity, updateCartItems, dispatch,isCartOperationProcessing]);

  const handleRemove = useCallback(() => {
    if(isCartOperationProcessing){
      showToast({
        type: "info",
        text2: "Please wait a moment — we’re still updating your cart.",
      });
      return;
    }
    hapticFeedback();
    if (quantity > 0) {
      buttonClicked.current = true;
      updateCartItems(quantity - 1);
    }
  }, [quantity, updateCartItems,isCartOperationProcessing]);

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
