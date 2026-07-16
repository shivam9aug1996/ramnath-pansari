import { createSlice } from "@reduxjs/toolkit";
import { createApi } from "@reduxjs/toolkit/query/react";
import { baseUrl } from "../constants";
import { createApiBaseQuery } from "../createApiBaseQuery";

export type FetchOrdersArgs = {
  userId: string;
  page: number;
  limit: number;
  orderId?: string;
};

type FetchOrdersResponse = {
  orders: Array<{ _id?: string }>;
  totalOrders?: number;
  totalPages?: number;
  currentPage?: number;
};

function getFetchOrdersCacheKey(queryArgs: FetchOrdersArgs) {
  const { userId, limit, page, orderId } = queryArgs;
  return `${userId}-${limit}-${page}-${orderId ?? ""}`;
}

export const orderApi = createApi({
  reducerPath: "orderApi",
  baseQuery: createApiBaseQuery(),
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
    fetchOrders: builder.query<FetchOrdersResponse, FetchOrdersArgs>({
      query: (data) => ({
        url: "/order/post",
        method: "GET",
        params: data,
      }),
      keepUnusedDataFor: 300,
      serializeQueryArgs: ({ endpointName, queryArgs }) => {
        return `${endpointName}-${getFetchOrdersCacheKey(queryArgs)}`;
      },
      providesTags: (result, error, { userId }) => [
        { type: "orderList", id: `${userId}` },
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
