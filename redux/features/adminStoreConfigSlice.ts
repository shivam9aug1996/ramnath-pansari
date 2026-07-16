import { createSlice } from "@reduxjs/toolkit";
import { createApi } from "@reduxjs/toolkit/query/react";
import { baseUrl } from "../constants";
import { createApiBaseQuery } from "../createApiBaseQuery";
import {
  AdminStoreConfigResponse,
  StoreConfigDocument,
} from "@/types/global";
import { storeConfigApi } from "./storeConfigSlice";

export const adminStoreConfigApi = createApi({
  reducerPath: "adminStoreConfigApi",
  baseQuery: createApiBaseQuery(),
  tagTypes: ["adminStoreConfig"],
  endpoints: (builder) => ({
    getAdminStoreConfig: builder.query<AdminStoreConfigResponse, void>({
      query: () => ({
        url: "/admin/store-config",
        method: "GET",
      }),
      keepUnusedDataFor: 60,
      providesTags: [{ type: "adminStoreConfig", id: "CONFIG" }],
    }),
    updateAdminStoreConfig: builder.mutation<
      AdminStoreConfigResponse,
      Partial<StoreConfigDocument>
    >({
      query: (body) => ({
        url: "/admin/store-config",
        method: "PUT",
        body,
      }),
      invalidatesTags: [{ type: "adminStoreConfig", id: "CONFIG" }],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          dispatch(
            storeConfigApi.util.invalidateTags([
              { type: "storeConfig", id: "CONFIG" },
            ]),
          );
        } catch {
          // mutation failed
        }
      },
    }),
  }),
});

const adminStoreConfigSlice = createSlice({
  name: "adminStoreConfig",
  initialState: {},
  reducers: {},
});

export const {
  useGetAdminStoreConfigQuery,
  useUpdateAdminStoreConfigMutation,
} = adminStoreConfigApi;

export default adminStoreConfigSlice;
