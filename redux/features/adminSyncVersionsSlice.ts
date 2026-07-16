import { createSlice } from "@reduxjs/toolkit";
import { createApi } from "@reduxjs/toolkit/query/react";
import { baseUrl } from "../constants";
import { createApiBaseQuery } from "../createApiBaseQuery";
import type {
  AdminSyncVersionsResponse,
  AppSyncServerVersions,
} from "@/types/global";

export type FlushProductRedisResponse = {
  success: boolean;
  deleted: number;
  pattern: string;
};

export const adminSyncVersionsApi = createApi({
  reducerPath: "adminSyncVersionsApi",
  baseQuery: createApiBaseQuery(),
  tagTypes: ["adminSyncVersions"],
  endpoints: (builder) => ({
    getAdminSyncVersions: builder.query<AdminSyncVersionsResponse, void>({
      query: () => ({
        url: "/admin/sync-versions",
        method: "GET",
      }),
      keepUnusedDataFor: 60,
      providesTags: [{ type: "adminSyncVersions", id: "VERSIONS" }],
    }),
    updateAdminSyncVersions: builder.mutation<
      AdminSyncVersionsResponse,
      Partial<AppSyncServerVersions>
    >({
      query: (body) => ({
        url: "/admin/sync-versions",
        method: "PUT",
        body,
      }),
      invalidatesTags: [{ type: "adminSyncVersions", id: "VERSIONS" }],
    }),
    flushProductRedisCache: builder.mutation<FlushProductRedisResponse, void>({
      query: () => ({
        url: "/admin/redis/products",
        method: "POST",
      }),
    }),
  }),
});

const adminSyncVersionsSlice = createSlice({
  name: "adminSyncVersions",
  initialState: {},
  reducers: {},
});

export const {
  useGetAdminSyncVersionsQuery,
  useUpdateAdminSyncVersionsMutation,
  useFlushProductRedisCacheMutation,
} = adminSyncVersionsApi;

export default adminSyncVersionsSlice;
