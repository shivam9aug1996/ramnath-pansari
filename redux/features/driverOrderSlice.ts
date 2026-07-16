import { createSlice } from "@reduxjs/toolkit";
import { createApi } from "@reduxjs/toolkit/query/react";
import { baseUrl } from "../constants";
import { createApiBaseQuery } from "../createApiBaseQuery";
import { DriverOrderSummary, DriverOrdersResponse } from "@/types/global";

export const driverOrderApi = createApi({
  reducerPath: "driverOrderApi",
  baseQuery: createApiBaseQuery(),
  tagTypes: ["driverOrders", "driverOrderDetail"],
  endpoints: (builder) => ({
    listDriverOrders: builder.query<DriverOrdersResponse, void>({
      query: () => ({
        url: "/driver/orders",
        method: "GET",
      }),
      providesTags: [{ type: "driverOrders", id: "LIST" }],
    }),

    getDriverOrder: builder.query<{ order: DriverOrderSummary }, { id: string }>({
      query: ({ id }) => ({
        url: `/driver/orders/${id}`,
        method: "GET",
      }),
      providesTags: (result, error, { id }) => [{ type: "driverOrderDetail", id }],
    }),

    startDriverDelivery: builder.mutation<
      {
        message: string;
        orderId: string;
        orderStatus: string;
        latitude: number;
        longitude: number;
      },
      { id: string }
    >({
      query: ({ id }) => ({
        url: `/driver/orders/${id}/start`,
        method: "POST",
      }),
      invalidatesTags: [
        { type: "driverOrders", id: "LIST" },
        { type: "driverOrderDetail", id: "LIST" },
      ],
    }),

    markDriverDelivered: builder.mutation<
      { message: string; orderId: string; orderStatus: string },
      { id: string }
    >({
      query: ({ id }) => ({
        url: `/driver/orders/${id}/deliver`,
        method: "POST",
      }),
      invalidatesTags: [
        { type: "driverOrders", id: "LIST" },
        { type: "driverOrderDetail", id: "LIST" },
      ],
    }),
  }),
});

const driverOrderSlice = createSlice({
  name: "driverOrderSlice",
  initialState: {},
  reducers: {},
});

export const {
  useListDriverOrdersQuery,
  useGetDriverOrderQuery,
  useStartDriverDeliveryMutation,
  useMarkDriverDeliveredMutation,
} = driverOrderApi;

export default driverOrderSlice.reducer;
