import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { createApi } from "@reduxjs/toolkit/query/react";
import { createApiBaseQuery } from "../createApiBaseQuery";
import type { Product } from "@/types/global";
import { getCachedProducts, setCachedProducts } from "@/utils/productCache";
import { getProductFilterKey } from "@/utils/productFilters";
import { devLog } from "@/utils/devLog";

export type SyncedProductOverride = Partial<
  Pick<
    Product,
    "maxQuantity" | "price" | "discountedPrice" | "isOutOfStock"
  >
>;

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

export const productApi = createApi({
  reducerPath: "productApi",
  baseQuery: createApiBaseQuery(),
  tagTypes: ["Products", "ProductBrands"],
  endpoints: (builder) => ({
    fetchProducts: builder.query({
      async queryFn(arg, _queryApi, _extraOptions, baseQuery) {
        const { page, clear, categoryId, filterKey: _fk, reset, refreshKey, ...rest } =
          arg;
        const filterKey = filterKeyFromArg(arg);

        const cachedData = await getCachedProducts(categoryId, page, filterKey);
        if (cachedData) {
          devLog("[products] cache hit", {
            categoryId,
            page,
            filterKey,
            productCount: cachedData?.products?.length ?? null,
            totalResults: cachedData?.totalResults ?? null,
          });
          return { data: cachedData };
        }

        const result = await baseQuery({
          url: "/products",
          method: "GET",
          params: { page, categoryId, ...rest },
        });
        const networkData = result.data as
          | { products?: unknown[]; totalResults?: number; totalProducts?: number }
          | undefined;
        // Normalize backend totalProducts → totalResults for the client merge path.
        if (
          result.data &&
          typeof result.data === "object" &&
          networkData &&
          networkData.totalResults == null &&
          networkData.totalProducts != null
        ) {
          (result.data as { totalResults: number }).totalResults =
            networkData.totalProducts;
        }
        devLog("[products] network", {
          categoryId,
          page,
          filterKey,
          productCount: networkData?.products?.length ?? null,
          totalResults:
            networkData?.totalResults ?? networkData?.totalProducts ?? null,
          hasError: Boolean(result.error),
          errorStatus: (result.error as { status?: unknown } | undefined)
            ?.status ?? null,
        });
        if (result.data) {
          setCachedProducts(categoryId, page, result.data, filterKey);
        }

        return result;
      },
      keepUnusedDataFor: 0,

      serializeQueryArgs: ({ endpointName, queryArgs }) => {
        const filterKey = filterKeyFromArg(queryArgs);
        return `${endpointName}-${queryArgs.categoryId}-${filterKey}`;
      },
      providesTags: (result, error, { categoryId }) => {
        return [{ type: "Products", id: categoryId }];
      },

      merge: (currentCache, newItems, { arg }) => {
        const page = Number(arg?.page) || 1;
        const incoming = newItems?.products ?? [];
        const nextPage = Number(newItems?.currentPage) || page;
        const cachePage = Number(currentCache.currentPage) || 0;
        const totalResults =
          newItems.totalResults ?? newItems.totalProducts;

        if (page === 1) {
          if (arg?.reset === true) {
            currentCache.products = [...incoming];
          } else {
            const updatedProducts = [...(currentCache.products ?? [])];
            updatedProducts.splice(0, 10);
            updatedProducts.splice(0, 0, ...incoming);
            currentCache.products = dedupeById(updatedProducts);
          }
          currentCache.currentPage = nextPage;
          currentCache.totalPages = newItems.totalPages;
          currentCache.totalResults = totalResults;
          return;
        }

        if (cachePage < nextPage) {
          currentCache.products = appendUniqueById(
            currentCache.products ?? [],
            incoming,
          );
          currentCache.currentPage = nextPage;
          currentCache.totalPages = newItems.totalPages;
          currentCache.totalResults = totalResults;
          return;
        }

        devLog("currentCache.currentPage >= newItems?.currentPage");
        const startIndex = (page - 1) * 10;
        const updatedProducts = [...(currentCache.products ?? [])];
        updatedProducts.splice(startIndex, 10);
        updatedProducts.splice(startIndex, 0, ...incoming);
        currentCache.products = dedupeById(updatedProducts);
      },
      forceRefetch: ({ currentArg, previousArg }) => {
        return (
          currentArg?.categoryId !== previousArg?.categoryId ||
          currentArg?.page !== previousArg?.page ||
          currentArg?.reset == true ||
          currentArg?.refreshKey !== previousArg?.refreshKey ||
          filterKeyFromArg(currentArg) !== filterKeyFromArg(previousArg)
        );
      },
    }),

    fetchProductBrands: builder.query({
      query: (params: { categoryId?: string; query?: string }) => ({
        url: "/products/brands",
        method: "GET",
        params,
      }),
      providesTags: ["ProductBrands"],
    }),

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
      shouldHideChrome: false,
    },
    /** Latest JioMart sync fields — merged in product list (all pages/categories). */
    syncedProductOverrides: {} as Record<string, SyncedProductOverride>,
    visibleIds: [],
    queryResultVisibleIds: [],
  },
  reducers: {
    applySyncedProductOverrides: (
      state,
      action: PayloadAction<
        Array<{
          productId: string;
          maxQuantity?: number;
          price?: number;
          discountedPrice?: number;
          isOutOfStock?: boolean;
        }>
      >,
    ) => {
      for (const update of action.payload) {
        const patch: SyncedProductOverride = {};
        if (update.maxQuantity != null) patch.maxQuantity = update.maxQuantity;
        if (update.price != null) patch.price = update.price;
        if (update.discountedPrice != null) {
          patch.discountedPrice = update.discountedPrice;
        }
        if (update.isOutOfStock != null) {
          patch.isOutOfStock = update.isOutOfStock;
        }
        if (Object.keys(patch).length === 0) continue;
        state.syncedProductOverrides[update.productId] = {
          ...state.syncedProductOverrides[update.productId],
          ...patch,
        };
      }
    },
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
    setVisibleIds: (state, action) => {
      state.visibleIds = action?.payload;
    },
    setQueryResultVisibleIds: (state, action) => {
      state.queryResultVisibleIds = action?.payload;
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
  applySyncedProductOverrides,
  setVisibleIds,
  setQueryResultVisibleIds,
} = productSlice.actions;

export const {
  useFetchProductsQuery,
  useLazyFetchProductsQuery,
  useFetchProductBrandsQuery,
  useFetchProductDetailQuery,
  useLazyFetchProductDetailQuery,
} = productApi;

export default productSlice.reducer;
