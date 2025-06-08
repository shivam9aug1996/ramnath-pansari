import { createSlice } from "@reduxjs/toolkit";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { baseUrl } from "../constants";

export const khataApi = createApi({
  reducerPath: "khataApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${baseUrl}`,
    prepareHeaders: (headers, api) => {
      const token = api?.getState()?.auth?.token;
      if (token) {
        //console.log("kiop");
        headers.set("authorization", `Bearer ${token}`);
      }
      return headers;
    },
    credentials: "include",
  }),
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
