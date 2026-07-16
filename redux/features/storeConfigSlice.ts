import { createSlice } from "@reduxjs/toolkit";
import { createApi } from "@reduxjs/toolkit/query/react";
import { baseUrl } from "../constants";
import { createApiBaseQuery } from "../createApiBaseQuery";
import { StoreConfigResponse } from "@/types/global";

export const storeConfigApi = createApi({
  reducerPath: "storeConfigApi",
  baseQuery: createApiBaseQuery(),
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
