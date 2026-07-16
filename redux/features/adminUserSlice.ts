import { createSlice } from "@reduxjs/toolkit";
import { createApi } from "@reduxjs/toolkit/query/react";
import { baseUrl } from "../constants";
import { createApiBaseQuery } from "../createApiBaseQuery";
import {
  AdminUserDocument,
  AdminUserInput,
  AdminUserListResponse,
  AdminUserUpdateInput,
} from "@/types/global";
import { adminOrderApi } from "./adminOrderSlice";

const invalidateAdminStats = async (
  _: unknown,
  {
    dispatch,
    queryFulfilled,
  }: {
    dispatch: (action: unknown) => void;
    queryFulfilled: Promise<unknown>;
  },
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

export const adminUserApi = createApi({
  reducerPath: "adminUserApi",
  baseQuery: createApiBaseQuery(),
  tagTypes: ["adminUserList", "adminUserDetail"],
  endpoints: (builder) => ({
    listAdminUsers: builder.query<
      AdminUserListResponse,
      { page?: number; limit?: number; search?: string; role?: string }
    >({
      query: (params) => ({
        url: "/admin/users",
        method: "GET",
        params,
      }),
      keepUnusedDataFor: 60,
      providesTags: [{ type: "adminUserList", id: "LIST" }],
    }),

    getAdminUser: builder.query<{ user: AdminUserDocument }, { id: string }>({
      query: ({ id }) => ({
        url: `/admin/users/${id}`,
        method: "GET",
      }),
      keepUnusedDataFor: 60,
      providesTags: (result, error, { id }) => [
        { type: "adminUserDetail", id },
      ],
    }),

    createAdminUser: builder.mutation<
      { user: AdminUserDocument },
      AdminUserInput
    >({
      query: (body) => ({
        url: "/admin/users",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "adminUserList", id: "LIST" }],
      onQueryStarted: invalidateAdminStats,
    }),

    updateAdminUser: builder.mutation<
      { user: AdminUserDocument },
      { id: string; body: AdminUserUpdateInput }
    >({
      query: ({ id, body }) => ({
        url: `/admin/users/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: "adminUserDetail", id },
        { type: "adminUserList", id: "LIST" },
      ],
      onQueryStarted: invalidateAdminStats,
    }),

    deleteAdminUser: builder.mutation<{ success: boolean }, { id: string }>({
      query: ({ id }) => ({
        url: `/admin/users/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "adminUserList", id: "LIST" }],
      onQueryStarted: invalidateAdminStats,
    }),
  }),
});

const adminUserSlice = createSlice({
  name: "adminUserSlice",
  initialState: {},
  reducers: {},
});

export const {
  useListAdminUsersQuery,
  useGetAdminUserQuery,
  useCreateAdminUserMutation,
  useUpdateAdminUserMutation,
  useDeleteAdminUserMutation,
} = adminUserApi;

export default adminUserSlice.reducer;
