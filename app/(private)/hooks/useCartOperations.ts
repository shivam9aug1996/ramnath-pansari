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

export const useCartOperations = (item: Product, initialValue: number) => {
  const dispatch = useDispatch();

  const buttonClicked = useRef(false);
  const userId = useSelector((state: RootState) => state.auth.userData?._id);
  const [syncCart, { isLoading: isSyncCartLoading }] = useSyncCartMutation();

  const [updateCart, { isError: isUpdateCartError }] = useUpdateCartMutation();
  const [fetchCartData] = useLazyFetchCartQuery();

  const [quantity, setQuantity] = useState<number>(() => initialValue);
  //console.log("oi7rfghjkl", initialValue);
  useEffect(() => {
    setQuantity(initialValue);
  }, [initialValue]);


  //console.log("iuytrdfghjkl;", selectedSubCategory);
  const handlePress = useCallback(
    async (quantity: number, value: number, item: Product) => {
      console.log("hiiiiuyfghjklghjkl", quantity, value, item);
      if (item?.discountedPrice == 0) {
        showToast({
          type: "info",
          text2: "This free gift cannot be modified or removed.",
        });
        console.log("hiiiiuyfghjklghjkl", quantity, value);
        setQuantity(value);
        dispatch(setIsCartOperationProcessing(false))
        buttonClicked.current = false;
        return;
      }
      if (value == quantity) {
        dispatch(setIsCartOperationProcessing(false))
        buttonClicked.current = false;
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
        dispatch(setIsCartOperationProcessing(false))
        buttonClicked.current = false;
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
        dispatch(setIsCartOperationProcessing(false))
      }

      console.log("o8765redfghjkl", quantity, initialValue);
      dispatch(setCartButtonProductId(item._id));

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
        console.log("newCartData", JSON.stringify(newCartData));
        let dataIndex = newCartData?.cart?.items?.findIndex((it) => {
          console.log("iuytfghj8888kjhg", it);
          return it?.productDetails?._id === item?._id;
        });
        let data = newCartData?.cart?.items?.find((it) => {
          console.log("iuytfghj8888kjhg", it);
          return it?.productDetails?._id === item?._id;
        });

        console.log("iuytrdcvbnm,", dataIndex, item,data);

        if (dataIndex !== -1) {
          let isChange = findProductChanges(item, data?.productDetails);
          console.log("isCh67890-ange", isChange);
          if (isChange) {
            dispatch(setResetPagination({ item: item, status: true }));
            showToast({
              type: "info",
              text2:
                "Product details are changed. Please review before checkout.",
            });
          }
        }
        // let totalAmount = calculateTotalAmount(
        //   newCartData?.cart?.items
        // )?.toFixed(2);
        // let isItem = newCartData?.cart?.items?.find((it) => {
        //   console.log("iuytfghj8888kjhg", it);
        //   return it?.productDetails?._id === "676da9f75763ded56d43032d";
        // });
        // console.log("87654edfghjkl;", isItem);
        // const isFreeItemPresent = isItem == undefined ? false : true;
        // console.log("o8765redfbnm,", isFreeItemPresent, totalAmount);
        // if (totalAmount >= 1000 && !isFreeItemPresent) {
        //   let data = await fetchProductDetail(
        //     { productId: "676da9f75763ded56d43032d" },
        //     false
        //   )?.unwrap();
        //   console.log("87trfghjkl", JSON.stringify(data));
        //   await updateCart({
        //     body: {
        //       quantity: 1,
        //       productDetails: {
        //         name: data?.product?.name,
        //         image: data?.product?.image,
        //       },
        //       productId: data?.product?._id,
        //     },
        //     params: { userId },
        //   }).unwrap();
        //   let newCartData = await fetchCartData({ userId }, false).unwrap();
        // }
        // if (totalAmount < 1000 && isFreeItemPresent) {
        //   console.log("987654edfghjkl", isFreeItemPresent, totalAmount);
        //   let data = await fetchProductDetail(
        //     { productId: "676da9f75763ded56d43032d" },
        //     false
        //   )?.unwrap();
        //   console.log("87trfghjkl", JSON.stringify(data));
        //   await updateCart({
        //     body: {
        //       quantity: 0,
        //       productDetails: {
        //         name: data?.product?.name,
        //         image: data?.product?.image,
        //       },
        //       productId: data?.product?._id,
        //     },
        //     params: { userId },
        //   }).unwrap();
        //   let newCartData = await fetchCartData({ userId }, false).unwrap();
        // }

        dispatch(removeCartButtonProductId(item._id));
        console.log("hiuytre34567890");
      } catch (error) {
        if (error?.status == 467) {
          showToast({
            type: "info",
            text2: "Unable to update. Please try again",
          });

          setQuantity(value); // Revert to the original value on failure
          dispatch(removeCartButtonProductId(item._id));

          console.log(`Failed after ${3} attempts`, error);
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

            // dispatch(setResetPagination(true));
            dispatch(setResetPagination({ item: item, status: true }));

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
            dispatch(setIsCartOperationProcessing(false))
          }
        } else if (error?.status == 404) {
          showToast({
            type: "info",
            text2: "Product not found",
          });
          try {
            await syncCart({
              body: {},
              params: { userId: userId },
            })?.unwrap();
            await fetchCartData({ userId }, false).unwrap();

            // dispatch(setResetPagination(true));
            dispatch(setResetPagination({ item: item, status: true }));

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
            dispatch(setIsCartOperationProcessing(false))
          }
        } else {
          setQuantity(value); // Revert to the original value on failure
          dispatch(removeCartButtonProductId(item._id));
          dispatch(setIsCartOperationProcessing(false))
        }
      } finally {
        console.log("handlePress completed.");
        buttonClicked.current = false;
        dispatch(setIsCartOperationProcessing(false))
      }
    },
    [dispatch, updateCart, fetchCartData, userId]
  );

  const debouncePress = useCallback(debounce(handlePress, 1000, false), [
    handlePress,
  ]);

  const handleAdd = useCallback(() => {
    dispatch(setIsCartOperationProcessing(true))
    hapticFeedback();
    if (quantity < 5) {
      buttonClicked.current = true;
      const newQuantity = quantity + 1;
      setQuantity(newQuantity);
      debouncePress(newQuantity, initialValue, item);
    } else {
      showToast({
        type: "info",
        text2:
          "You have reached the maximum limit allowed for purchase of this item.",
      });
      dispatch(setIsCartOperationProcessing(false))
    }
  },[quantity, initialValue, item,debouncePress]);

  const handleRemove = useCallback(() => {
    dispatch(setIsCartOperationProcessing(true))
    hapticFeedback();

    buttonClicked.current = true;
    if (quantity > 0) {
      const newQuantity = quantity - 1;
      setQuantity(newQuantity);
      debouncePress(newQuantity, initialValue, item);
    }
  },[quantity, initialValue, item,debouncePress]);

  const handleClearAll = useCallback(() => {
    dispatch(setIsCartOperationProcessing(true))
    hapticFeedback();

    buttonClicked.current = true;
    if (quantity > 0) {
      setQuantity(0);
      handlePress(0, initialValue, item);
      //debouncePress(0, initialValue, item);
    }
  },[quantity, initialValue, item,handlePress]);

  return {
    quantity,
    handleAdd,
    handleRemove,
    buttonClicked,
    handleClearAll,
  };
};




