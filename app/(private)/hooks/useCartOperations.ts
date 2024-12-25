import { useState, useEffect, useRef, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  removeCartButtonProductId,
  setCartButtonProductId,
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
  useLazyFetchProductsQuery,
} from "@/redux/features/productSlice";
import { findCartChanges, findProductChanges } from "@/components/cart/utils";

export const useCartOperations = (item: Product, initialValue: number) => {
  const dispatch = useDispatch();
  const selectedSubCategory = useSelector(
    (state: RootState) => state.product.selectedSubCategoryId
  );

  const buttonClicked = useRef(false);
  const userId = useSelector((state: RootState) => state.auth.userData?._id);
  const [syncCart, { isLoading: isSyncCartLoading }] = useSyncCartMutation();

  const [updateCart, { isError: isUpdateCartError }] = useUpdateCartMutation();
  const [fetchCartData] = useLazyFetchCartQuery();
  const [fetchProducts] = useLazyFetchProductsQuery();
  const [quantity, setQuantity] = useState<number>(() => initialValue);
  console.log("oi7rfghjkl", initialValue);
  useEffect(() => {
    setQuantity(initialValue);
  }, [initialValue]);

  // const isLoading = cartButtonProductId.includes(item?._id);
  console.log("iuytrdfghjkl;", selectedSubCategory);
  const handlePress = useCallback(
    async (quantity: number, value: number, item: Product) => {
      console.log("hiiiiuyfghjklghjkl");
      if (value == quantity) {
        return;
      }
      if (value == 5 && quantity > 5) {
        quantity = 5;
        setQuantity(quantity);
        showToast({
          type: "info",
          text2:
            "You have reached the maximum limit allowed for purchase of this item.",
        });
        return;
      }
      if (quantity > 5) {
        quantity = 5;
        setQuantity(quantity);
        showToast({
          type: "info",
          text2:
            "You have reached the maximum limit allowed for purchase of this item.",
        });
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

          let newCartData = await fetchCartData({ userId }, false).unwrap();
          let data = newCartData?.cart?.items?.find((it) => {
            console.log("iuytfghj8888kjhg", it);
            return it?.productDetails?._id === item?._id;
          });
          console.log("iuytrdcvbnm,", data, item);

          if (Object.keys(data)?.length > 1) {
            let isPriceChange = findProductChanges(item, data?.productDetails);
            if (isPriceChange) {
              dispatch(setResetPagination(true));
              showToast({
                type: "info",
                text2:
                  "Price of the product is changed. Please review before checkout.",
              });
            }
          }

          dispatch(removeCartButtonProductId(item._id));
          console.log("hiuytre34567890");
          break;
        } catch (error) {
          console.log("hiuytre3467890567890", attempts);
          if (error?.status == 467) {
            if (attempts === 1) {
              showToast({
                type: "info",
                text2: "Unable to update. Please try again later.",
              });
            }
            attempts += 1;
            if (attempts === 3) {
              setQuantity(value); // Revert to the original value on failure
              dispatch(removeCartButtonProductId(item._id));

              console.log(`Failed after ${3} attempts`, error);
            }
          } else if (error?.status == 468) {
            showToast({
              type: "info",
              text2: "This item is no longer available.",
            });
            try {
              await syncCart({
                body: {},
                params: { userId: userId },
              })?.unwrap();
              await fetchCartData({ userId }, false).unwrap();

              dispatch(setResetPagination(true));
              // await fetchProducts(
              //   {
              //     categoryId: selectedSubCategory?._id,
              //     page: 1,
              //     limit: 10,
              //     reset: true,
              //   },
              //   false
              // )?.unwrap();
              // dispatch(
              //   productApi.endpoints.fetchProducts.initiate(
              //     {
              //       categoryId: selectedSubCategory?._id,
              //       page: 1,
              //       limit: 10,
              //       reset: true,
              //     },
              //     { subscribe: false, forceRefetch: true }
              //   )
              // );
              dispatch(
                productApi.endpoints.fetchProductDetail.initiate(
                  {
                    productId: item._id,
                  },
                  { subscribe: false, forceRefetch: true }
                )
              );
            } catch (error) {
            } finally {
              setQuantity(value); // Revert to the original value on failure
              dispatch(removeCartButtonProductId(item._id));
              hideAllToast();
              break;
            }
          } else {
            setQuantity(value); // Revert to the original value on failure
            dispatch(removeCartButtonProductId(item._id));
            break;
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
