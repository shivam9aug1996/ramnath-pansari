import { createSlice } from "@reduxjs/toolkit";
import { createApi } from "@reduxjs/toolkit/query/react";
import { baseUrl } from "../constants";
import { createApiBaseQuery } from "../createApiBaseQuery";
import {
  AdminProductDocument,
  AdminProductInput,
  AdminProductListResponse,
  JiomartSyncListResponse,
  JiomartSyncResponse,
  ProductDetailResponse,
} from "@/types/global";
import { adminOrderApi } from "./adminOrderSlice";

const invalidateAdminStats = async (
  _: unknown,
  { dispatch, queryFulfilled }: { dispatch: (action: unknown) => void; queryFulfilled: Promise<unknown> },
) => {
  try {
    await queryFulfilled;
    dispatch(
      adminOrderApi.util.invalidateTags([{ type: "adminStats", id: "SUMMARY" }]),
    );
  } catch {
    // mutation failed — leave stats unchanged
  }
};

export const adminProductApi = createApi({
  reducerPath: "adminProductApi",
  baseQuery: createApiBaseQuery(),
  tagTypes: ["adminProductList", "adminProductDetail", "adminJiomartSync"],
  endpoints: (builder) => ({
    listAdminProducts: builder.query<
      AdminProductListResponse,
      {
        page?: number;
        limit?: number;
        search?: string;
        categoryId?: string;
        stock?: string;
        promoOnly?: string;
        deleted?: string;
      }
    >({
      query: (params) => ({
        url: "/admin/products",
        method: "GET",
        params,
      }),
      keepUnusedDataFor: 60,
      providesTags: [{ type: "adminProductList", id: "LIST" }],
    }),

    getAdminProduct: builder.query<
      {
        product: AdminProductDocument;
        detail?: ProductDetailResponse | null;
        offerUsage?: ProductOfferUsage;
      },
      { id: string }
    >({
      query: ({ id }) => ({
        url: `/admin/products/${id}`,
        method: "GET",
      }),
      keepUnusedDataFor: 60,
      providesTags: (result, error, { id }) => [
        { type: "adminProductDetail", id },
        { type: "adminProductDetail", id: "LIST" },
      ],
    }),

    createAdminProduct: builder.mutation<
      { product: AdminProductDocument },
      AdminProductInput
    >({
      query: (body) => ({
        url: "/admin/products",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "adminProductList", id: "LIST" }],
      onQueryStarted: invalidateAdminStats,
    }),

    updateAdminProduct: builder.mutation<
      { product: AdminProductDocument },
      { id: string; body: AdminProductInput }
    >({
      query: ({ id, body }) => ({
        url: `/admin/products/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "adminProductDetail", id },
        { type: "adminProductList", id: "LIST" },
      ],
      onQueryStarted: invalidateAdminStats,
    }),

    deleteAdminProduct: builder.mutation<
      { success: boolean; permanent?: boolean },
      { id: string; permanent?: boolean }
    >({
      query: ({ id, permanent }) => ({
        url: `/admin/products/${id}`,
        method: "DELETE",
        params: permanent ? { permanent: "true" } : undefined,
      }),
      invalidatesTags: [{ type: "adminProductList", id: "LIST" }],
      onQueryStarted: invalidateAdminStats,
    }),

    listJiomartSyncCategories: builder.query<JiomartSyncListResponse, void>({
      query: () => ({
        url: "/admin/products/jiomart-sync",
        method: "GET",
      }),
      keepUnusedDataFor: 120,
      providesTags: [{ type: "adminJiomartSync", id: "LIST" }],
    }),

    syncJiomartProducts: builder.mutation<
      JiomartSyncResponse,
      { categories?: string[]; syncAll?: boolean; wipeAll?: boolean }
    >({
      query: (body) => ({
        url: "/admin/products/jiomart-sync",
        method: "POST",
        body,
      }),
      invalidatesTags: [
        { type: "adminJiomartSync", id: "LIST" },
        { type: "adminProductList", id: "LIST" },
      ],
      onQueryStarted: invalidateAdminStats,
    }),
  }),
});

const adminProductSlice = createSlice({
  name: "adminProductSlice",
  initialState: {},
  reducers: {},
});

export const {
  useListAdminProductsQuery,
  useGetAdminProductQuery,
  useCreateAdminProductMutation,
  useUpdateAdminProductMutation,
  useDeleteAdminProductMutation,
  useListJiomartSyncCategoriesQuery,
  useSyncJiomartProductsMutation,
} = adminProductApi;

export default adminProductSlice.reducer;
