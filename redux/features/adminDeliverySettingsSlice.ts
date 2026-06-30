import { createSlice } from "@reduxjs/toolkit";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { baseUrl } from "../constants";
import {
  AdminDeliverySettingsResponse,
  DeliverySettingsDocument,
} from "@/types/global";
import { deliverySettingsApi } from "./deliverySettingsSlice";

export const adminDeliverySettingsApi = createApi({
  reducerPath: "adminDeliverySettingsApi",
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
  tagTypes: ["adminDeliverySettings"],
  endpoints: (builder) => ({
    getAdminDeliverySettings: builder.query<AdminDeliverySettingsResponse, void>({
      query: () => ({
        url: "/admin/delivery-settings",
        method: "GET",
      }),
      keepUnusedDataFor: 60,
      providesTags: [{ type: "adminDeliverySettings", id: "CONFIG" }],
    }),
    updateAdminDeliverySettings: builder.mutation<
      AdminDeliverySettingsResponse,
      Partial<DeliverySettingsDocument>
    >({
      query: (body) => ({
        url: "/admin/delivery-settings",
        method: "PUT",
        body,
      }),
      invalidatesTags: [{ type: "adminDeliverySettings", id: "CONFIG" }],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          dispatch(
            deliverySettingsApi.util.invalidateTags([
              { type: "deliverySettings", id: "CONFIG" },
            ]),
          );
        } catch {
          // mutation failed
        }
      },
    }),
  }),
});

const adminDeliverySettingsSlice = createSlice({
  name: "adminDeliverySettings",
  initialState: {},
  reducers: {},
});

export const {
  useGetAdminDeliverySettingsQuery,
  useUpdateAdminDeliverySettingsMutation,
} = adminDeliverySettingsApi;

export default adminDeliverySettingsSlice;
