import { createSlice } from "@reduxjs/toolkit";
import { createApi } from "@reduxjs/toolkit/query/react";
import { baseUrl } from "../constants";
import { createApiBaseQuery } from "../createApiBaseQuery";
import {
  AdminOfferDocument,
  AdminOfferInput,
  AdminOfferListResponse,
} from "@/types/global";
import { offerApi } from "./offerSlice";
import { adminProductApi } from "./adminProductSlice";

const invalidateAfterOfferMutation = async (
  _: unknown,
  { dispatch, queryFulfilled }: { dispatch: (action: unknown) => void; queryFulfilled: Promise<unknown> },
) => {
  try {
    await queryFulfilled;
    dispatch(offerApi.util.invalidateTags([{ type: "offers", id: "LIST" }]));
    dispatch(
      adminProductApi.util.invalidateTags([
        { type: "adminProductDetail", id: "LIST" },
      ]),
    );
  } catch {
    // mutation failed
  }
};

export const adminOfferApi = createApi({
  reducerPath: "adminOfferApi",
  baseQuery: createApiBaseQuery(),
  tagTypes: ["adminOfferList"],
  endpoints: (builder) => ({
    listAdminOffers: builder.query<AdminOfferListResponse, void>({
      query: () => ({
        url: "/admin/offers",
        method: "GET",
      }),
      keepUnusedDataFor: 60,
      providesTags: [{ type: "adminOfferList", id: "LIST" }],
    }),
    createAdminOffer: builder.mutation<
      { offer: AdminOfferDocument },
      AdminOfferInput
    >({
      query: (body) => ({
        url: "/admin/offers",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "adminOfferList", id: "LIST" }],
      onQueryStarted: invalidateAfterOfferMutation,
    }),
    updateAdminOffer: builder.mutation<
      { offer: AdminOfferDocument },
      { id: string; body: Partial<AdminOfferInput> }
    >({
      query: ({ id, body }) => ({
        url: `/admin/offers/${id}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: [{ type: "adminOfferList", id: "LIST" }],
      onQueryStarted: invalidateAfterOfferMutation,
    }),
    deleteAdminOffer: builder.mutation<{ success: boolean }, string>({
      query: (id) => ({
        url: `/admin/offers/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "adminOfferList", id: "LIST" }],
      onQueryStarted: invalidateAfterOfferMutation,
    }),
  }),
});

const adminOfferSlice = createSlice({
  name: "adminOffer",
  initialState: {},
  reducers: {},
});

export const {
  useListAdminOffersQuery,
  useCreateAdminOfferMutation,
  useUpdateAdminOfferMutation,
  useDeleteAdminOfferMutation,
} = adminOfferApi;

export default adminOfferSlice;
