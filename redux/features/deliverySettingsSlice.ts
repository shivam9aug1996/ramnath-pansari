import { createSlice } from "@reduxjs/toolkit";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { baseUrl } from "../constants";
import { DeliverySettingsResponse } from "@/types/global";

export const deliverySettingsApi = createApi({
  reducerPath: "deliverySettingsApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${baseUrl}`,
    prepareHeaders: (headers, api) => {
      const token = (api as { getState: () => { auth?: { token?: string } } })
        .getState()?.auth?.token;
      if (token) {
        headers.set("authorization", `Bearer ${token}`);
      }
      return headers;
    },
    credentials: "include",
  }),
  tagTypes: ["deliverySettings"],
  endpoints: (builder) => ({
    fetchDeliverySettings: builder.query<DeliverySettingsResponse, void>({
      query: () => ({
        url: "/delivery-settings",
        method: "GET",
      }),
      keepUnusedDataFor: 3600,
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
