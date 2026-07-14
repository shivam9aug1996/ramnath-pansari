import { createSlice } from "@reduxjs/toolkit";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { baseUrl } from "../constants";
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
