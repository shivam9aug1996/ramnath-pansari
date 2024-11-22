import { createSlice } from "@reduxjs/toolkit";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { baseUrl } from "../constants";

export const searchApi = createApi({
  reducerPath: "searchApi",
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
  // tagTypes: ["productList"],
  // keepUnusedDataFor: 30,
  // tagTypes: ["POST"],
  endpoints: (builder) => ({
    fetchProductsBySearch: builder.query({
      keepUnusedDataFor: 0,
      query: (data) => ({
        url: "/search",
        method: "GET",
        params: data,
      }),
      serializeQueryArgs: ({ endpointName }) => endpointName,
      merge: (currentCache, newItems, { arg: { page } }) => {
        console.log("765redfghjkl", page, newItems);
        if (page === 1) currentCache.length = 0;
        currentCache?.results?.push(...newItems?.results);
        currentCache.currentPage = newItems?.currentPage;
      },
      forceRefetch: ({ currentArg, previousArg }) => {
        console.log("lkuytr4567890-", currentArg, previousArg);
        return currentArg !== previousArg;
      },
    }),
  }),
});

const searchSlice = createSlice({
  name: "searchSlice",
  initialState: {
    selectedSubCategoryId: null,
  },
  reducers: {
    setSelectedSubCategoryId: (state, action) => {
      if (action?.payload) {
        state.selectedSubCategoryId = action?.payload;
      }
    },
  },
  extraReducers: (builder) => {},
});

export const { setSelectedSubCategoryId } = searchSlice.actions;

export const { useFetchProductsBySearchQuery } = searchApi;

export default searchSlice.reducer;
