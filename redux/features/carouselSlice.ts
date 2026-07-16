import { createSlice } from "@reduxjs/toolkit";
import { createApi } from "@reduxjs/toolkit/query/react";
import { baseUrl } from "../constants";
import { createApiBaseQuery } from "../createApiBaseQuery";
import { CarouselResponse } from "@/types/global";

export const carouselApi = createApi({
  reducerPath: "carouselApi",
  baseQuery: createApiBaseQuery(),
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
