import { createSlice } from "@reduxjs/toolkit";
import { createApi } from "@reduxjs/toolkit/query/react";
import { createApiBaseQuery } from "../createApiBaseQuery";
import { getProductFilterKey } from "@/utils/productFilters";
import { devLog } from "@/utils/devLog";

function filterKeyFromArg(arg: Record<string, unknown> | undefined): string {
  if (!arg) return "default";
  if (typeof arg.filterKey === "string" && arg.filterKey) {
    return arg.filterKey;
  }
  return getProductFilterKey({
    brands:
      typeof arg.brand === "string" && arg.brand
        ? String(arg.brand)
            .split(",")
            .map((b) => b.trim())
            .filter(Boolean)
        : [],
    sort: (arg.sort as "relevance") || "relevance",
    inStockOnly: arg.inStock === true || arg.inStock === "true",
    priceMin:
      arg.priceMin != null && arg.priceMin !== ""
        ? String(arg.priceMin)
        : "",
    priceMax:
      arg.priceMax != null && arg.priceMax !== ""
        ? String(arg.priceMax)
        : "",
  });
}

export const searchApi = createApi({
  reducerPath: "searchApi",
  baseQuery: createApiBaseQuery(),
  endpoints: (builder) => ({
    fetchProductsBySearch: builder.query({
      keepUnusedDataFor: 0,
      query: (data) => {
        const { filterKey: _fk, reset: _reset, ...params } = data ?? {};
        return {
          url: "/search",
          method: "GET",
          params,
        };
      },
      serializeQueryArgs: ({ endpointName, queryArgs }) => {
        const filterKey = filterKeyFromArg(queryArgs);
        const q = queryArgs?.query ?? "";
        return `${endpointName}-${q}-${filterKey}`;
      },
      merge: (currentCache, newItems, { arg }) => {
        let page = arg?.page;

        if (page === 1) {
          if (arg?.reset === true) {
            currentCache.results = [...(newItems.results ?? [])];
            currentCache.currentPage = newItems.currentPage;
            currentCache.totalPages = newItems.totalPages;
            currentCache.totalResults = newItems.totalResults;
            return;
          }

          const startIndex = (page - 1) * 10;
          let updatedProducts = [...(currentCache.results ?? [])];

          updatedProducts.splice(startIndex, 10);
          updatedProducts.splice(startIndex, 0, ...(newItems.results ?? []));

          currentCache.results = updatedProducts;
          currentCache.totalPages = newItems.totalPages;
          currentCache.totalResults = newItems.totalResults;
          currentCache.currentPage = newItems.currentPage;
        } else {
          const startIndex = (page - 1) * 10;

          if (currentCache.currentPage < newItems?.currentPage) {
            currentCache?.results?.push(...newItems?.results);
            currentCache.currentPage = newItems?.currentPage;
            currentCache.totalPages = newItems.totalPages;
            currentCache.totalResults = newItems.totalResults;
          } else if (currentCache.currentPage >= newItems?.currentPage) {
            devLog("currentCache.currentPage > newItems?.currentPage");
            let updatedProducts = [...currentCache.results];

            updatedProducts.splice(startIndex, 10);
            updatedProducts.splice(startIndex, 0, ...newItems.results);

            currentCache.results = updatedProducts;
          }
        }
      },
      forceRefetch: ({ currentArg, previousArg }) => {
        return (
          currentArg?.page !== previousArg?.page ||
          currentArg?.query !== previousArg?.query ||
          currentArg?.reset == true ||
          filterKeyFromArg(currentArg) !== filterKeyFromArg(previousArg)
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
    currentSearchQuery: "",
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

export const { setSelectedSubCategoryId, setCurrentSearchQuery } =
  searchSlice.actions;

export const {
  useFetchProductsBySearchQuery,
  useFetchProductsBySearchQueryDataQuery,
  useLazyFetchProductsBySearchQuery,
} = searchApi;

export default searchSlice.reducer;
