import { useState, useEffect, useRef, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  removeCartButtonProductId,
  setCartButtonProductId,
  setIsCartOperationProcessing,
  useLazyFetchCartQuery,
  useSyncCartMutation,
  useUpdateCartMutation,
} from "@/redux/features/cartSlice";
import {
  debounce,
  hapticFeedback,
  hideAllToast,
  showToast,
} from "@/utils/utils";
import { RootState, Product } from "@/types/global";
import {
  productApi,
  setResetPagination,
  useLazyFetchProductDetailQuery,
  useLazyFetchProductsQuery,
} from "@/redux/features/productSlice";
import {
  calculateTotalAmount,
  findCartChanges,
  findProductChanges,
} from "@/components/cart/utils";

export const useCartOperationsV1 = (item: Product, initialValue: number) => {
  const dispatch = useDispatch();
  const userId = useSelector((state: RootState) => state.auth.userData?._id);
  const [syncCart] = useSyncCartMutation();
  const [updateCart] = useUpdateCartMutation();
  const [fetchCartData] = useLazyFetchCartQuery();
  const [fetchProductDetail] = useLazyFetchProductDetailQuery();
  
  const [quantity, setQuantity] = useState<number>(initialValue);
  const queueRef = useRef(Promise.resolve());
  const pendingOperations = useRef(0);
  const cartButtonProductId = useSelector(
    (state: RootState) => state.cart.cartButtonProductId || []
  );

  const isLoading = cartButtonProductId.includes(item?._id);

  // Sync quantity when initialValue changes and no operations are pending
  useEffect(() => {
    if (pendingOperations.current === 0) {
      setQuantity(initialValue);
    }
  }, [initialValue]);

  const handlePress = useCallback(async (newQuantity: number, initialValue: number, item: Product) => {
    if (item?.discountedPrice == 0) {
      showToast({
        type: "info",
        text2: "This free gift cannot be modified or removed.",
      });
      setQuantity(initialValue);
      dispatch(setIsCartOperationProcessing(false));
      return;
    }

    if (newQuantity === initialValue) {
      dispatch(setIsCartOperationProcessing(false));
      return;
    }

    if (newQuantity > 5) {
      setQuantity(5);
      showToast({
        type: "info",
        text2: "You have reached the maximum limit allowed for purchase of this item.",
      });
      dispatch(setIsCartOperationProcessing(false));
      return;
    }

    dispatch(setCartButtonProductId(item._id));

    try {
      await updateCart({
        body: {
          quantity: newQuantity,
          productDetails: {
            name: item.name,
            image: item.image,
          },
          productId: item._id,
        },
        params: { userId },
      }).unwrap();

      const newCartData = await fetchCartData({ userId }, false).unwrap();
      const cartItem = newCartData?.cart?.items?.find(
        (it) => it?.productDetails?._id === item?._id
      );

      if (cartItem) {
        const isChange = findProductChanges(item, cartItem?.productDetails);
        if (isChange) {
          dispatch(setResetPagination({ item: item, status: true }));
          showToast({
            type: "info",
            text2: "Product details are changed. Please review before checkout.",
          });
        }
      }
    } catch (error) {
      if(pendingOperations.current !== 0){
        return
      }
      // Handle different error cases
      if (error?.status === 467) {
        showToast({
          type: "info",
          text2: "Unable to update. Please try again",
        });
      } else if ([468, 404].includes(error?.status)) {
        showToast({
          type: "info",
          text2: error?.status === 468 
            ? "This item is no longer available." 
            : "Product not found",
        });
        
        try {
          await syncCart({
            body: {},
            params: { userId: userId },
          })?.unwrap();
          
          await fetchCartData({ userId }, false).unwrap();
          dispatch(setResetPagination({ item: item, status: true }));
          dispatch(
            productApi.endpoints.fetchProductDetail.initiate(
              { productId: item._id },
              { subscribe: false, forceRefetch: true }
            )
          );
        } catch (syncError) {
          console.error("Sync error:", syncError);
        }
      }
      
      // Revert to the original value on failure
      setQuantity(initialValue);
      throw error; // Re-throw to allow queue to handle it
    } finally {
      dispatch(removeCartButtonProductId(item._id));
      dispatch(setIsCartOperationProcessing(false));
      pendingOperations.current--;
    }
  }, [dispatch, updateCart, fetchCartData, userId, syncCart]);

  const enqueueOperation = useCallback(
    async (operation: () => Promise<void>) => {
      pendingOperations.current++;
      try {
        await queueRef.current;
        queueRef.current = operation().catch(() => {});
        await queueRef.current;
      } catch (error) {
        console.error("Operation failed:", error);
      }
    },
    []
  );

  const handleAdd = useCallback(() => {
    if (quantity >= 5) {
      showToast({
        type: "info",
        text2: "You have reached the maximum limit allowed for purchase of this item.",
      });
      return;
    }

    hapticFeedback();
    dispatch(setIsCartOperationProcessing(true));
    
    const newQuantity = quantity + 1;
    setQuantity(newQuantity);
    
    enqueueOperation(() => handlePress(newQuantity, quantity, item));
  }, [quantity, item, handlePress, enqueueOperation]);

  const handleRemove = useCallback(() => {
    if (quantity <= 0) return;

    hapticFeedback();
    dispatch(setIsCartOperationProcessing(true));
    
    const newQuantity = quantity - 1;
    setQuantity(newQuantity);
    
    enqueueOperation(() => handlePress(newQuantity, quantity, item));
  }, [quantity, item, handlePress, enqueueOperation]);

  const handleClearAll = useCallback(() => {
    if (quantity <= 0) return;

    hapticFeedback();
    dispatch(setIsCartOperationProcessing(true));
    
    setQuantity(0);
    enqueueOperation(() => handlePress(0, quantity, item));
  }, [quantity, item, handlePress, enqueueOperation]);

  return {
    quantity,
    handleAdd,
    handleRemove,
    handleClearAll,
    isLoading,
  };
};