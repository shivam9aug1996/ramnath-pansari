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
        if (response && Array.isArray(response?.cart?.items)) {
          console.log("Reversed Response:", JSON.stringify(response));
          return {
            ...response,
            items: response?.cart?.items?.reverse(),
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
      invalidatesTags: ["cartList"],
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
  },
  reducers: {
    setCartButtonProductId: (state, action) => {
      if (action?.payload) {
        state.cartButtonProductId.push(action?.payload);
      }
    },
    removeCartButtonProductId: (state, action) => {
      if (action?.payload) {
        state.cartButtonProductId = state.cartButtonProductId.filter(
          (id) => id !== action.payload
        );
      }
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

export const { setCartButtonProductId, removeCartButtonProductId } =
  cartSlice.actions;

export const {
  useFetchCartQuery,
  useUpdateCartMutation,
  useLazyFetchCartQuery,
  useClearCartMutation,
} = cartApi;

export default cartSlice.reducer;
