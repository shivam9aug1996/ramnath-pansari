import { createSlice } from "@reduxjs/toolkit";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { baseUrl } from "../constants";

export const addressApi = createApi({
  reducerPath: "addressApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${baseUrl}`,
    prepareHeaders: (headers, api) => {
      const token = api?.getState()?.auth?.token;
      if (token) {
        
        headers.set("authorization", `Bearer ${token}`);
      }
      return headers;
    },
    credentials: "include",
  }),
  tagTypes: ["addressList"],
  //keepUnusedDataFor: 0,
  // keepUnusedDataFor: 50,
  endpoints: (builder) => ({
    fetchGeocoding: builder.query({
      query: (data) => ({
        url: "/address/geocoding",
        method: "GET",
        params: data,
      }),

      //providesTags: ["addressList"],
    }),
    createAddress: builder.mutation({
      query: (data) => ({
        url: "/address",
        method: "POST",
        body: data?.body,
      }),
      // invalidatesTags: ["addressList"],
    }),
    fetchAddress: builder.query({
      query: (data) => ({
        url: "/address",
        method: "GET",
        params: data,
      }),
      keepUnusedDataFor: 3600,
      transformResponse: (response: any[]) => {
        // Sort the addresses by timestamp, latest first
        return response?.sort(
          (a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
      },
      providesTags: ["addressList"],
    }),
    updateAddress: builder.mutation({
      query: (data) => ({
        url: "/address",
        method: "PUT",
        body: data?.body,
      }),
      // invalidatesTags: ["addressList"],
    }),
    deleteAddress: builder.mutation({
      query: (data) => ({
        url: "/address",
        method: "DELETE",
        params: data,
      }),
      //invalidatesTags: ["addressList"],
    }),
  }),
});

const addressSlice = createSlice({
  name: "addressSlice",
  initialState: {
    cartButtonProductId: [],
    cartState: [],
    cartFetching: false,
    currentAddressData: {
      action: "",
      form: null,
      initialForm: null,
    },
  },
  reducers: {
    setCurrentAddressData: (state, action) => {
      if (action?.payload) {
        state.currentAddressData = action.payload;
      }
    },
  },
  extraReducers: (builder) => {},
});

export const { setCurrentAddressData } = addressSlice.actions;

export const {
  useLazyFetchGeocodingQuery,
  useCreateAddressMutation,
  useFetchAddressQuery,
  useUpdateAddressMutation,
  useDeleteAddressMutation,
  useLazyFetchAddressQuery,
} = addressApi;

export default addressSlice.reducer;
