import { useState, useEffect, useRef, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  removeCartButtonProductId,
  setCartButtonProductId,
  useLazyFetchCartQuery,
  useUpdateCartMutation,
} from "@/redux/features/cartSlice";
import { debounce, hapticFeedback } from "@/utils/utils";
import { RootState, Product } from "@/types/global";

export const useCartOperations = (item: Product, initialValue: number) => {
  const dispatch = useDispatch();
  const buttonClicked = useRef(false);
  const userId = useSelector((state: RootState) => state.auth.userData?._id);

  const [updateCart, { isError: isUpdateCartError }] = useUpdateCartMutation();
  const [fetchCartData] = useLazyFetchCartQuery();

  const [quantity, setQuantity] = useState<number>(() => initialValue);
  console.log("oi7rfghjkl", initialValue);
  useEffect(() => {
    setQuantity(initialValue);
  }, [initialValue]);

  // const isLoading = cartButtonProductId.includes(item?._id);

  const handlePress = useCallback(
    async (quantity: number, value: number, item: Product) => {
      console.log("hiiiiuyfghjklghjkl");
      if (value == quantity) {
        return;
      }
      let attempts = 0;
      console.log("o8765redfghjkl", quantity, initialValue);
      dispatch(setCartButtonProductId(item._id));
      while (attempts < 3) {
        try {
          await updateCart({
            body: {
              quantity: quantity,
              productDetails: {
                name: item.name,
                image: item.image,
              },
              productId: item._id,
            },
            params: { userId },
          }).unwrap();

          await fetchCartData({ userId }, false).unwrap();

          dispatch(removeCartButtonProductId(item._id));
          console.log("hiuytre34567890");
          break;
        } catch (error) {
          console.log("hiuytre3467890567890", attempts);
          attempts += 1;
          if (attempts === 3) {
            setQuantity(value); // Revert to the original value on failure
            dispatch(removeCartButtonProductId(item._id));
            console.error(`Failed after ${3} attempts`, error);
          }
        }
      }
    },
    [dispatch, updateCart, fetchCartData, userId]
  );

  const debouncePress = useCallback(debounce(handlePress, 1000, false), [
    handlePress,
  ]);

  const handleAdd = () => {
    hapticFeedback();
    buttonClicked.current = true;
    const newQuantity = quantity + 1;
    setQuantity(newQuantity);
    debouncePress(newQuantity, initialValue, item);
  };

  const handleRemove = () => {
    hapticFeedback();

    buttonClicked.current = true;
    if (quantity > 0) {
      const newQuantity = quantity - 1;
      setQuantity(newQuantity);
      debouncePress(newQuantity, initialValue, item);
    }
  };

  const handleClearAll = () => {
    hapticFeedback();

    buttonClicked.current = true;
    if (quantity > 0) {
      setQuantity(0);
      debouncePress(0, initialValue, item);
    }
  };

  return {
    quantity,
    handleAdd,
    handleRemove,
    buttonClicked,
    handleClearAll,
  };
};
