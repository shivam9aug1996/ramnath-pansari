import { useEffect, useRef } from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router, type ErrorBoundaryProps } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "@/constants/Colors";
import { captureException } from "@/utils/sentry";
import { fonts } from "@/constants/Fonts";
import useNetworkStatus from "@/hooks/useNetworkStatus";

export function isChunkLoadError(error: Error): boolean {
  const name = error?.name ?? "";
  const message = error?.message ?? "";
  return (
    name === "AsyncRequireError" ||
    message.includes("AsyncRequireError") ||
    message.includes("Loading module") ||
    message.includes("Failed to fetch dynamically imported module") ||
    message.includes("Importing a module script failed")
  );
}

function navigateSomewhereSafe() {
  if (router.canGoBack()) {
    router.back();
    return;
  }
  router.replace("/");
}

export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  const chunkLoad = isChunkLoadError(error);
  const { isConnected, isInternetReachable } = useNetworkStatus();
  const wasOffline = useRef(false);
  const reported = useRef(false);

  const offline =
    isConnected === false ||
    isInternetReachable === false ||
    (Platform.OS === "web" &&
      typeof navigator !== "undefined" &&
      navigator.onLine === false);

  useEffect(() => {
    if (reported.current) return;
    reported.current = true;
    captureException(error, {
      tags: {
        routeErrorBoundary: "true",
        chunkLoadError: chunkLoad ? "true" : "false",
      },
    });
  }, [error, chunkLoad]);

  useEffect(() => {
    if (!chunkLoad) return;

    if (offline) {
      wasOffline.current = true;
      return;
    }

    if (wasOffline.current) {
      wasOffline.current = false;
      void retry();
    }
  }, [chunkLoad, offline, retry]);

  const handleGoBack = async () => {
    navigateSomewhereSafe();
    await retry();
  };

  const handleRetry = () => {
    void retry();
  };

  const title = chunkLoad
    ? offline
      ? "You're offline"
      : "Couldn't load this page"
    : "Something went wrong";

  const description = chunkLoad
    ? offline
      ? "Check your connection, then try again. Or go back to the previous screen."
      : "This page failed to load. Go back, or retry once you're online."
    : error.message;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>

        <View style={styles.actions}>
          {/* {chunkLoad ? (
            <Pressable
              accessibilityRole="button"
              onPress={handleGoBack}
              style={({ pressed }) => [
                styles.secondaryButton,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.secondaryButtonText}>Go back</Text>
            </Pressable>
          ) : null} */}

          <Pressable
            accessibilityRole="button"
            onPress={handleRetry}
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.primaryButtonText}>Retry</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  container: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 28,
    maxWidth: 420,
    width: "100%",
    alignSelf: "center",
    gap: 12,
  },
  title: {
    color: Colors.light.title,
    fontFamily: fonts.defaultBold.fontFamily,
    fontSize: 26,
  },
  description: {
    color: Colors.light.mediumGrey,
    fontFamily: fonts.defaultMedium.fontFamily,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 12,
  },
  actions: {
    gap: 10,
  },
  primaryButton: {
    backgroundColor: Colors.light.darkGreen,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  primaryButtonText: {
    color: Colors.light.white,
    fontFamily: fonts.defaultSemiBold.fontFamily,
    fontSize: 16,
  },
  secondaryButton: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.lightGrey,
    paddingVertical: 14,
    alignItems: "center",
    backgroundColor: Colors.light.softGrey_2,
  },
  secondaryButtonText: {
    color: Colors.light.darkGreen,
    fontFamily: fonts.defaultSemiBold.fontFamily,
    fontSize: 16,
  },
  pressed: {
    opacity: 0.85,
  },
});
