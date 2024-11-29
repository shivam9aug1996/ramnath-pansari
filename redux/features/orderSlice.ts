import { createSlice } from "@reduxjs/toolkit";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { baseUrl } from "../constants";

export const orderApi = createApi({
  reducerPath: "orderApi",
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

  endpoints: (builder) => ({
    createPreOrder: builder.mutation({
      query: (data) => ({
        url: "/order/pre",
        method: "POST",
        body: data,
      }),
    }),
    verifyPreOrder: builder.mutation({
      query: (data) => ({
        url: "/order/pre/verify",
        method: "POST",
        body: data,
      }),
    }),
    fetchOrders: builder.query({
      query: (data) => ({
        url: "/order/post",
        method: "GET",
        params: data,
      }),
    }),
    fetchOrderDetail: builder.query({
      query: (data) => ({
        url: "/order/post/detail",
        method: "GET",
        params: data,
      }),
    }),
  }),
});

const orderSlice = createSlice({
  name: "orderSlice",
  initialState: {
    checkoutFlow: false,
  },
  reducers: {
    setCheckoutFlow: (state, action) => {
      state.checkoutFlow = action.payload;
    },
  },
  extraReducers: (builder) => {},
});

export const {
  useCreatePreOrderMutation,
  useVerifyPreOrderMutation,
  useFetchOrdersQuery,
  useFetchOrderDetailQuery,
} = orderApi;
export const { setCheckoutFlow } = orderSlice.actions;

export default orderSlice.reducer;
