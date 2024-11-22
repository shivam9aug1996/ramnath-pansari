import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { baseUrl } from "../constants";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AuthData, SaveAuthDataPayload } from "@/types/global";
import { Toast } from "react-native-toast-notifications";

// const saveAuthDataToAsyncStorage = async (token: any, userData: any) => {
//   try {
//     await AsyncStorage.setItem("token", token);
//     await AsyncStorage.setItem("userData", JSON.stringify(userData));
//   } catch (e) {
//     console.error("Failed to save auth data to AsyncStorage", e);
//   }
// };

export const saveAuthData = createAsyncThunk(
  "auth/saveAuthData",
  async (data: SaveAuthDataPayload, { rejectWithValue }) => {
    const { token, userData } = data;
    try {
      await AsyncStorage.setItem("token", token);
      await AsyncStorage.setItem("userData", JSON.stringify(userData));
      return { token, userData };
    } catch (error) {
      return rejectWithValue("error in saveAuthData: " + JSON.stringify(error));
    }
  }
);

export const loadAuthData = createAsyncThunk(
  "auth/loadAuthData",
  async (_, { rejectWithValue }) => {
    try {
      await new Promise((res) => {
        setTimeout(() => {
          res("hi");
        }, 1000);
      });
      // 9887765432
      //await AsyncStorage.clear();
      const token = await AsyncStorage?.getItem("token");
      let userData = await AsyncStorage?.getItem("userData");
      userData = userData ? JSON.parse(userData) : null;
      return { token, userData };
    } catch (error) {
      return rejectWithValue("error in loadAuthData: " + JSON.stringify(error));
    }
  }
);

export const clearAuthData = createAsyncThunk(
  "auth/clearAuthData",
  async (_, { rejectWithValue }) => {
    try {
      await new Promise((res) => {
        setTimeout(() => {
          res("hi");
        }, 1000);
      });

      await AsyncStorage?.clear();
      const token = null;
      let userData = null;
      return { token, userData };
    } catch (error) {
      return rejectWithValue(
        "error in clearAuthData: " + JSON.stringify(error)
      );
    }
  }
);

export const authApi = createApi({
  reducerPath: "authApi",
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
  endpoints: (builder) => ({
    sendOtp: builder.mutation({
      query: (data) => ({
        url: "/auth/sendOtp",
        method: "POST",
        body: data,
      }),
    }),
    verifyOtp: builder.mutation({
      query: (data) => ({
        url: "/auth/verifyOtp",
        method: "POST",
        body: data,
      }),
    }),
    privateData: builder.mutation({
      query: (data) => ({
        url: "/private",
        method: "POST",
        body: {},
      }),
    }),
    logout: builder.mutation({
      query: (data) => ({
        url: "/logout",
        method: "POST",
        body: {},
      }),
    }),
    updateProfile: builder.mutation({
      query: (data) => ({
        url: "/profile",
        method: "PUT",
        body: data,
      }),
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          console.log("jhgfdfghjk", data);
          await AsyncStorage.setItem(
            "userData",
            JSON.stringify(data?.userData)
          );
          //dispatch(setUserData(data.userData));
          // Additional logic can be added here
        } catch (error) {
          console.error("Update profile failed:", error);
          // Handle the error if needed
        }
      },
    }),
    fetchProfile: builder.query({
      query: (data) => ({
        url: "/profile",
        method: "GET",
        params: data,
      }),
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          console.log("jhgfdfghjk", data);
          await AsyncStorage.setItem(
            "userData",
            JSON.stringify(data?.userData)
          );
          //dispatch(setUserData(data.userData));
          // Additional logic can be added here
        } catch (error) {
          console.error("Update profile failed:", error);
          // Handle the error if needed
        }
      },
    }),
  }),
});

const authSlice = createSlice({
  name: "authSlice",
  initialState: {
    token: null,
    userData: null,
    saveAuthData: {
      data: null,
      isLoading: false,
      isError: false,
      error: null,
      isSuccess: false,
    },
    loadAuthData: {
      data: null,
      isLoading: false,
      isError: false,
      error: null,
      isSuccess: false,
    },
    clearAuthData: {
      data: null,
      isLoading: false,
      isError: false,
      error: null,
      isSuccess: false,
    },
    successModalOnAccountCreation: false,
    userAlreadyRegistered: false,
  },
  reducers: {
    setAuth: (state, action) => {
      if (action?.payload?.userData) {
        state.userData = JSON.parse(action?.payload?.userData);
        state.token = action?.payload?.token;
      } else {
        state.userData = null;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(saveAuthData.pending, (state) => {
        state.saveAuthData.isLoading = true;
        state.saveAuthData.isError = false;
        state.saveAuthData.error = null;
        state.saveAuthData.isSuccess = false;
      })
      .addCase(saveAuthData.fulfilled, (state, action) => {
        state.saveAuthData.isLoading = false;
        state.saveAuthData.isError = false;
        state.saveAuthData.data = action.payload;
        state.token = action.payload.token;
        state.userData = action.payload.userData;
        state.saveAuthData.isSuccess = true;
      })
      .addCase(saveAuthData.rejected, (state, action) => {
        state.saveAuthData.isLoading = false;
        state.saveAuthData.isError = true;
        state.saveAuthData.error = action.payload;
        state.saveAuthData.isSuccess = false;
      });

    builder
      .addCase(loadAuthData.pending, (state) => {
        state.loadAuthData.isLoading = true;
        state.loadAuthData.isError = false;
        state.loadAuthData.error = null;
        state.loadAuthData.isSuccess = false;
      })
      .addCase(loadAuthData.fulfilled, (state, action) => {
        state.loadAuthData.isLoading = false;
        state.loadAuthData.isError = false;
        state.loadAuthData.data = action.payload;
        state.loadAuthData.isSuccess = true;
        state.token = action.payload.token;
        state.userData = action.payload.userData;
      })
      .addCase(loadAuthData.rejected, (state, action) => {
        state.loadAuthData.isLoading = false;
        state.loadAuthData.isError = true;
        state.loadAuthData.error = action.payload;
        state.loadAuthData.isSuccess = false;
      });

    builder
      .addCase(clearAuthData.pending, (state) => {
        state.clearAuthData.isLoading = true;
        state.clearAuthData.isError = false;
        state.clearAuthData.error = null;
        state.clearAuthData.isSuccess = false;
      })
      .addCase(clearAuthData.fulfilled, (state, action) => {
        console.log("iuytrtyuio");
        state.clearAuthData.isLoading = false;
        state.clearAuthData.isError = false;
        state.clearAuthData.data = null;
        state.clearAuthData.isSuccess = true;
        state.token = null;
        state.userData = null;
        state.successModalOnAccountCreation = false;
      })
      .addCase(clearAuthData.rejected, (state, action) => {
        console.log("kiooooo");
        state.clearAuthData.isLoading = false;
        state.clearAuthData.isError = true;
        state.clearAuthData.error = action.payload || "";
        state.clearAuthData.isSuccess = false;
        state.token = null;
        state.userData = null;
        state.successModalOnAccountCreation = false;
      });
    builder.addMatcher(
      authApi.endpoints.updateProfile.matchFulfilled,
      (state, action) => {
        state.userData = action.payload?.userData;
      }
    );

    // builder.addMatcher(
    //   authApi.endpoints.logout.matchFulfilled,
    //   (state, action) => {
    //     state.token = "888888";
    //     state.userData = null;
    //   }
    // );

    // builder.addCase(loadAuthData.pending, (state) => {
    //   state.saveAuthData.saveStatus = "loading";
    // });
    // builder.addCase(loadAuthData.fulfilled, (state) => {
    //   state.saveAuthData.saveStatus = "succeeded";
    // });
    // builder.addCase(loadAuthData.rejected, (state, action) => {
    //   state.saveAuthData.saveStatus = "failed";
    //   console.error("Failed to save auth data:", action.error);
    // });
    // builder.addMatcher(
    //   authApi.endpoints.verifyOtp.matchFulfilled,
    //   (state, action) => {
    //     state.token = action.payload?.token || null;
    //     state.userData = action.payload?.userData || null;
    //   }
    // );

    // builder.addMatcher(
    //   saveAuthData.fulfilled, // Handle the fulfilled action of saveAuthData
    //   (state, action) => {
    //     // state.token = action.payload.token;
    //     // state.userData = action.payload.userData;
    //     state.saveAuthData.saveStatus = "succeeded";
    //   }
    // );
    // builder.addMatcher(
    //   saveAuthData.pending, // Handle the pending action of saveAuthData (optional)
    //   (state) => {
    //     state.saveAuthData.saveStatus = "loading";
    //   }
    // );
    // builder.addMatcher(
    //   saveAuthData.rejected, // Handle the rejected action of saveAuthData (optional)
    //   (state) => {
    //     console.log("hii87654reghjk");
    //     state.saveAuthData.saveStatus = "failed";
    //   }
    // );
  },
});

export const {
  useSendOtpMutation,
  useVerifyOtpMutation,
  usePrivateDataMutation,
  useLogoutMutation,
  useUpdateProfileMutation,
  useLazyFetchProfileQuery,
} = authApi;

export const { setAuth } = authSlice.actions;

export default authSlice.reducer;