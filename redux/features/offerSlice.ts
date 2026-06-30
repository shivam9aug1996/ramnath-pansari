import { createSlice } from "@reduxjs/toolkit";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { baseUrl } from "../constants";
import { OffersResponse } from "@/types/global";

export const offerApi = createApi({
  reducerPath: "offerApi",
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
  tagTypes: ["offers"],
  endpoints: (builder) => ({
    fetchOffers: builder.query<OffersResponse, void>({
      query: () => ({
        url: "/offers",
        method: "GET",
      }),
      keepUnusedDataFor: 3600,
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
