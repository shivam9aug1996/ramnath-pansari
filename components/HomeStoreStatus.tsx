import React, { memo, useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/Colors";
import { useStoreConfig } from "@/hooks/useStoreConfig";
import { getHomeStoreStatus } from "@/utils/storeConfig";

/** Reserved feed slot height (padding + row + progress). */
export const HOME_STORE_STATUS_HEIGHT = 62;

const HomeStoreStatus = () => {
  const storeConfig = useStoreConfig({ fetch: true });
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  const status = useMemo(
    () => getHomeStoreStatus(storeConfig, now),
    [
      storeConfig.acceptingOrders,
      storeConfig.storeHours.openTime,
      storeConfig.storeHours.closeTime,
      storeConfig.storeHours.timezone,
      now,
    ],
  );

  const isAlert = status.kind !== "open";
  const accent =
    status.kind === "open"
      ? "#1B7A4E"
      : status.kind === "paused"
        ? Colors.light.lightRed
        : "#B45309";
  const iconName =
    status.kind === "open"
      ? "checkmark-circle"
      : status.kind === "paused"
        ? "pause-circle"
        : "time";

  const showProgress = status.progress != null;
  // Last ~15% of the open window — almost closing.
  const progressAccent =
    status.kind === "open" && (status.progress ?? 0) >= 0.85
      ? "#B45309"
      : accent;

  return (
    <View
      style={[
        styles.wrap,
        isAlert ? styles.wrapAlert : styles.wrapOpen,
        { borderColor: isAlert ? `${accent}33` : "rgba(27, 122, 78, 0.18)" },
      ]}
    >
      <View style={styles.row}>
        <View style={[styles.iconWrap, { backgroundColor: `${accent}14` }]}>
          <Ionicons name={iconName} size={18} color={accent} />
        </View>
        <View style={styles.copy}>
          <Text style={[styles.title, { color: accent }]} numberOfLines={1}>
            {status.title}
          </Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            {status.subtitle}
          </Text>
        </View>
      </View>

      {showProgress ? (
        <View
          style={[styles.track, { backgroundColor: `${progressAccent}18` }]}
          accessibilityRole="progressbar"
          accessibilityValue={{
            min: 0,
            max: 100,
            now: Math.round((status.progress ?? 0) * 100),
            text: status.remainingLabel ?? undefined,
          }}
        >
          <View
            style={[
              styles.fill,
              {
                width: `${Math.round((status.progress ?? 0) * 100)}%`,
                backgroundColor: progressAccent,
              },
            ]}
          />
        </View>
      ) : null}
    </View>
  );
};

export default memo(HomeStoreStatus);

const styles = StyleSheet.create({
  wrap: {
    minHeight: HOME_STORE_STATUS_HEIGHT,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 16,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  wrapOpen: {
    backgroundColor: "rgba(27, 122, 78, 0.06)",
  },
  wrapAlert: {
    backgroundColor: "#FFFBF5",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  copy: {
    flex: 1,
    gap: 1,
  },
  title: {
    fontFamily: "Raleway_700Bold",
    fontSize: 13,
  },
  subtitle: {
    fontFamily: "Montserrat_500Medium",
    fontSize: 12,
    color: Colors.light.mediumGrey,
  },
  track: {
    height: 4,
    borderRadius: 999,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: 999,
  },
});
