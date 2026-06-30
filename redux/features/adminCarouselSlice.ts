import { createSlice } from "@reduxjs/toolkit";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { baseUrl } from "../constants";
import {
  AdminCarouselDocument,
  AdminCarouselInput,
  AdminCarouselListResponse,
} from "@/types/global";
import { carouselApi } from "./carouselSlice";

const invalidateAfterCarouselMutation = async (
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
    dispatch(carouselApi.util.invalidateTags([{ type: "carousel", id: "LIST" }]));
  } catch {
    // mutation failed
  }
};

export const adminCarouselApi = createApi({
  reducerPath: "adminCarouselApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${baseUrl}`,
    prepareHeaders: (headers, api) => {
      const token = (api as { getState: () => { auth?: { token?: string } } })
        .getState()?.auth?.token;
      if (token) {
        headers.set("authorization", `Bearer ${token}`);
      }
      return headers;
    },
    credentials: "include",
  }),
  tagTypes: ["adminCarouselList"],
  endpoints: (builder) => ({
    listAdminCarousel: builder.query<AdminCarouselListResponse, void>({
      query: () => ({
        url: "/admin/carousel",
        method: "GET",
      }),
      keepUnusedDataFor: 60,
      providesTags: [{ type: "adminCarouselList", id: "LIST" }],
    }),
    createAdminCarousel: builder.mutation<
      { banner: AdminCarouselDocument },
      AdminCarouselInput
    >({
      query: (body) => ({
        url: "/admin/carousel",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "adminCarouselList", id: "LIST" }],
      onQueryStarted: invalidateAfterCarouselMutation,
    }),
    updateAdminCarousel: builder.mutation<
      { banner: AdminCarouselDocument },
      { id: string; body: Partial<AdminCarouselInput> }
    >({
      query: ({ id, body }) => ({
        url: `/admin/carousel/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: [{ type: "adminCarouselList", id: "LIST" }],
      onQueryStarted: invalidateAfterCarouselMutation,
    }),
    deleteAdminCarousel: builder.mutation<{ success: boolean }, string>({
      query: (id) => ({
        url: `/admin/carousel/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "adminCarouselList", id: "LIST" }],
      onQueryStarted: invalidateAfterCarouselMutation,
    }),
    backfillCarouselBlurhash: builder.mutation<
      { success: boolean; updated: number; total: number },
      void
    >({
      query: () => ({
        url: "/admin/carousel/backfill-blurhash",
        method: "POST",
      }),
      invalidatesTags: [{ type: "adminCarouselList", id: "LIST" }],
      onQueryStarted: invalidateAfterCarouselMutation,
    }),
  }),
});

const adminCarouselSlice = createSlice({
  name: "adminCarousel",
  initialState: {},
  reducers: {},
});

export const {
  useListAdminCarouselQuery,
  useCreateAdminCarouselMutation,
  useUpdateAdminCarouselMutation,
  useDeleteAdminCarouselMutation,
  useBackfillCarouselBlurhashMutation,
} = adminCarouselApi;

export default adminCarouselSlice;
