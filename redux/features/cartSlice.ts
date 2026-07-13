import { getPaidCartPayload } from "@/utils/cartOfferUtils";
import { devLog } from "@/utils/devLog";
import { getPayableTotalFromItems } from "@/utils/deliveryFee";
import { createSlice } from "@reduxjs/toolkit";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { baseUrl } from "../constants";
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from "@react-native-async-storage/async-storage";

function rebuildCartItemQuantities(
  items: Array<{
    productId?: unknown;
    quantity?: number;
    productDetails?: { _id?: string };
  }>,
) {
  const next: Record<string, number> = {};
  for (const item of items) {
    const productId = item.productDetails?._id ?? item.productId;
    if (productId == null) continue;
    next[String(productId)] = item.quantity ?? 0;
  }
  return next;
}

export const cartApi = createApi({
  reducerPath: "cartApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${baseUrl}`,
    prepareHeaders: (headers, api) => {
      const token = api?.getState()?.auth?.token;
      if (token) {
        //console.log("kiop");
        headers.set("authorization", `Bearer ${token}`);
      }
      return headers;
    },
    credentials: "include",
  }),
  tagTypes: ["cartList"],

  endpoints: (builder) => ({
    fetchCart: builder.query({
      queryFn: async (data, api, extraOptions, baseQuery) => {
        const userId = api?.getState()?.auth?.userData?._id;
        const isGuestUser = api?.getState()?.auth?.userData?.isGuestUser;
        if(isGuestUser){
          return {
            data: {
              cart: {
                items: [],
              },
            },
          };
        }
        // const cartData = await SecureStore.getItemAsync(`cartData-${userId}`);
        // const needToSync = await SecureStore.getItemAsync(`cartData-${userId}-needToSync`);
        const cartData = await AsyncStorage.getItem(`cartData-${userId}`);
        const needToSync = await AsyncStorage.getItem(`cartData-${userId}-needToSync`);

        if(cartData && needToSync=="true"){
          const parsedCartData = JSON.parse(cartData);
          let payload = parsedCartData?.map((item: any) => {
            return {
              productId: item?.productDetails?._id,
              quantity: item?.quantity,
            };
          });
          payload = getPaidCartPayload(parsedCartData);
          devLog("payload4567890", payload);
          const data1 = {
            params: {
              userId,
            },
            body: {
              items: payload,
            },
          }
          const response = await baseQuery({
            url: "/cart/bulk",
            method: "PUT",
            params: data1?.params,
            body: data1?.body,
          })
          const response1 = await baseQuery({
            url: "/cart",
            method: "GET",
            params: data,
          })
          //await SecureStore.setItemAsync(`cartData-${userId}-needToSync`, "false")
          await AsyncStorage.setItem(`cartData-${userId}-needToSync`, "false")
          return response1;

        }else{
          const response = await baseQuery({
            url: "/cart",
            method: "GET",
            params: data,
          })
          return response;  
        }
        
        
      },
      // query: (data) => ({
      //   url: "/cart",
      //   method: "GET",
      //   params: data,
      // }),
      // transformResponse: (response) => {
      //   console.log("gfghjkl", JSON.stringify(response));
      //   if (response && Array.isArray(response?.cart?.items)) {
      //     // Filter out items that are out of stock
      //     const filteredItems = response?.cart?.items?.filter(
      //       (item) => !item.productDetails?.isOutOfStock
      //     );
      //     // ?.sort((a, b) => {
      //     //   if (a.productDetails?.discountedPrice === 0) return 1;
      //     //   if (b.productDetails?.discountedPrice === 0) return -1;
      //     //   return 0;
      //     // })

      //     // console.log(
      //     //   "Filtered and Reversed Response:",
      //     //   JSON.stringify(filteredItems)
      //     // );

      //     return {
      //       ...response,
      //       cart: {
      //         ...response.cart,
      //         items: filteredItems,
      //       },
      //     };
      //   }

      //   console.error("Invalid response format:", response);
      //   return response; // Return as is if items is not an array or response is invalid
      // },
      providesTags: ["cartList"],
    }),

    updateCart: builder.mutation({
      query: (data) => ({
        url: "/cart",
        method: "PUT",
        params: data?.params,
        body: data?.body,
      }),
      // invalidatesTags: ["cartList"],
    }),
    clearCart: builder.mutation({
      query: (data) => ({
        url: "/cart/clear",
        method: "PUT",
        params: data?.params,
        body: data?.body,
      }),
      //invalidatesTags: ["cartList"],
    }),
    syncCart: builder.mutation({
      query: (data) => ({
        url: "/cart/sync",
        method: "PATCH",
        params: data?.params,
      }),
      // invalidatesTags: ["cartList"],
    }),
    bulkUpdateCart: builder.query({
      query: (data) => ({
        url: "/cart/bulk",
        method: "PUT",
        params: data?.params,
        body: data?.body,
      }),
    }),
    updateProductsAsPerCart: builder.query({
      query: (data) => ({
        url: "/cart/updateProductsAsPerCart",
        method: "PUT",
        params: data?.params,
        body: data?.body,
      }),
    }),
    releaseCheckoutHolds: builder.mutation({
      query: (data) => ({
        url: "/cart/releaseCheckoutHolds",
        method: "POST",
        params: data?.params,
        body: data?.body,
      }),
    }),
    fetchGreetingMessage: builder.query({
      query: (data) => ({
        url: "/generateGreeting",
        method: "POST",
        body: data?.body,
      }),
    }),
  }),
});

const cartSlice = createSlice({
  name: "cartSlice",
  initialState: {
    cartButtonProductId: [],
    cartState: [],
    cartFetching: false,
    totalAmount: "0",
    totalAmountInNumber: 0,
    orderSuccessView: false,
    localCart: [],
    showConfetti: false,
    isCartOperationProcessing: false,
    isClearCartLoading: false,
    isVisibleGoToCartWrapper: true,
    cartItemQuantity: {},
    cartQueueCount: {},
    needToSyncWithBackend: {
      status: false,
      count: 0,
    },
  },
  reducers: {
    setCartButtonProductId: (state, action) => {
      if (action?.payload) {
        state.cartButtonProductId.push(action?.payload);
      }
    },
    setOrderSuccessView: (state, action) => {
      state.orderSuccessView = action?.payload;
    },
    removeCartButtonProductId: (state, action) => {
      if (action?.payload) {
        state.cartButtonProductId = state.cartButtonProductId.filter(
          (id) => id !== action.payload
        );
      }
    },
    updateLocalCart: (state, action) => {
      state.localCart.unshift(action?.payload);
    },
    setShowConfetti: (state, action) => {
      state.showConfetti = action?.payload;
    },
    setIsCartOperationProcessing: (state, action) => {
      state.isCartOperationProcessing = action?.payload;
    },
    setIsClearCartLoading: (state, action) => {
      state.isClearCartLoading = action?.payload;
    },
    setIsVisibleGoToCartWrapper: (state, action) => {
      state.isVisibleGoToCartWrapper = action?.payload;
    },
    setCartItemQuantity: (state, action) => {
      state.cartItemQuantity = {
        ...state.cartItemQuantity,
        [action?.payload?.productId]: action?.payload?.quantity,
      };
    },
    incrementCartQueueCount: (state, action) => {
      //console.log("5456786567890456789-",action?.payload?.productId,state.cartQueueCount[action?.payload?.productId])
      state.cartQueueCount = {
        ...state.cartQueueCount,
        [action?.payload?.productId]: state.cartQueueCount[
          action?.payload?.productId
        ]
          ? state.cartQueueCount[action?.payload?.productId] + 1
          : 1,
      };
    },
    decrementCartQueueCount: (state, action) => {
      state.cartQueueCount = {
        ...state.cartQueueCount,
        [action?.payload?.productId]: state.cartQueueCount[
          action?.payload?.productId
        ]
          ? Math.max(state.cartQueueCount[action?.payload?.productId] - 1, 0)
          : 0,
      };
    },
    setNeedToSyncWithBackend: (state, action) => {
      state.needToSyncWithBackend = {
        ...state.needToSyncWithBackend,
        count: state.needToSyncWithBackend.count + 1,
        status: action?.payload?.status,
      };
    },
    setCartPayableTotals: (state, action) => {
      const total = action.payload.total;
      state.totalAmountInNumber = total;
      state.totalAmount = `₹${total.toFixed(2)}`;
    },
  },
  extraReducers: (builder) => {
    builder.addMatcher(
      cartApi.endpoints.fetchCart.matchPending,
      (state, action) => {
        state.cartFetching = true;
      }
    );
    builder.addMatcher(
      cartApi.endpoints.fetchCart.matchFulfilled,
      (state, action) => {
        state.cartFetching = false;
        const items = action?.payload?.cart?.items ?? [];
        const payableTotal = getPayableTotalFromItems(items);
        state.totalAmount = `₹${payableTotal.toFixed(2)}`;
        state.totalAmountInNumber = parseFloat(
          Math.max(
            0,
            payableTotal - (action?.payload?.orderDiscount ?? 0),
          ).toFixed(2),
        );
        state.cartItemQuantity = rebuildCartItemQuantities(items);
        devLog("[cart-sync] cartItemQuantity:rebuilt from fetchCart", {
          itemCount: items.length,
          quantities: state.cartItemQuantity,
        });
      }
    );
    builder.addMatcher(
      cartApi.endpoints.fetchCart.matchRejected,
      (state, action) => {
        state.cartFetching = false;
      }
    );
    builder.addMatcher(
      cartApi.endpoints.updateCart.matchPending,
      (state, action) => {
        const { arg } = action.meta;
        //console.log("tresdfghjk", arg);
        if (arg && arg?.originalArgs.body) {
          const productId = arg.originalArgs.body.productId;
          // console.log("uytfdfghjk", productId);
          const cartItem = state.cartState.find(
            (item) => item?._id === productId
          );
          if (cartItem) {
            cartItem.isCartLoading = true;
          } else {
            state.cartState.push({ _id: productId, isCartLoading: true });
          }
        }
      }
    );
    builder.addMatcher(
      cartApi.endpoints.updateCart.matchFulfilled,
      (state, action) => {
        const { arg } = action.meta;
        //console.log("tresdfghjk", arg);
        if (arg && arg?.originalArgs.body) {
          const productId = arg.originalArgs.body.productId;
          // console.log("uytfdfghjk", productId);
          const cartItem = state.cartState.find(
            (item) => item?._id === productId
          );
          if (cartItem) {
            cartItem.isCartLoading = false;
          }
        }
      }
    );
    builder.addMatcher(
      cartApi.endpoints.updateCart.matchRejected,
      (state, action) => {
        const { arg } = action.meta;
        //console.log("tresdfghjk", arg);
        if (arg && arg?.originalArgs.body) {
          const productId = arg.originalArgs.body.productId;
          // console.log("uytfdfghjk", productId);
          const cartItem = state.cartState.find(
            (item) => item?._id === productId
          );
          if (cartItem) {
            cartItem.isCartLoading = false;
          }
        }
      }
    );
    builder.addMatcher(
      cartApi.endpoints.clearCart.matchFulfilled,
      (state) => {
        state.cartItemQuantity = {};
        devLog("[cart-sync] cartItemQuantity:cleared on clearCart");
      }
    );
  },
});

export const {
  setCartButtonProductId,
  removeCartButtonProductId,
  setOrderSuccessView,
  setShowConfetti,
  setIsCartOperationProcessing,
  setIsClearCartLoading,
  setIsVisibleGoToCartWrapper,
  setCartItemQuantity,
  incrementCartQueueCount,
  decrementCartQueueCount,
  setNeedToSyncWithBackend,
  setCartPayableTotals,
} = cartSlice.actions;

export const {
  useFetchCartQuery,
  useUpdateCartMutation,
  useLazyFetchCartQuery,
  useClearCartMutation,
  useSyncCartMutation,
  useLazyFetchGreetingMessageQuery,
  useLazyBulkUpdateCartQuery,
  useLazyUpdateProductsAsPerCartQuery,
  useReleaseCheckoutHoldsMutation,
} = cartApi;

export default cartSlice.reducer;
