import { createSlice } from "@reduxjs/toolkit";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { baseUrl } from "../constants";
import { AdminOrderDocument, AdminOrderListResponse } from "@/types/global";

export const adminOrderApi = createApi({
  reducerPath: "adminOrderApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${baseUrl}`,
    prepareHeaders: (headers, api) => {
      const token = (api as any)?.getState()?.auth?.token;
      if (token) {
        headers.set("authorization", `Bearer ${token}`);
      }
      return headers;
    },
    credentials: "include",
  }),
  tagTypes: ["adminOrderList", "adminOrderDetail"],
  endpoints: (builder) => ({
    // List orders with pagination and optional filters
    listOrders: builder.query<
      AdminOrderListResponse,
      { page?: number; limit?: number; status?: string; search?: string }
    >({
      query: (params) => ({
        url: "/admin/orders",
        method: "GET",
        params,
      }),
      keepUnusedDataFor: 60,
      providesTags: (result) => [{ type: "adminOrderList", id: "LIST" }],
    }),

    // Get single order by id
    getOrder: builder.query<AdminOrderDocument, { id: string }>({
      query: ({ id }) => ({
        url: `/admin/orders/${id}`,
        method: "GET",
      }),
      keepUnusedDataFor: 60,
      providesTags: (result, error, { id }) => [
        { type: "adminOrderDetail", id },
      ],
    }),

    // Create order (rare in admin, but for completeness)
    createOrder: builder.mutation<AdminOrderDocument, Partial<AdminOrderDocument>>({
      query: (body) => ({
        url: "/admin/orders",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "adminOrderList", id: "LIST" }],
    }),

    // Update order status or fields
    updateOrder: builder.mutation<
      AdminOrderDocument,
      { id: string; body: Partial<AdminOrderDocument> }
    >({
      query: ({ id, body }) => ({
        url: `/admin/orders/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "adminOrderDetail", id },
        { type: "adminOrderList", id: "LIST" },
      ],
    }),

    // Delete order
    deleteOrder: builder.mutation<{ success: boolean }, { id: string }>({
      query: ({ id }) => ({
        url: `/admin/orders/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "adminOrderList", id: "LIST" }],
    }),
  }),
});

const adminOrderSlice = createSlice({
  name: "adminOrderSlice",
  initialState: {},
  reducers: {},
  extraReducers: (builder) => {},
});

export const {
  useListOrdersQuery,
  useLazyListOrdersQuery,
  useGetOrderQuery,
  useCreateOrderMutation,
  useUpdateOrderMutation,
  useDeleteOrderMutation,
} = adminOrderApi;

export default adminOrderSlice.reducer;


