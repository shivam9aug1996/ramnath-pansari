import { calculateTotalAmount } from "@/components/cart/utils";
import { createSlice } from "@reduxjs/toolkit";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { baseUrl } from "../constants";

export const cartApi = createApi({
  reducerPath: "cartApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${baseUrl}`,
    prepareHeaders: (headers, api) => {
      const token = api?.getState()?.auth?.token;
      if (token) {
        console.log("kiop");
        headers.set("authorization", `Bearer ${token}`);
      }
      return headers;
    },
    credentials: "include",
  }),
  tagTypes: ["cartList"],

  endpoints: (builder) => ({
    fetchCart: builder.query({
      query: (data) => ({
        url: "/cart",
        method: "GET",
        params: data,
      }),
      transformResponse: (response) => {
        console.log("gfghjkl", JSON.stringify(response));
        if (response && Array.isArray(response?.cart?.items)) {
          // Filter out items that are out of stock
          const filteredItems = response?.cart?.items
            ?.filter((item) => !item.productDetails?.isOutOfStock)
            ?.sort((a, b) => {
              if (a.productDetails?.discountedPrice === 0) return 1;
              if (b.productDetails?.discountedPrice === 0) return -1;
              return 0;
            });

          console.log(
            "Filtered and Reversed Response:",
            JSON.stringify(filteredItems)
          );

          return {
            ...response,
            cart: {
              ...response.cart,
              items: filteredItems.reverse(),
            },
          };
        }

        console.error("Invalid response format:", response);
        return response; // Return as is if items is not an array or response is invalid
      },
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
        state.totalAmount = `₹${calculateTotalAmount(
          action?.payload?.cart?.items
        )?.toFixed(2)}`;
        state.totalAmountInNumber = calculateTotalAmount(
          action?.payload?.cart?.items
        )?.toFixed(2);
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
        console.log("tresdfghjk", arg);
        if (arg && arg?.originalArgs.body) {
          const productId = arg.originalArgs.body.productId;
          console.log("uytfdfghjk", productId);
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
        console.log("tresdfghjk", arg);
        if (arg && arg?.originalArgs.body) {
          const productId = arg.originalArgs.body.productId;
          console.log("uytfdfghjk", productId);
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
        console.log("tresdfghjk", arg);
        if (arg && arg?.originalArgs.body) {
          const productId = arg.originalArgs.body.productId;
          console.log("uytfdfghjk", productId);
          const cartItem = state.cartState.find(
            (item) => item?._id === productId
          );
          if (cartItem) {
            cartItem.isCartLoading = false;
          }
        }
      }
    );
  },
});

export const {
  setCartButtonProductId,
  removeCartButtonProductId,
  setOrderSuccessView,
  setShowConfetti,
} = cartSlice.actions;

export const {
  useFetchCartQuery,
  useUpdateCartMutation,
  useLazyFetchCartQuery,
  useClearCartMutation,
  useSyncCartMutation,
} = cartApi;

export default cartSlice.reducer;
