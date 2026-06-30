import { createSlice } from "@reduxjs/toolkit";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { baseUrl } from "../constants";
import { StoreConfigResponse } from "@/types/global";

export const storeConfigApi = createApi({
  reducerPath: "storeConfigApi",
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
  tagTypes: ["storeConfig"],
  endpoints: (builder) => ({
    fetchStoreConfig: builder.query<StoreConfigResponse, void>({
      query: () => ({
        url: "/store-config",
        method: "GET",
      }),
      keepUnusedDataFor: 3600,
      providesTags: [{ type: "storeConfig", id: "CONFIG" }],
    }),
  }),
});

const storeConfigSlice = createSlice({
  name: "storeConfig",
  initialState: {},
  reducers: {},
});

export const { useFetchStoreConfigQuery } = storeConfigApi;
export default storeConfigSlice;
