import { createSlice } from "@reduxjs/toolkit";
import { createApi } from "@reduxjs/toolkit/query/react";
import { baseUrl } from "../constants";
import { createApiBaseQuery } from "../createApiBaseQuery";
import { OffersResponse } from "@/types/global";

export const offerApi = createApi({
  reducerPath: "offerApi",
  baseQuery: createApiBaseQuery(),
  tagTypes: ["offers"],
  endpoints: (builder) => ({
    fetchOffers: builder.query<OffersResponse, void>({
      query: () => ({
        url: "/offers",
        method: "GET",
      }),
      keepUnusedDataFor: 60,
      providesTags: [{ type: "offers", id: "LIST" }],
    }),
  }),
});

const offerSlice = createSlice({
  name: "offer",
  initialState: {},
  reducers: {},
});

export const { useFetchOffersQuery } = offerApi;
export default offerSlice;
