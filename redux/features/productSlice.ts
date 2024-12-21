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
      keepUnusedDataFor: 60,

      serializeQueryArgs: ({ endpointName, queryArgs }) => {
        // Serialize by categoryId (this could avoid conflicts if categoryId changes)
        return `${endpointName}-${queryArgs.categoryId}`;
      },
      // onQueryStarted({ page }, { dispatch, getCacheEntry, updateCachedData }) {
      //   console.log("u76543wertyui", page);
      //   if (page == 1) {
      //     console.log("u76543wertyui inside", page);

      //     updateCachedData((draft) => {
      //       console.log("juytfghjk", draft);
      //       if (draft?.products?.length > 10) {
      //         // Retain only the first 10 items
      //         draft.products.slice(0, 10);
      //         draft.currentPage = 1;
      //         (draft.totalPages = 1), (draft.totalProducts = 10);
      //         return draft;
      //       }
      //     });
      //   }
      // },
      merge: (currentCache, newItems, { arg: { page, categoryId } }) => {
        console.log("765redfghjkl page", page);
        console.log("765redfghjkl categoryId", categoryId);
        console.log("765redfghjkl newItems", JSON.stringify(newItems));
        console.log("765redfghjkl currentCache", JSON.stringify(currentCache));
        if (page === 1) {
          console.log(
            "kjhgew45678987654345678985456789",
            JSON.stringify(newItems)
          );
          //currentCache = newItems;
        } else {
          currentCache?.products?.push(...newItems?.products);
          currentCache.currentPage = newItems?.currentPage;
        }
      },
      forceRefetch: ({ currentArg, previousArg, state, endpointState }) => {
        console.log(
          "lkuytr4567890-",
          currentArg,
          previousArg,

          endpointState
        );
        return (
          currentArg?.categoryId !== previousArg?.categoryId ||
          currentArg?.page !== previousArg?.page
        );
      },
    }),

    // fetchProducts: builder.query({
    //   query: ({ categoryId, page, limit }) => ({
    //     url: "/products",
    //     method: "GET",
    //     params: { categoryId, page, limit },
    //   }),
    //   keepUnusedDataFor: 60,
    //   serializeQueryArgs: ({ queryArgs }) => {
    //     // Group cache by categoryId
    //     return queryArgs.categoryId;
    //   },
    //   merge: (currentCache, newItems, { arg }) => {
    //     console.log("merge", { currentCache, newItems }, { arg, newItems });
    //     if (arg.page === 1) {
    //       currentCache.products = [];
    //     }

    //     currentCache.products = [
    //       ...(currentCache.products || []),
    //       ...newItems.products,
    //     ];
    //     currentCache.currentPage = newItems.currentPage;
    //     currentCache.totalPages = newItems.totalPages;
    //   },
    //   forceRefetch: ({ currentArg, previousArg }) => {
    //     // Refetch when categoryId or page changes
    //     return (
    //       currentArg?.categoryId !== previousArg?.categoryId ||
    //       currentArg?.page !== previousArg?.page
    //     );
    //   },
    // }),

    fetchProductDetail: builder.query({
      query: (data) => ({
        url: "/products/detail",
        method: "GET",
        params: data,
      }),
    }),
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
