import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { AppSyncFetchFlags } from "@/types/global";

export type AppSyncSliceState = {
  ready: boolean;
  localHydrated: boolean;
  inProgress: boolean;
  lastSyncedAt: number | null;
  fetch: AppSyncFetchFlags | null;
};

const initialState: AppSyncSliceState = {
  ready: false,
  localHydrated: false,
  inProgress: false,
  lastSyncedAt: null,
  fetch: null,
};

const appSyncSlice = createSlice({
  name: "appSync",
  initialState,
  reducers: {
    setSyncStarted: (state) => {
      state.inProgress = true;
    },
    setLocalHydrated: (state) => {
      state.localHydrated = true;
    },
    setSyncComplete: (
      state,
      action: PayloadAction<{
        fetch: AppSyncFetchFlags;
      }>,
    ) => {
      state.ready = true;
      state.localHydrated = true;
      state.inProgress = false;
      state.lastSyncedAt = Date.now();
      state.fetch = action.payload.fetch;
    },
    resetAppSync: () => initialState,
  },
});

export const { setSyncStarted, setLocalHydrated, setSyncComplete, resetAppSync } =
  appSyncSlice.actions;

export default appSyncSlice.reducer;
