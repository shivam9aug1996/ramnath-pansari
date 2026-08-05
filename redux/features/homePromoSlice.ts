import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { createApi } from "@reduxjs/toolkit/query/react";
import { createApiBaseQuery } from "../createApiBaseQuery";
import { HomeProductPromoResponse } from "@/types/global";

export const homePromoApi = createApi({
  reducerPath: "homePromoApi",
  baseQuery: createApiBaseQuery(),
  tagTypes: ["homePromo"],
  endpoints: (builder) => ({
    fetchHomePromo: builder.query<HomeProductPromoResponse, void>({
      query: () => ({
        url: "/home-promo",
        method: "GET",
      }),
      keepUnusedDataFor: 60,
      providesTags: [{ type: "homePromo", id: "ACTIVE" }],
    }),
  }),
});

const homePromoSlice = createSlice({
  name: "homePromo",
  initialState: {
    promoDockedInline: false,
    /** Set while PrivateHome is mounted; gates lazy PromoDocked in root layout. */
    privateHomeMounted: false,
  },
  reducers: {
    setPromoDockedInline: (state, action: PayloadAction<boolean>) => {
      state.promoDockedInline = action.payload;
    },
    setPrivateHomeMounted: (state, action: PayloadAction<boolean>) => {
      state.privateHomeMounted = action.payload;
    },
  },
});

export const { setPromoDockedInline, setPrivateHomeMounted } =
  homePromoSlice.actions;

export const { useFetchHomePromoQuery } = homePromoApi;
export default homePromoSlice.reducer;
