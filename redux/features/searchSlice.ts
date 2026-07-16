import { createSlice } from "@reduxjs/toolkit";
import { createApi } from "@reduxjs/toolkit/query/react";
import { baseUrl } from "../constants";
import { createApiBaseQuery } from "../createApiBaseQuery";
import { devLog } from "@/utils/devLog";

export const searchApi = createApi({
  reducerPath: "searchApi",
  baseQuery: createApiBaseQuery(),
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
      // merge: (currentCache, newItems, { arg: { page } }) => {
      //   console.log("765redfghjkl", page, newItems);
      //   if (page === 1) currentCache.length = 0;
      //   currentCache?.results?.push(...newItems?.results);
      //   currentCache.currentPage = newItems?.currentPage;
      // },
      merge: (currentCache, newItems, { arg }) => {
       // console.log("jhgfg567890hjkl");
        let page = arg?.page;
        // let categoryId = arg?.categoryId;

        // console.log("765redfghjkl page", page, arg);
        // // console.log("765redfghjkl categoryId", categoryId);
        // console.log("765redfghjkl newItems", JSON.stringify(newItems));
        // console.log("765redfghjkl currentCache", JSON.stringify(currentCache));

        if (page === 1) {
         
          const startIndex = (page - 1) * 10;
          let updatedProducts = [...currentCache.results];

          // Clear out all items from the start index
          updatedProducts.splice(startIndex, 10);

          // Insert new items at the correct position
          updatedProducts.splice(startIndex, 0, ...newItems.results);

          currentCache.results = updatedProducts;
          // let updatedProducts = [...currentCache.results];
          // for (let i = 0; i < newItems.results.length; i++) {
          //   const index = startIndex + i;
          //   if (index < updatedProducts.length) {
          //     console.log(
          //       "in567890dex",
          //       index,
          //       updatedProducts.length,
          //       newItems.results.length,
          //       newItems.results[i]
          //     );
          //     updatedProducts[index] = newItems.results[i];
          //   }
          // }
          // console.log("updatedProducts67890", JSON.stringify(updatedProducts));
          // currentCache.results = updatedProducts;
        } else {
          const startIndex = (page - 1) * 10; // Assuming limit is 10

          if (currentCache.currentPage < newItems?.currentPage) {
            currentCache?.results?.push(...newItems?.results);
            currentCache.currentPage = newItems?.currentPage;
          } else if (currentCache.currentPage >= newItems?.currentPage) {
            devLog("currentCache.currentPage > newItems?.currentPage");
            let updatedProducts = [...currentCache.results];

            // Clear out all items from the start index
            updatedProducts.splice(startIndex, 10);

            // Insert new items at the correct position
            updatedProducts.splice(startIndex, 0, ...newItems.results);

            currentCache.results = updatedProducts;
            // let updatedProducts = [...currentCache.results];
            // for (let i = 0; i < newItems.results.length; i++) {
            //   const index = startIndex + i;
            //   if (index < updatedProducts.length) {
            //     console.log(
            //       "in567890dex",
            //       index,
            //       updatedProducts.length,
            //       newItems.results.length,
            //       newItems.results[i]
            //     );
            //     updatedProducts[index] = newItems.results[i];
            //   }
            // }
            // console.log(
            //   "updatedProducts67890",
            //   JSON.stringify(updatedProducts)
            // );
            // currentCache.results = updatedProducts;
          }
        }
      },
      forceRefetch: ({ currentArg, previousArg }) => {
       // console.log("lkuytr4567890-", currentArg, previousArg);
        return (
          currentArg?.page !== previousArg?.page || currentArg?.reset == true
        );
      },
    }),
    fetchProductsBySearchQueryData: builder.query({
      query: (data) => ({
        url: "/search",
        method: "GET",
        params: data,
      }),
    }),
  }),
});

const searchSlice = createSlice({
  name: "searchSlice",
  initialState: {
    selectedSubCategoryId: null,
    currentSearchQuery: '',
  },
  reducers: {
    setSelectedSubCategoryId: (state, action) => {
      if (action?.payload) {
        state.selectedSubCategoryId = action?.payload;
      }
    },
    setCurrentSearchQuery: (state, action) => {
        state.currentSearchQuery = action?.payload;
    },
  },
  extraReducers: (builder) => {},
});

export const { setSelectedSubCategoryId, setCurrentSearchQuery } = searchSlice.actions;

export const {
  useFetchProductsBySearchQuery,
  useFetchProductsBySearchQueryDataQuery,
  useLazyFetchProductsBySearchQuery,
} = searchApi;

export default searchSlice.reducer;
