import { createSlice } from "@reduxjs/toolkit";
import { createApi } from "@reduxjs/toolkit/query/react";
import { baseUrl } from "../constants";
import { createApiBaseQuery } from "../createApiBaseQuery";
import {
  AdminDeliverySettingsResponse,
  DeliverySettingsDocument,
} from "@/types/global";
import { deliverySettingsApi } from "./deliverySettingsSlice";

export const adminDeliverySettingsApi = createApi({
  reducerPath: "adminDeliverySettingsApi",
  baseQuery: createApiBaseQuery(),
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
