import { createSlice } from "@reduxjs/toolkit";
import { createApi } from "@reduxjs/toolkit/query/react";
import { baseUrl } from "../constants";
import { createApiBaseQuery } from "../createApiBaseQuery";
import { AdminOrderDocument, AdminOrderListResponse, AdminStatsResponse } from "@/types/global";

export const adminOrderApi = createApi({
  reducerPath: "adminOrderApi",
  baseQuery: createApiBaseQuery(),
  tagTypes: ["adminOrderList", "adminOrderDetail", "adminStats"],
  endpoints: (builder) => ({
    getAdminStats: builder.query<AdminStatsResponse, void>({
      query: () => ({
        url: "/admin/stats",
        method: "GET",
      }),
      providesTags: [{ type: "adminStats", id: "SUMMARY" }],
    }),

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
        { type: "adminStats", id: "SUMMARY" },
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

    listAdminDrivers: builder.query<
      { drivers: import("@/types/global").AdminDriverOption[] },
      void
    >({
      query: () => ({
        url: "/admin/drivers",
        method: "GET",
      }),
    }),

    assignDriverToOrder: builder.mutation<
      { message: string; assignedDriver: AdminOrderDocument["assignedDriver"] },
      { orderId: string; driverUserId: string }
    >({
      query: ({ orderId, driverUserId }) => ({
        url: `/admin/orders/${orderId}/assign-driver`,
        method: "POST",
        body: { driverUserId },
      }),
      invalidatesTags: (result, error, { orderId }) => [
        { type: "adminOrderDetail", id: orderId },
        { type: "adminOrderList", id: "LIST" },
      ],
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
  useGetAdminStatsQuery,
  useListOrdersQuery,
  useLazyListOrdersQuery,
  useGetOrderQuery,
  useCreateOrderMutation,
  useUpdateOrderMutation,
  useDeleteOrderMutation,
  useListAdminDriversQuery,
  useAssignDriverToOrderMutation,
} = adminOrderApi;

export default adminOrderSlice.reducer;


