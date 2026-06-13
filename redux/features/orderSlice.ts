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
       // console.log("kiop");
        headers.set("authorization", `Bearer ${token}`);
      }
      return headers;
    },
    credentials: "include",
  }),
  tagTypes: ["detailOrder", "orderList", "activeDeliveries"],

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
    placeCodOrder: builder.mutation({
      query: (data) => ({
        url: "/order/pre/cod",
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
     // keepUnusedDataFor: 0,
      serializeQueryArgs: ({ endpointName, queryArgs }) => {
       // console.log("jhgfhjkl3456890", endpointName, queryArgs);
        return `${endpointName}`;
      },
      merge: (currentCache, newItems, { arg: { page } }) => {
        const incomingOrders = newItems?.orders ?? [];

        if (!currentCache || page === 1) {
          return {
            ...newItems,
            orders: incomingOrders,
            currentPage: newItems?.currentPage ?? page,
          };
        }

        return {
          ...newItems,
          orders: [...(currentCache.orders ?? []), ...incomingOrders],
          currentPage: newItems?.currentPage ?? currentCache.currentPage,
        };
      },
      forceRefetch: ({ currentArg, previousArg }) => {
       // console.log("lkuytr4567890-", currentArg, previousArg);
        return currentArg?.page !== previousArg?.page;
      },
      providesTags: (result, error, { userId, page }) => [
        { type: "orderList", id: `${userId}` }, // Provide a tag specific to the userId and page
      ],
    }),
    fetchOrderDetail: builder.query({
      query: (data) => ({
        url: "/order/post/detail",
        method: "GET",
        params: data,
      }),
      keepUnusedDataFor: 0,
      providesTags: (result, error, { orderId, userId }) => [
        { type: "detailOrder", id: `${orderId}-${userId}` },
      ],
    }),
    fetchActiveDeliveries: builder.query({
      query: (data) => ({
        url: "/order/post",
        method: "GET",
        params: data,
      }),
      keepUnusedDataFor: 0,
      providesTags: (result, error, { userId }) => [
        { type: "activeDeliveries", id: `${userId}` },
      ],
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
  useFetchActiveDeliveriesQuery,
  useLazyFetchOrdersQuery,
  usePlaceCodOrderMutation,
} = orderApi;
export const { setCheckoutFlow } = orderSlice.actions;

export default orderSlice.reducer;
