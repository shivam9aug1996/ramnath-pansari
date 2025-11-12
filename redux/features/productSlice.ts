import { createSlice } from "@reduxjs/toolkit";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { baseUrl } from "../constants";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { CACHE_DURATION, cleanOldProductCache } from "@/utils/utils";

export const productApi = createApi({
  reducerPath: "productApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${baseUrl}`,
    prepareHeaders: (headers, api) => {
      const token = api?.getState()?.auth?.token;
      if (token) {
        // console.log("kiop");
        headers.set("authorization", `Bearer ${token}`);
      }
      return headers;
    },
    credentials: "include",
  }),
  tagTypes: ["Products"],
  endpoints: (builder) => ({
    fetchProducts: builder.query({
      async queryFn(arg, _queryApi, _extraOptions, baseQuery) {
        
        const { page, clear, categoryId, ...rest } = arg;
        const localKey = `products-${categoryId}-${page}`;
        const now = Date.now();
        const cached = await AsyncStorage.getItem(localKey);

        
        if (cached) {
          const { data, timestamp } = JSON.parse(cached);
          const age = now - timestamp;
          if (age < CACHE_DURATION) {
            return { data };
          }
        }

        // else, proceed with the normal baseQuery
        const result = await baseQuery({
          url: "/products",
          method: "GET",
          params: { page, categoryId, ...rest },
        });
        if (result.data) {
          await AsyncStorage.setItem(
            localKey,
            JSON.stringify({
              data: result.data,
              timestamp: now,
            })
          );
        }

        return result;
      },
      keepUnusedDataFor: 0,

      serializeQueryArgs: ({ endpointName, queryArgs }) => {
        // Serialize by categoryId (this could avoid conflicts if categoryId changes)
        return `${endpointName}-${queryArgs.categoryId}`;
      },
      providesTags: (result, error, { categoryId }) => {
        // console.log("iuytredsxcvbnm", categoryId);
        return [{ type: "Products", id: categoryId }];
      },

      merge: (currentCache, newItems, { arg }) => {
        // console.log("jhgfg567890hjkl");
        let page = arg?.page;
        let categoryId = arg?.categoryId;

        // console.log("765redfghjkl page", page, arg);
        // console.log("765redfghjkl categoryId", categoryId);
        // console.log("765redfghjkl newItems", JSON.stringify(newItems));
        // console.log("765redfghjkl currentCache", JSON.stringify(currentCache));

        if (page === 1) {
          const startIndex = (page - 1) * 10;
          // let updatedProducts = [...currentCache.products];
          // for (let i = 0; i < newItems.products.length; i++) {
          //   const index = startIndex + i;
          //   if (index < updatedProducts.length) {
          //     console.log(
          //       "in567890dex",
          //       index,
          //       updatedProducts.length,
          //       newItems.products.length,
          //       newItems.products[i]
          //     );
          //     updatedProducts[index] = newItems.products[i];
          //   }
          // }
          // console.log("updatedProducts67890", JSON.stringify(updatedProducts));
          // currentCache.products = updatedProducts;
          console.log("currentCache.currentPage > newItems?.currentPage");
          let updatedProducts = [...currentCache.products];

          // Clear out all items from the start index
          updatedProducts.splice(startIndex, 10);

          // Insert new items at the correct position
          updatedProducts.splice(startIndex, 0, ...newItems.products);

          currentCache.products = updatedProducts;
        } else {
          const startIndex = (page - 1) * 10; // Assuming limit is 10

          if (currentCache.currentPage < newItems?.currentPage) {
            currentCache?.products?.push(...newItems?.products);
            currentCache.currentPage = newItems?.currentPage;
          } else if (currentCache.currentPage >= newItems?.currentPage) {
            // console.log("currentCache.currentPage > newItems?.currentPage");
            // let updatedProducts = [...currentCache.products];
            // for (let i = 0; i < newItems.products.length; i++) {
            //   const index = startIndex + i;
            //   if (index < updatedProducts.length) {
            //     console.log(
            //       "in567890dex",
            //       index,
            //       updatedProducts.length,
            //       newItems.products.length,
            //       newItems.products[i]
            //     );
            //     updatedProducts[index] = newItems.products[i];
            //   }
            // }
            // console.log(
            //   "updatedProducts67890",
            //   JSON.stringify(updatedProducts)
            // );
            // currentCache.products = updatedProducts;
            console.log("currentCache.currentPage > newItems?.currentPage");
            let updatedProducts = [...currentCache.products];

            // Clear out all items from the start index
            updatedProducts.splice(startIndex, 10);

            // Insert new items at the correct position
            updatedProducts.splice(startIndex, 0, ...newItems.products);

            currentCache.products = updatedProducts;
            // currentCache.currentPage = newItems?.currentPage;
          }
        }
      },
      // merge: (currentCache, newItems, { arg }) => {
      //   console.log("jhgfg567890hjkl");
      //   let page = arg?.page;
      //   let categoryId = arg?.categoryId;

      //   console.log("765redfghjkl page", page, arg);
      //   console.log("765redfghjkl categoryId", categoryId);
      //   console.log("765redfghjkl newItems", JSON.stringify(newItems));
      //   console.log("765redfghjkl currentCache", JSON.stringify(currentCache));
      //   if (page == 1) {
      //     currentCache.products = newItems?.products;
      //     currentCache.currentPage = newItems?.currentPage;
      //   } else {
      //     currentCache?.products?.push(...newItems?.products);
      //     currentCache.currentPage = newItems?.currentPage;
      //   }
      // },
      forceRefetch: ({ currentArg, previousArg, state, endpointState }) => {
        return (
          currentArg?.categoryId !== previousArg?.categoryId ||
          currentArg?.page !== previousArg?.page ||
          currentArg?.reset == true
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
    resetPagination: { item: null, status: false },
    selectedCategoryClicked: false,
    productListScrollParams: {
      isBeyondThreshold: false,
      direction: "up",
    },
  },
  reducers: {
    setSelectedSubCategoryId: (state, action) => {
      if (action?.payload || action?.payload === "null") {
        state.selectedSubCategoryId = action?.payload;
      }
    },
    setProductListPosition: (state, action) => {
      if (action?.payload) {
        state.productListPosition = action?.payload;
      }
    },
    setResetPagination: (state, action) => {
      state.resetPagination = action?.payload;
    },
    setSelectedCategoryClicked: (state, action) => {
      state.selectedCategoryClicked = action?.payload;
    },
    setProductListScrollParams: (state, action) => {
      state.productListScrollParams = action?.payload;
    },
  },
  extraReducers: (builder) => {},
});

export const {
  setSelectedSubCategoryId,
  setProductListPosition,
  setResetPagination,
  setSelectedCategoryClicked,
  setProductListScrollParams,
} = productSlice.actions;

export const {
  useFetchProductsQuery,
  useLazyFetchProductsQuery,
  useFetchProductDetailQuery,
  useLazyFetchProductDetailQuery,
} = productApi;

export default productSlice.reducer;
