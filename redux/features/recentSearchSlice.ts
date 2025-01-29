import { createSlice } from "@reduxjs/toolkit";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { baseUrl } from "../constants";

export const recentSearchApi = createApi({
  reducerPath: "recentSearchApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${baseUrl}`,
    prepareHeaders: (headers, api) => {
      const token = api?.getState()?.auth?.token;
      if (token) {
        console.log("kiop");
        headers.set("authorization", `Bearer ${token}`);
      }
      return headers;
    },
    credentials: "include",
  }),
  tagTypes: ["recentSearch"],
  //keepUnusedDataFor: 0,
  endpoints: (builder) => ({
    fetchRecentSearch: builder.query({
      query: (data) => ({
        url: "/recentSearch",
        method: "GET",
        params: data,
      }),
      providesTags: ["recentSearch"],
    }),
    createRecentSearch: builder.mutation({
      query: (data) => ({
        url: "/recentSearch",
        method: "POST",
        body: data?.body,
      }),
      invalidatesTags: ["recentSearch"],
    }),
    deleteRecentSearch: builder.mutation({
      query: (data) => ({
        url: "/recentSearch",
        method: "DELETE",
        params: data,
      }),
      invalidatesTags: ["recentSearch"],
    }),
  }),
});

const cartSlice = createSlice({
  name: "cartSlice",
  initialState: {
    cartButtonProductId: [],
    cartState: [],
    cartFetching: false,
  },
  reducers: {},
  extraReducers: (builder) => {},
});

export const {} = cartSlice.actions;

export const {
  useFetchRecentSearchQuery,
  useCreateRecentSearchMutation,
  useDeleteRecentSearchMutation,
  useLazyFetchRecentSearchQuery,
} = recentSearchApi;

export default cartSlice.reducer;
