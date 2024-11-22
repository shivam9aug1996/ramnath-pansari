import { createSlice } from "@reduxjs/toolkit";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { baseUrl } from "../constants";

export const productApi = createApi({
  reducerPath: "productApi",
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
  endpoints: (builder) => ({
    fetchProducts: builder.query({
      query: (data) => ({
        url: "/products",
        method: "GET",
        params: data,
      }),
      keepUnusedDataFor: 0,
      serializeQueryArgs: ({ endpointName, queryArgs }) => {
        // Serialize by categoryId (this could avoid conflicts if categoryId changes)
        return `${endpointName}-${queryArgs.categoryId}`;
      },
      merge: (currentCache, newItems, { arg: { page, categoryId } }) => {
        console.log("765redfghjkl", { page, newItems, categoryId });
        if (page === 1) currentCache.length = 0;
        currentCache?.products?.push(...newItems?.products);
        currentCache.currentPage = newItems?.currentPage;
      },
      forceRefetch: ({ currentArg, previousArg }) => {
        console.log("lkuytr4567890-", currentArg, previousArg);
        return (
          currentArg?.categoryId !== previousArg?.categoryId ||
          currentArg?.page !== previousArg?.page
        );
      },
    }),
    fetchProductDetail: builder.query({
      query: (data) => ({
        url: "/products/detail",
        method: "GET",
        params: data,
      }),
    }),
    // fetchProducts: builder.query({
    //   query: (data) => ({
    //     url: "/products",
    //     method: "GET",
    //     params: data,
    //   }),
    //   serializeQueryArgs: ({ endpointName }) => endpointName,
    //   merge: (currentCache, newItems, { arg: { page } }) => {
    //     console.log("765redfghjkl", currentCache, page, newItems);
    //     if (page === 1) {
    //       currentCache.products = [];
    //       currentCache.currentPage = 1;
    //     }
    //     currentCache?.products?.push(...newItems?.products);
    //     currentCache.currentPage = newItems?.currentPage;
    //   },
    //   forceRefetch: ({ currentArg, previousArg }) => {
    //     console.log("lkuytr4567890-", currentArg, previousArg);
    //     return currentArg !== previousArg;
    //   },
    // }),
  }),
});

const productSlice = createSlice({
  name: "productSlice",
  initialState: {
    selectedSubCategoryId: null,
    productListPosition: 0,
  },
  reducers: {
    setSelectedSubCategoryId: (state, action) => {
      if (action?.payload) {
        state.selectedSubCategoryId = action?.payload;
      }
    },
    setProductListPosition: (state, action) => {
      if (action?.payload) {
        state.productListPosition = action?.payload;
      }
    },
  },
  extraReducers: (builder) => {},
});

export const { setSelectedSubCategoryId, setProductListPosition } =
  productSlice.actions;

export const {
  useFetchProductsQuery,
  useLazyFetchProductsQuery,
  useFetchProductDetailQuery,
} = productApi;

export default productSlice.reducer;
