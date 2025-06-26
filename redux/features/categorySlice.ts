import { createSlice } from "@reduxjs/toolkit";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { baseUrl } from "../constants";

export const categoryApi = createApi({
  reducerPath: "categoryApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${baseUrl}`,
    prepareHeaders: (headers, api) => {
      const token = api?.getState()?.auth?.token;
      if (token) {
       // console.log("kiop");
        headers.set("authorization", `Bearer ${token}`);
      }
      return headers;
    },
    credentials: "include",
  }),
  // keepUnusedDataFor: 0,
  refetchOnReconnect: true,
  endpoints: (builder) => ({
    fetchCategories: builder.query({
      query: (data) => ({
        url: "/category",
        method: "GET",
        params: data,
      }),
    }),
  }),
});

const categorySlice = createSlice({
  name: "categorySlice",
  initialState: {
    subCategoryActionClicked:false,
    catgeoryData: undefined
  },
  reducers: {
    setSubCategoryActionClicked: (state, action) => {
      state.subCategoryActionClicked = action.payload;
    },
    setCategoryData: (state, action) => {
      state.catgeoryData = action.payload;
    },
  },
  extraReducers: (builder) => {},
});

export const { setSubCategoryActionClicked,setCategoryData } = categorySlice.actions;
export const { useFetchCategoriesQuery } = categoryApi;

export default categorySlice.reducer;
