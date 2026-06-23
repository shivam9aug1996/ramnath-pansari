import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Updates from "expo-updates";
import { Platform } from "react-native";

const PREFIX = "[startup-diag]";
const STARTUP_WINDOW_MS = 30_000;

const STORAGE = {
  installId: "@startup/installId",
  lastNativeVersion: "@startup/lastNativeVersion",
  lastRuntimeVersion: "@startup/lastRuntimeVersion",
  lastUpdateId: "@startup/lastUpdateId",
  lastCheckpoint: "@startup/lastCheckpoint",
  lastSessionId: "@startup/lastSessionId",
  lastSessionStartedAt: "@startup/lastSessionStartedAt",
  eventLog: "@startup/eventLog",
} as const;

const MAX_EVENTS = 80;

export type StartupCheckpoint =
  | "session:start"
  | "updates:checked"
  | "fonts_loaded"
  | "auth_loaded"
  | "route_decided"
  | "splash_hidden"
  | "home_mounted"
  | "startup_ready";

/** Higher rank = later in startup; never downgrade persisted checkpoint. */
const CHECKPOINT_RANK: Record<StartupCheckpoint, number> = {
  "session:start": 0,
  "updates:checked": 1,
  "fonts_loaded": 2,
  "auth_loaded": 3,
  "route_decided": 4,
  "splash_hidden": 5,
  "home_mounted": 6,
  "startup_ready": 7,
};

let persistedCheckpointRank = -1;

type StartupEvent = {
  ts: number;
  sessionId: string;
  checkpoint: StartupCheckpoint | string;
  payload?: Record<string, unknown>;
};

export type LaunchContext = {
  sessionId: string;
  installId: string;
  isFirstInstall: boolean;
  launchKind: "first_install" | "returning" | "store_update" | "ota_update";
  nativeVersion: string;
  nativeBuild: string;
  runtimeVersion: string | null;
  updateId: string | null;
  isEmbeddedLaunch: boolean | null;
  platform: string;
  deviceModel: string | null;
  previousSession?: {
    sessionId: string;
    lastCheckpoint: string;
    startedAt: number;
    likelyCrashed: boolean;
  };
};

let sessionId = "";
let sessionStartedAt = 0;
let launchContext: LaunchContext | null = null;
let startupFinalized = false;

function logLine(message: string, data?: Record<string, unknown>) {
  if (data) {
    console.log(PREFIX, message, data);
  } else {
    console.log(PREFIX, message);
  }
}

async function appendEvent(event: StartupEvent) {
  try {
    const raw = await AsyncStorage.getItem(STORAGE.eventLog);
    const events: StartupEvent[] = raw ? JSON.parse(raw) : [];
    events.push(event);
    await AsyncStorage.setItem(
      STORAGE.eventLog,
      JSON.stringify(events.slice(-MAX_EVENTS)),
    );
  } catch {
    // ignore storage failures
  }
}

export function isWithinStartupWindow() {
  return sessionStartedAt > 0 && Date.now() - sessionStartedAt < STARTUP_WINDOW_MS;
}

export function getLaunchContext() {
  return launchContext;
}

export async function initStartupDiagnostics(): Promise<LaunchContext> {
  const now = Date.now();
  sessionId = `${now}-${Math.random().toString(36).slice(2, 8)}`;
  sessionStartedAt = now;
  startupFinalized = false;
  persistedCheckpointRank = -1;

  const nativeVersion = Constants.nativeAppVersion ?? "unknown";
  const nativeBuild = Constants.nativeBuildVersion ?? "unknown";
  const runtimeVersion = Updates.runtimeVersion ?? null;
  const updateId = Updates.updateId ?? null;
  const isEmbeddedLaunch = Updates.isEmbeddedLaunch ?? null;

  let installId = await AsyncStorage.getItem(STORAGE.installId);
  const isFirstInstall = !installId;
  if (!installId) {
    installId = `install-${now}-${Math.random().toString(36).slice(2, 10)}`;
    await AsyncStorage.setItem(STORAGE.installId, installId);
  }

  const prevNative = await AsyncStorage.getItem(STORAGE.lastNativeVersion);
  const prevRuntime = await AsyncStorage.getItem(STORAGE.lastRuntimeVersion);
  const prevUpdateId = await AsyncStorage.getItem(STORAGE.lastUpdateId);
  const prevCheckpoint = await AsyncStorage.getItem(STORAGE.lastCheckpoint);
  const prevSessionId = await AsyncStorage.getItem(STORAGE.lastSessionId);
  const prevStartedAt = Number(
    (await AsyncStorage.getItem(STORAGE.lastSessionStartedAt)) ?? 0,
  );

  let launchKind: LaunchContext["launchKind"] = isFirstInstall
    ? "first_install"
    : "returning";

  if (!isFirstInstall && prevNative && prevNative !== nativeVersion) {
    launchKind = "store_update";
  } else if (
    !isFirstInstall &&
    updateId &&
    prevUpdateId &&
    prevUpdateId !== updateId
  ) {
    launchKind = "ota_update";
  } else if (
    !isFirstInstall &&
    runtimeVersion &&
    prevRuntime &&
    prevRuntime !== runtimeVersion
  ) {
    launchKind = "ota_update";
  }

  const previousSession =
    prevCheckpoint && prevCheckpoint !== "startup_ready"
      ? {
          sessionId: prevSessionId ?? "unknown",
          lastCheckpoint: prevCheckpoint,
          startedAt: prevStartedAt,
          likelyCrashed: true,
        }
      : undefined;

  launchContext = {
    sessionId,
    installId,
    isFirstInstall,
    launchKind,
    nativeVersion,
    nativeBuild,
    runtimeVersion,
    updateId,
    isEmbeddedLaunch,
    platform: Platform.OS,
    deviceModel: Device.modelName ?? null,
    previousSession,
  };

  logLine("launch_context", launchContext as unknown as Record<string, unknown>);

  if (previousSession) {
    logLine("previous_session_incomplete", {
      ...previousSession,
      launchKind,
      isFirstInstall,
    });
  }

  persistedCheckpointRank = CHECKPOINT_RANK["session:start"];

  await AsyncStorage.multiSet([
    [STORAGE.lastSessionId, sessionId],
    [STORAGE.lastSessionStartedAt, String(now)],
    [STORAGE.lastCheckpoint, "session:start"],
    [STORAGE.lastNativeVersion, nativeVersion],
    [STORAGE.lastRuntimeVersion, runtimeVersion ?? ""],
    [STORAGE.lastUpdateId, updateId ?? ""],
  ]);

  await appendEvent({
    ts: now,
    sessionId,
    checkpoint: "session:start",
    payload: { launchKind, isFirstInstall },
  });

  if (!__DEV__ && Updates.isEnabled) {
    try {
      const update = await Updates.checkForUpdateAsync();
      await markStartupCheckpoint("updates:checked", {
        isAvailable: update.isAvailable,
        isEmbeddedLaunch,
      });
    } catch (error) {
      await markStartupCheckpoint("updates:checked", {
        error: String(error),
        isEmbeddedLaunch,
      });
    }
  }

  return launchContext;
}

async function persistCheckpoint(checkpoint: StartupCheckpoint) {
  const rank = CHECKPOINT_RANK[checkpoint];
  if (rank <= persistedCheckpointRank) return;
  persistedCheckpointRank = rank;
  await AsyncStorage.setItem(STORAGE.lastCheckpoint, checkpoint);
}

export async function markStartupCheckpoint(
  checkpoint: StartupCheckpoint,
  payload?: Record<string, unknown>,
) {
  if (!sessionId) return;

  await persistCheckpoint(checkpoint);
  const event: StartupEvent = {
    ts: Date.now(),
    sessionId,
    checkpoint,
    payload,
  };
  logLine(checkpoint, {
    sessionId,
    launchKind: launchContext?.launchKind,
    isFirstInstall: launchContext?.isFirstInstall,
    ...payload,
  });
  await appendEvent(event);
}

export async function logStartupFetch(
  phase: "start" | "success" | "error" | "abort",
  meta: { url?: string; endpoint?: string; ms?: number; error?: string },
) {
  if (!sessionId || !isWithinStartupWindow()) return;

  logLine(`fetch:${phase}`, meta);
  await appendEvent({
    ts: Date.now(),
    sessionId,
    checkpoint: `fetch:${phase}`,
    payload: meta,
  });
}

export async function finalizeStartupReady(extra?: Record<string, unknown>) {
  if (startupFinalized) return;
  startupFinalized = true;
  await markStartupCheckpoint("startup_ready", extra);
}

export async function dumpStartupDiagnostics() {
  const raw = await AsyncStorage.getItem(STORAGE.eventLog);
  logLine("event_log_dump", { events: raw ? JSON.parse(raw) : [] });
}
