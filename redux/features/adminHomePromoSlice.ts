import { createSlice } from "@reduxjs/toolkit";
import { createApi } from "@reduxjs/toolkit/query/react";
import { createApiBaseQuery } from "../createApiBaseQuery";
import {
  AdminHomeProductPromoResponse,
  HomeProductPromoDocument,
} from "@/types/global";
import { homePromoApi } from "./homePromoSlice";

export const adminHomePromoApi = createApi({
  reducerPath: "adminHomePromoApi",
  baseQuery: createApiBaseQuery(),
  tagTypes: ["adminHomePromo"],
  endpoints: (builder) => ({
    getAdminHomePromo: builder.query<AdminHomeProductPromoResponse, void>({
      query: () => ({
        url: "/admin/home-promo",
        method: "GET",
      }),
      keepUnusedDataFor: 60,
      providesTags: [{ type: "adminHomePromo", id: "CONFIG" }],
    }),
    updateAdminHomePromo: builder.mutation<
      AdminHomeProductPromoResponse,
      Partial<HomeProductPromoDocument>
    >({
      query: (body) => ({
        url: "/admin/home-promo",
        method: "PUT",
        body,
      }),
      invalidatesTags: [{ type: "adminHomePromo", id: "CONFIG" }],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          dispatch(
            homePromoApi.util.invalidateTags([
              { type: "homePromo", id: "ACTIVE" },
            ]),
          );
        } catch {
          // mutation failed
        }
      },
    }),
  }),
});

const adminHomePromoSlice = createSlice({
  name: "adminHomePromo",
  initialState: {},
  reducers: {},
});

export const {
  useGetAdminHomePromoQuery,
  useUpdateAdminHomePromoMutation,
} = adminHomePromoApi;

export default adminHomePromoSlice.reducer;
