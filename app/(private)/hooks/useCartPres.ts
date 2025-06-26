import { useState, useEffect, useRef, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  cartApi,
  removeCartButtonProductId,
  setCartButtonProductId,
  setCartItemQuantity,
  setIsCartOperationProcessing,
  setNeedToSyncWithBackend,
  useLazyFetchCartQuery,
  useSyncCartMutation,
  useUpdateCartMutation,
} from "@/redux/features/cartSlice";
import * as SecureStore from "expo-secure-store";

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
import { ItemTaskQueue } from "@/utils/ItemTaskQueueManager";
import { router } from "expo-router";
import store from "@/redux/store";

export const useCartOperations = (item: Product, initialValue: number) => {
  const dispatch = useDispatch();

  const buttonClicked = useRef(false);
  const userInfo = useSelector((state: RootState) => state.auth.userData);
  const userId = userInfo?._id;
  const isGuestUser = userInfo?.isGuestUser;
  const [syncCart, { isLoading: isSyncCartLoading }] = useSyncCartMutation();

  const [updateCart, { isError: isUpdateCartError }] = useUpdateCartMutation();
  const [fetchCartData] = useLazyFetchCartQuery();

  //const [quantity, setQuantity] = useState<number>(() => initialValue);
  const quantity = useSelector(
    (state: RootState) => state?.cart?.cartItemQuantity[item._id]
  );
  //console.log("oi7rfghjkl", initialValue);
  // useEffect(() => {
  //   dispatch(setCartItemQuantity({productId:item._id,quantity:initialValue}));
  // }, [initialValue]);

  useEffect(() => {
    const hasQueue = ItemTaskQueue.hasPendingTasks(item._id);

    if (!hasQueue) {
      dispatch(
        setCartItemQuantity({ productId: item._id, quantity: initialValue })
      );
    } else {
      console.log(
        `Skipping setCartItemQuantity — already has queue for ${item._id} ${initialValue}`
      );
    }
  }, [initialValue, item._id]);

  // useEffect(() => {
  //   const onQueueFinished = (finishedItemId: string) => {
  //     if (finishedItemId === item._id) {
  //       // ✅ Queue for this item has finished
  //       console.log("Queue for this item has finished", finishedItemId);
  //      // dispatch(setCartItemQuantity({ productId: item._id, quantity: initialValue }));
  //       dispatch(setIsCartOperationProcessing(false))
  //     }
  //   };

  //   ItemTaskQueue.onQueueEmpty(onQueueFinished);
  //   return () => {
  //     ItemTaskQueue.removeQueueEmptyListener(onQueueFinished);
  //   };
  // }, [item._id]);

  const cartUpdate = useCallback(
    async (quantity: number, value: number, item: Product) => {
      try {
        await new Promise((resolve) => setTimeout(resolve, 1500));
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
        // console.log("newCartData", JSON.stringify(newCartData));
        let dataIndex = newCartData?.cart?.items?.findIndex((it) => {
          //  console.log("iuytfghj8888kjhg", it);
          return it?.productDetails?._id === item?._id;
        });
        let data = newCartData?.cart?.items?.find((it) => {
          // console.log("iuytfghj8888kjhg", it);
          return it?.productDetails?._id === item?._id;
        });

        // console.log("iuytrdcvbnm,", dataIndex, item,data);

        if (dataIndex !== -1) {
          let isChange = findProductChanges(item, data?.productDetails);
          // console.log("isCh67890-ange", isChange);
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

        // dispatch(removeCartButtonProductId(item._id));
        // console.log("hiuytre34567890");
      } catch (error) {
        // ItemTaskQueue.setLastTaskStatus(item._id, "error");
        // const status = ItemTaskQueue.getLastTaskStatus(item._id);
        console.log("hgfdsdfghjkl", status);
        console.log("error", error);
        if (error?.status == 467) {
          showToast({
            type: "info",
            text2: "Unable to update. Please try again",
          });

          dispatch(
            setCartItemQuantity({ productId: item._id, quantity: value })
          ); // Revert to the original value on failure
          dispatch(removeCartButtonProductId(item._id));
          throw new Error("test");

          // console.log(`Failed after ${3} attempts`, error);
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
            dispatch(
              setCartItemQuantity({ productId: item._id, quantity: value })
            ); // Revert to the original value on failure
            dispatch(removeCartButtonProductId(item._id));
            hideAllToast();
            throw new Error("test");
            // dispatch(setIsCartOperationProcessing(false))
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
            dispatch(
              setCartItemQuantity({ productId: item._id, quantity: value })
            ); // Revert to the original value on failure
            dispatch(removeCartButtonProductId(item._id));
            hideAllToast();
            throw new Error("test");
            // dispatch(setIsCartOperationProcessing(false))
          }
        } else {
          dispatch(
            setCartItemQuantity({ productId: item._id, quantity: value })
          ); // Revert to the original value on failure
          dispatch(removeCartButtonProductId(item._id));
          // dispatch(setIsCartOperationProcessing(false))
        }
      } finally {
        buttonClicked.current = false;

        //dispatch(setIsCartOperationProcessing(false))
      }
    },
    [userId]
  );

  // function waitUntilQueueEmpty(itemId: string): Promise<void> {
  //   return new Promise((resolve) => {
  //     const handler = (id: string) => {
  //       if (id === itemId) {
  //         ItemTaskQueue.removeQueueEmptyListener(handler);
  //         resolve();
  //       }
  //     };
  //     ItemTaskQueue.onQueueEmpty(handler);
  //   });
  // }

  //console.log("iuytrdfghjkl;", selectedSubCategory);
  const handlePress = useCallback(
    async (quantity: number, value: number, item: Product) => {
      //console.log("o8765redfghjkl", quantity, value, item);
      // console.log("hiiiiuyfghjklghjkl", quantity, value, item);
      if (item?.discountedPrice == 0) {
        showToast({
          type: "info",
          text2: "This free gift cannot be modified or removed.",
        });
        //  console.log("hiiiiuyfghjklghjkl", quantity, value);
        dispatch(setCartItemQuantity({ productId: item._id, quantity: value }));
        dispatch(setIsCartOperationProcessing(false));
        buttonClicked.current = false;
        return;
      }
      // if (value == quantity) {
      //   dispatch(setIsCartOperationProcessing(false));
      //   buttonClicked.current = false;
      //   return;
      // }
      if (value == 5 && quantity > 5) {
        quantity = 5;
        dispatch(
          setCartItemQuantity({ productId: item._id, quantity: quantity })
        );
        showToast({
          type: "info",
          text2:
            "You have reached the maximum limit allowed for purchase of this item.",
        });
        dispatch(setIsCartOperationProcessing(false));
        buttonClicked.current = false;
        return;
      }
      if (quantity > 5) {
        quantity = 5;
        dispatch(
          setCartItemQuantity({ productId: item._id, quantity: quantity })
        );
        showToast({
          type: "info",
          text2:
            "You have reached the maximum limit allowed for purchase of this item.",
        });
        dispatch(setIsCartOperationProcessing(false));
      }

      // console.log("o8765redfghjkl", quantity, initialValue);
      dispatch(setCartButtonProductId(item._id));
      ItemTaskQueue.addTask(item._id, async () => {
        console.log("⏳ Start", item._id, quantity);
        await cartUpdate(quantity, value, item);
        console.log("✅ Done", item._id, quantity);
      });
      // await waitUntilQueueEmpty(item._id);
      // console.log("🎉 Final task completed, queue is empty");
      // dispatch(
      //   setCartItemQuantity({ productId: item._id, quantity: quantity })
      // );
      // dispatch(setIsCartOperationProcessing(false));

      // ItemTaskQueue.runAfterQueueEmpty(item._id, () => {
      //   console.log("🎉 Final task completed, queue is empty");
      //   dispatch(setIsCartOperationProcessing(false));
      // });

      ItemTaskQueue.runAfterQueueEmpty(item._id, async () => {
        const status = ItemTaskQueue.getLastTaskStatus(item._id);
        console.log(
          "🎉 All tasks for item completed:",
          item._id,
          "Status:",
          status,
          quantity
        );
        dispatch(setIsCartOperationProcessing(false));
        dispatch(removeCartButtonProductId(item._id));
        dispatch(
          setCartItemQuantity({ productId: item._id, quantity: quantity })
        );
        if (status == "error") {
          await fetchCartData({ userId }, false).unwrap();
          dispatch(removeCartButtonProductId(item._id));
          dispatch(
            setCartItemQuantity({ productId: item._id, quantity: value })
          );
          dispatch(setIsCartOperationProcessing(false));
        }
      });
    },
    [dispatch, updateCart, fetchCartData, userId]
  );

  const debouncePress = useCallback(debounce(handlePress, 1000, false), [
    handlePress,
  ]);

const newHandlePress = useCallback(async(newQuantity:number,initialValue:number,updatedCart:any) => {
  console.log("newHandlePress",newQuantity,initialValue,updatedCart)
},[])

  const newDebouncePress = useCallback(debounce(newHandlePress, 5000, false), [
    newHandlePress,
  ]);

  const handleAdd = useCallback(async() => {
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
    // dispatch(setIsCartOperationProcessing(true));
    hapticFeedback();
    if (quantity < 5) {
      buttonClicked.current = true;
      const newQuantity = quantity + 1;
      dispatch(setNeedToSyncWithBackend(true));
      dispatch(
        setCartItemQuantity({ productId: item._id, quantity: newQuantity })
      );
      dispatch(
        cartApi.util.updateQueryData("fetchCart", { userId }, (draft) => {
          const items = draft.cart.items || [];

          const index = items.findIndex(
            (i) => i.productDetails?._id === item._id
          );

          if (newQuantity === 0) {
            // ❌ Remove item
            if (index !== -1) {
              items.splice(index, 1);
            }
          } else if (index !== -1) {
            // ✅ Update quantity
            items[index].quantity = newQuantity;
          } else {
            // 🆕 Add new item
            items.push({
              _id: `temp-${Date.now()}`,
              productId: item._id,
              quantity: newQuantity,
              productDetails: item,
            });
          }
        })
      );
      dispatch(
        cartApi.util.updateQueryData("fetchCart", { userId }, (draft) => {
          const items = draft.cart.items || [];

          const totalAmount = calculateTotalAmount(items);
          console.log("totalAmount", totalAmount);
          if (totalAmount >= 1000) {
            console.log("totalAmount>=1000", totalAmount);
            //i need to add free item
            const freeItem = {
              _id: `676da9f75763ded56d43032d`,
              productId: "676da9f75763ded56d43032d",
              quantity: 1,
              productDetails: {
                _id: "676da9f75763ded56d43032d",
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
            const freeItemId = "676da9f75763ded56d43032d";

            const alreadyExists = items.some(
              (i) => i.productDetails?._id === freeItemId
            );

            if (totalAmount >= 1000 && !alreadyExists) {
              items.splice(0, 0, freeItem); // 🆕 Add free item at the top
            }
          }
        })
      );
      
      // let updatedCart = store.getState().cartApi.queries[
      //   `fetchCart({"userId":"${userId}"})`
      // ]?.data;
      // updatedCart = updatedCart?.cart?.items;
      // console.log("updatedCart",JSON.stringify(updatedCart))
      // if (updatedCart) {
      //   console.log("87654wasdfghjkl",`cartData-${userId}`,updatedCart)
      //  // newDebouncePress(newQuantity,initialValue,updatedCart)
      //  await SecureStore.setItemAsync(`cartData-${userId}`, JSON.stringify(updatedCart))
      // }
     // console.log("updatedCart",JSON.stringify(updatedCart?.cart?.items))
      //debouncePress(newQuantity, initialValue, item);
    } else {
      showToast({
        type: "info",
        text2:
          "You have reached the maximum limit allowed for purchase of this item.",
      });
      dispatch(setIsCartOperationProcessing(false));
    }
  }, [quantity, initialValue, item]);

  const handleRemove = useCallback(() => {
    //dispatch(setIsCartOperationProcessing(true));
    hapticFeedback();

    buttonClicked.current = true;
    if (quantity > 0) {
      const newQuantity = quantity - 1;
      dispatch(setNeedToSyncWithBackend(true));
      dispatch(
        setCartItemQuantity({ productId: item._id, quantity: newQuantity })
      );
      dispatch(
        cartApi.util.updateQueryData("fetchCart", { userId }, (draft) => {
          const items = draft.cart.items || [];

          const index = items.findIndex(
            (i) => i.productDetails?._id === item._id
          );

          if (newQuantity === 0) {
            // ❌ Remove item
            if (index !== -1) {
              items.splice(index, 1);
            }
          } else if (index !== -1) {
            // ✅ Update quantity
            items[index].quantity = newQuantity;
          } else {
            // 🆕 Add new item
            items.push({
              _id: `temp-${Date.now()}`,
              productId: item._id,
              quantity: newQuantity,
              productDetails: item,
            });
          }
        })
      );

      dispatch(
        cartApi.util.updateQueryData("fetchCart", { userId }, (draft) => {
          const items = draft.cart.items || [];

          const totalAmount = calculateTotalAmount(items);
          console.log("totalAmount", totalAmount);
          if (totalAmount < 1000) {
            console.log("totalAmount>=1000", totalAmount);
           
            const freeItemId = "676da9f75763ded56d43032d";

            const alreadyExists = items.some(
              (i) => i.productDetails?._id === freeItemId
            );

            if (totalAmount < 1000 && alreadyExists) {
              const freeItemIndex = items.findIndex(
                (i) => i.productDetails?._id === freeItemId
              );
              if (freeItemIndex !== -1) {
                items.splice(freeItemIndex, 1);
              }
            }
          }
        })
      );

      // let updatedCart = store.getState().cartApi.queries[
      //   `fetchCart({"userId":"${userId}"})`
      // ]?.data;
      // updatedCart = updatedCart?.cart?.items;
      // if (updatedCart) {
      //   newDebouncePress(newQuantity,initialValue,updatedCart)
      // }
      //debouncePress(newQuantity, initialValue, item);
    }
  }, [quantity, initialValue, item]);

  const handleClearAll = useCallback(() => {
    // dispatch(setIsCartOperationProcessing(true));
    hapticFeedback();

    buttonClicked.current = true;
    if (quantity > 0) {
      dispatch(setCartItemQuantity({ productId: item._id, quantity: 0 }));

      // handlePress(0, initialValue, item);
      //debouncePress(0, initialValue, item);
    }
  }, [quantity, initialValue, item, handlePress]);

  return {
    quantity,
    handleAdd,
    handleRemove,
    buttonClicked,
    handleClearAll,
  };
};
