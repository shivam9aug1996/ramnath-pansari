import { createSlice } from "@reduxjs/toolkit";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { baseUrl } from "../constants";



const weatherSlice = createSlice({
  name: "weatherSlice",
  initialState: {
    weather: null,
    hour: null,
    loading: false,
    error: null,
  },
  reducers: {
    setWeather: (state, action) => {
      state.weather = action.payload;
    },
    setHour: (state, action) => {
      state.hour = action.payload;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
  },
  extraReducers: (builder) => {},
});

export const { setWeather, setHour, setLoading, setError } = weatherSlice.actions;



export default weatherSlice.reducer;
