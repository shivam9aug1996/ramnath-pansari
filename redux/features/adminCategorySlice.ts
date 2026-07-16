import { createSlice } from "@reduxjs/toolkit";
import { createApi } from "@reduxjs/toolkit/query/react";
import { baseUrl } from "../constants";
import { createApiBaseQuery } from "../createApiBaseQuery";
import {
  AdminCategoryDetailResponse,
  AdminCategoryInput,
  AdminCategoryListResponse,
  Category,
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

export const adminCategoryApi = createApi({
  reducerPath: "adminCategoryApi",
  baseQuery: createApiBaseQuery(),
  tagTypes: ["adminCategoryList", "adminCategoryDetail"],
  endpoints: (builder) => ({
    listAdminCategories: builder.query<AdminCategoryListResponse, void>({
      query: () => ({
        url: "/admin/categories",
        method: "GET",
      }),
      keepUnusedDataFor: 120,
      providesTags: [{ type: "adminCategoryList", id: "TREE" }],
    }),

    getAdminCategory: builder.query<AdminCategoryDetailResponse, { id: string }>({
      query: ({ id }) => ({
        url: `/admin/categories/${id}`,
        method: "GET",
      }),
      keepUnusedDataFor: 60,
      providesTags: (result, error, { id }) => [
        { type: "adminCategoryDetail", id },
      ],
    }),

    createAdminCategory: builder.mutation<{ category: Category }, AdminCategoryInput>({
      query: (body) => ({
        url: "/admin/categories",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "adminCategoryList", id: "TREE" }],
      onQueryStarted: invalidateAdminStats,
    }),

    updateAdminCategory: builder.mutation<
      { category: Category },
      { id: string; body: { name?: string; image?: string | null } }
    >({
      query: ({ id, body }) => ({
        url: `/admin/categories/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "adminCategoryDetail", id },
        { type: "adminCategoryList", id: "TREE" },
      ],
      onQueryStarted: invalidateAdminStats,
    }),

    deleteAdminCategory: builder.mutation<{ success: boolean }, { id: string }>({
      query: ({ id }) => ({
        url: `/admin/categories/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "adminCategoryList", id: "TREE" }],
      onQueryStarted: invalidateAdminStats,
    }),
  }),
});

const adminCategorySlice = createSlice({
  name: "adminCategorySlice",
  initialState: {},
  reducers: {},
});

export const {
  useListAdminCategoriesQuery,
  useGetAdminCategoryQuery,
  useCreateAdminCategoryMutation,
  useUpdateAdminCategoryMutation,
  useDeleteAdminCategoryMutation,
} = adminCategoryApi;

export default adminCategorySlice.reducer;
