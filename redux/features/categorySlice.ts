import { createSlice } from "@reduxjs/toolkit";
import { createApi } from "@reduxjs/toolkit/query/react";
import { baseUrl } from "../constants";
import { createApiBaseQuery } from "../createApiBaseQuery";

export const categoryApi = createApi({
  reducerPath: "categoryApi",
  baseQuery: createApiBaseQuery(),
   keepUnusedDataFor: 60,
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
