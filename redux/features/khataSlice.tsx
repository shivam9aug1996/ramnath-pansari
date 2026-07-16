import { createSlice } from "@reduxjs/toolkit";
import { createApi } from "@reduxjs/toolkit/query/react";
import { baseUrl } from "../constants";
import { createApiBaseQuery } from "../createApiBaseQuery";

export const khataApi = createApi({
  reducerPath: "khataApi",
  baseQuery: createApiBaseQuery(),
  endpoints: (builder) => ({
    checkKhata: builder.query({
      query: (data) => ({
        url: "/khata",
        method: "GET",
        params: data,
      }),
    }),
  }),
});

const khataSlice = createSlice({
  name: "khataSlice",
  initialState: {},
  reducers: {},
  extraReducers: (builder) => {},
});

export const {} = khataSlice.actions;

export const { useCheckKhataQuery, useLazyCheckKhataQuery } = khataApi;

export default khataSlice.reducer;
