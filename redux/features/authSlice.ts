import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  createApi,
  fakeBaseQuery,
} from "@reduxjs/toolkit/query/react";
import { baseUrl } from "../constants";
import { createApiBaseQuery } from "../createApiBaseQuery";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AuthData, SaveAuthDataPayload } from "@/types/global";
import { devError, devLog } from "@/utils/devLog";
import * as SecureStore from "expo-secure-store";
import { cartApi } from "./cartSlice";
import { CACHE_DURATION, cleanOldProductCache } from "@/utils/utils";
import { recentSearchApi } from "./recentSearchSlice";
import { orderApi } from "./orderSlice";
import { categoryApi } from "./categorySlice";
import { resetAppSync } from "./appSyncSlice";
import { clearRecentlyViewed } from "./recentlyViewedSlice";
import { storage } from "@/utils/storage";
import { StorageKeys } from "@/utils/storageKeys";

/** Shared guest session — used after logout and for guest login. */
export const GUEST_AUTH = {
  token: "guest_token",
  userData: {
    _id: "68561b44fcdf732b24588202",
    isGuestUser: true,
    mobileNumber: "9999999991",
    name: "Guest User",
  },
} as const;

export const saveAuthData = createAsyncThunk(
  "auth/saveAuthData",
  async (data: SaveAuthDataPayload, { rejectWithValue }) => {
    const { token, userData } = data;
    try {
     // await SecureStore.setItemAsync("token", token);
      await storage.setItem("token", token);
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
      // await AsyncStorage.removeItem('@carousel/config');

     //  await storage.clearAll();
      // await SecureStore.deleteItemAsync("lastSavedPushToken");
      // await SecureStore.deleteItemAsync("LOCATION_CACHE");
      // await SecureStore.deleteItemAsync("WEATHER_CACHE");
      // await SecureStore.deleteItemAsync("GREETING_CACHE_KEY");
      // const token = await AsyncStorage?.getItem("token");
      
      //const token = await SecureStore.getItemAsync("token");
      const token = await storage.getItem("token");
      
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
      dispatch(cartApi.util.resetApiState());
      dispatch(recentSearchApi.util.resetApiState());
      dispatch(orderApi.util.resetApiState());
      dispatch(categoryApi.util.resetApiState());
      dispatch(resetAppSync());
      dispatch(clearRecentlyViewed());

      // Wipe user session storage, then install guest auth before any screen
      // sees a null token. saveAuthData also triggers savePushToken1 via middleware.
      await storage.removeItem("token");
      await AsyncStorage?.clear();
      await dispatch(
        saveAuthData({
          token: GUEST_AUTH.token,
          userData: { ...GUEST_AUTH.userData },
        }) as any,
      ).unwrap();

      return {
        token: GUEST_AUTH.token,
        userData: { ...GUEST_AUTH.userData },
      };
    } catch (error) {
      devLog("[auth] clearAuthData fallback failed", error);
        try {
          await storage.removeItem("token");
          await AsyncStorage.clear();
        } catch (error) {
          devLog("[auth] clearAuthData fallback failed", error);
          // ignore
        }
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
     // const lastSavedToken = await SecureStore.getItemAsync("lastSavedPushToken");
     const lastSavedToken = await storage.getItem("lastSavedPushToken");
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
     // await SecureStore.setItemAsync("lastSavedPushToken", token);
      await storage.setItem("lastSavedPushToken", token);
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
    if (!authToken || authToken === "null") {
      return; // or return rejectWithValue("no auth token") if you want it visible in Redux
    }
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
      const { getAppCheckToken, APP_CHECK_HEADER } = await import(
        "@/utils/appCheck"
      );
      const appCheckToken = await getAppCheckToken();
      const response = await fetch(`${baseUrl}/save-push-token`, {
        method: "POST",
        body: JSON.stringify(body),
        headers: {
          authorization: `Bearer ${authToken}`,
          ...(appCheckToken ? { [APP_CHECK_HEADER]: appCheckToken } : {}),
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
  baseQuery: createApiBaseQuery(),
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
          return {
            data: {
              isGuestUser: true,
              message: "OTP successfully verified",
              token: GUEST_AUTH.token,
              userAlreadyRegistered: true,
              userData: { ...GUEST_AUTH.userData },
            },
          };
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
          devError("Update profile failed:", error);
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
          await AsyncStorage.setItem(
            "userData",
            JSON.stringify(data?.userData)
          );
          //dispatch(setUserData(data.userData));
          // Additional logic can be added here
        } catch (error) {
          devError("Update profile failed:", error);
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

export const logoutSession = createAsyncThunk(
  "auth/logoutSession",
  async (_: void, { dispatch, rejectWithValue }) => {
    try {
      await dispatch(authApi.endpoints.logout.initiate({})).unwrap();
    } catch (error) {
      devLog("[auth] logout API failed; clearing local session anyway", error);
    }

    try {
      await dispatch(clearAuthData()).unwrap();
    } catch (error) {
      return rejectWithValue(
        "error in logoutSession: " + JSON.stringify(error),
      );
    }
  },
);

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
    logoutSessionPending: false,
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
      .addCase(logoutSession.pending, (state) => {
        state.logoutSessionPending = true;
      })
      .addCase(logoutSession.fulfilled, (state) => {
        state.logoutSessionPending = false;
      })
      .addCase(logoutSession.rejected, (state) => {
        state.logoutSessionPending = false;
      });

    builder
      .addCase(clearAuthData.pending, (state) => {
        state.clearAuthData.isLoading = true;
        state.clearAuthData.isError = false;
        state.clearAuthData.error = null;
        state.clearAuthData.isSuccess = false;
      })
      .addCase(clearAuthData.fulfilled, (state, action) => {
        state.clearAuthData.isLoading = false;
        state.clearAuthData.isError = false;
        state.clearAuthData.data = action.payload;
        state.clearAuthData.isSuccess = true;
        // Guest session is ready — never leave a null-token gap for screens.
        state.token = action.payload.token;
        state.userData = action.payload.userData;
        state.successModalOnAccountCreation = false;
      })
      .addCase(clearAuthData.rejected, (state, action) => {
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
