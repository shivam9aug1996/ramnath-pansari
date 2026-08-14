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

function appendUniqueById<T extends { _id?: string }>(
  existing: T[] = [],
  incoming: T[] = [],
): T[] {
  const seen = new Set<string>();
  for (const item of existing) {
    if (item?._id) seen.add(item._id);
  }
  const uniqueIncoming: T[] = [];
  for (const item of incoming) {
    if (!item?._id || seen.has(item._id)) continue;
    seen.add(item._id);
    uniqueIncoming.push(item);
  }
  if (uniqueIncoming.length === 0) return existing;
  return [...existing, ...uniqueIncoming];
}

function dedupeById<T extends { _id?: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (!item?._id) return true;
    if (seen.has(item._id)) return false;
    seen.add(item._id);
    return true;
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
        const page = Number(arg?.page) || 1;
        const incoming = newItems?.results ?? [];
        const nextPage = Number(newItems?.currentPage) || page;
        const cachePage = Number(currentCache.currentPage) || 0;

        if (page === 1) {
          if (arg?.reset === true) {
            currentCache.results = [...incoming];
          } else {
            const updatedProducts = [...(currentCache.results ?? [])];
            updatedProducts.splice(0, 10);
            updatedProducts.splice(0, 0, ...incoming);
            currentCache.results = dedupeById(updatedProducts);
          }
          currentCache.currentPage = nextPage;
          currentCache.totalPages = newItems.totalPages;
          currentCache.totalResults = newItems.totalResults;
          return;
        }

        if (cachePage < nextPage) {
          currentCache.results = appendUniqueById(
            currentCache.results ?? [],
            incoming,
          );
          currentCache.currentPage = nextPage;
          currentCache.totalPages = newItems.totalPages;
          currentCache.totalResults = newItems.totalResults;
          return;
        }

        devLog("currentCache.currentPage >= newItems?.currentPage");
        const startIndex = (page - 1) * 10;
        const updatedProducts = [...(currentCache.results ?? [])];
        updatedProducts.splice(startIndex, 10);
        updatedProducts.splice(startIndex, 0, ...incoming);
        currentCache.results = dedupeById(updatedProducts);
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
