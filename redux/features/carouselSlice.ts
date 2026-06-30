import { createSlice } from "@reduxjs/toolkit";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { baseUrl } from "../constants";
import { CarouselResponse } from "@/types/global";

export const carouselApi = createApi({
  reducerPath: "carouselApi",
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
  tagTypes: ["carousel"],
  endpoints: (builder) => ({
    fetchCarousel: builder.query<CarouselResponse, void>({
      query: () => ({
        url: "/carousel",
        method: "GET",
      }),
      keepUnusedDataFor: 3600,
      providesTags: [{ type: "carousel", id: "LIST" }],
    }),
  }),
});

const carouselSlice = createSlice({
  name: "carousel",
  initialState: {},
  reducers: {},
});

export const { useFetchCarouselQuery } = carouselApi;
export default carouselSlice;
