import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  createApi,
  fetchBaseQuery,
  fakeBaseQuery,
} from "@reduxjs/toolkit/query/react";
import { baseUrl } from "../constants";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AuthData, SaveAuthDataPayload } from "@/types/global";
import * as SecureStore from "expo-secure-store";
import { cartApi } from "./cartSlice";
import { CACHE_DURATION, cleanOldProductCache } from "@/utils/utils";

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
      await SecureStore.setItemAsync("token", token);
      // await AsyncStorage.setItem("token", token);
      await AsyncStorage.setItem("userData", JSON.stringify(userData));
      return { token, userData };
    } catch (error) {
      return rejectWithValue("error in saveAuthData: " + JSON.stringify(error));
    }
  }
);

export const loadAuthData = createAsyncThunk(
  "auth/loadAuthData",
  async (_, {dispatch, rejectWithValue }) => {
    try {
      // await new Promise((res) => {
      //   setTimeout(() => {
      //     res("hi");
      //   }, 1000);
      // });
      // 9887765432
      // await AsyncStorage.clear();
      // await SecureStore.deleteItemAsync("lastSavedPushToken");
      // await SecureStore.deleteItemAsync("LOCATION_CACHE");
      // await SecureStore.deleteItemAsync("WEATHER_CACHE");
      // await SecureStore.deleteItemAsync("GREETING_CACHE_KEY");
      // const token = await AsyncStorage?.getItem("token");
      
      const token = await SecureStore.getItemAsync("token");
      
      let userData = await AsyncStorage?.getItem("userData");
      await cleanOldProductCache(CACHE_DURATION);
      
      userData = userData ? JSON.parse(userData) : null;
  
      
      // if (userData?.isGuestUser) {
      //   await SecureStore.deleteItemAsync("token");
      //   await AsyncStorage?.clear();
      //   await AsyncStorage.removeItem("recentlyViewedItems");
      //   return { token: null, userData: null };
      // }
      return { token, userData };
    } catch (error) {
      return rejectWithValue("error in loadAuthData: " + JSON.stringify(error));
    }
  }
);

export const clearAuthData = createAsyncThunk(
  "auth/clearAuthData",
  async (_, { rejectWithValue, dispatch }) => {
    try {
      // await new Promise((res) => {
      //   setTimeout(() => {
      //     res("hi");
      //   }, 1000);
      // });
      await dispatch(savePushToken1({
        isGuestUser:  true,
        _id : "68561b44fcdf732b24588202" 
      }) as any);
      await SecureStore.deleteItemAsync("token");
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

export const loadPushToken = createAsyncThunk(
  "auth/loadPushToken",
  async (_, { rejectWithValue }) => {
    try {
      // use secure store to get the last saved push token
      const lastSavedToken = await SecureStore.getItemAsync("lastSavedPushToken");
      return lastSavedToken === null ? "loaded" : lastSavedToken;
    } catch (error) {
      return rejectWithValue("error in loadPushToken: " + JSON.stringify(error));
    }
  }
);

export const savePushTokenToStorage = createAsyncThunk(
  "auth/savePushTokenToStorage",
  async (token: string, { rejectWithValue }) => {
    try {
      await SecureStore.setItemAsync("lastSavedPushToken", token);
      return token;
    } catch (error) {
      return rejectWithValue("error in savePushTokenToStorage: " + JSON.stringify(error));
    }
  }
);


// create a thunk to call the api to save the push token
export const savePushToken1 = createAsyncThunk(
  "auth/savePushToken1",
  async (data, { rejectWithValue, getState }) => {
    // get darta from state
    const token = getState()?.auth?.lastSavedPushToken;
    const authToken = getState()?.auth?.token;
    const userData = getState()?.auth?.userData;
    const isGuestUser = data?.isGuestUser || userData?.isGuestUser;
    const isAdminUser = userData?.isAdminUser;
    const userId = data?._id || userData?._id;
    try {
      const body = isGuestUser
          ? {
              token,
              userId,
              isGuestUser: true,
            }
          : isAdminUser
          ? {
              token,
              userId,
              isAdminUser: true,
            }
          : {
              token,
              userId,
            };
            console.log("body4556789067890-67890", body);
      const response = await fetch(`${baseUrl}/save-push-token`, {
        method: "POST",
        body: JSON.stringify(body),
        headers: {
          authorization: `Bearer ${authToken}`,
        }
      });
      //await new Promise((resolve) => setTimeout(resolve, 5000));
      if (!response.ok) {
        throw new Error("Failed to save push token");
      }
      return response.json();
    } catch (error) {
      return rejectWithValue("error in savePushToken: " + JSON.stringify(error));
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
      queryFn: async (data, api, extraOptions, baseQuery) => {
       // console.log("FGHJIEWERTYU", data);
        // Check if isGuestUser is true
        if (data.isGuestUser) {
          // Mock response for guest user
          // await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay
          const mockResponse = {
            data: {
              isGuestUser: true,
              message: "OTP successfully verified",
              token:
                "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4NTYxYjQ0ZmNkZjczMmIyNDU4ODIwMiIsIm1vYmlsZU51bWJlciI6Ijk5OTk5OTk5OTEiLCJpc0d1ZXN0VXNlciI6dHJ1ZSwiaWF0IjoxNzUwNTE0NTQ4fQ.y4PIyRN1zgEY8sOOl6m2OTFYMw45sRdcbWjAsbs-tpQ",
              userAlreadyRegistered: true,
              userData: {
                _id: "68561b44fcdf732b24588202",
                isGuestUser: true,
                mobileNumber: "9999999991",
                name: "Guest User",
              },
            },
          };

          return { data: mockResponse.data };
        } else {
          // Use real API for non-guest users
          return baseQuery({
            url: "/auth/verifyOtp",
            method: "POST",
            body: data,
          });
        }
      },
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
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }),
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          //console.log("jhgfdfghjk", data);
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
          console.log("jhgfdf67890ghjk", data);
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
    deleteAccount: builder.mutation({
      query: (data) => ({
        url: "/profile",
        method: "DELETE",
        params: data,
      }),
    }),
    savePushToken: builder.mutation({
      query: (data) => ({
        url: "/save-push-token",
        method: "POST",
        body: data,
      }),
    }),
  }),
});

const authSlice = createSlice({
  name: "authSlice",
  initialState: {
    token: null,
    userData: null,
    lastSavedPushToken: null, // Add this new field
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
    setLastSavedPushToken: (state, action) => {
      state.lastSavedPushToken = action.payload;
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
        //console.log("iuytrtyuio");
        state.clearAuthData.isLoading = false;
        state.clearAuthData.isError = false;
        state.clearAuthData.data = null;
        state.clearAuthData.isSuccess = true;
        state.token = null;
        state.userData = null;
        state.successModalOnAccountCreation = false;
      })
      .addCase(clearAuthData.rejected, (state, action) => {
        // console.log("kiooooo");
        state.clearAuthData.isLoading = false;
        state.clearAuthData.isError = true;
        state.clearAuthData.error = action.payload || "";
        state.clearAuthData.isSuccess = false;
        state.token = null;
        state.userData = null;
        state.successModalOnAccountCreation = false;
      });
      builder
      .addCase(loadPushToken.fulfilled, (state, action) => {
        state.lastSavedPushToken = action.payload;
      })
      .addCase(savePushTokenToStorage.fulfilled, (state, action) => {
        state.lastSavedPushToken = action.payload;
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
  useDeleteAccountMutation,
  useSavePushTokenMutation,
} = authApi;

export const { setAuth, setLastSavedPushToken } = authSlice.actions;

export default authSlice.reducer;
