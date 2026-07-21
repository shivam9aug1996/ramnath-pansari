import { createSlice } from "@reduxjs/toolkit";
import { createApi } from "@reduxjs/toolkit/query/react";
import { baseUrl } from "../constants";
import { createApiBaseQuery } from "../createApiBaseQuery";
import { DeliverySettingsResponse } from "@/types/global";

export const deliverySettingsApi = createApi({
  reducerPath: "deliverySettingsApi",
  baseQuery: createApiBaseQuery(),
  tagTypes: ["deliverySettings"],
  endpoints: (builder) => ({
    fetchDeliverySettings: builder.query<DeliverySettingsResponse, void>({
      query: () => ({
        url: "/delivery-settings",
        method: "GET",
      }),
      keepUnusedDataFor: 0,
      providesTags: [{ type: "deliverySettings", id: "CONFIG" }],
    }),
  }),
});

const deliverySettingsSlice = createSlice({
  name: "deliverySettings",
  initialState: {},
  reducers: {},
});

export const { useFetchDeliverySettingsQuery } = deliverySettingsApi;
export default deliverySettingsSlice;
