import React, { memo, useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/Colors";
import { useStoreConfig } from "@/hooks/useStoreConfig";
import { getHomeStoreStatus } from "@/utils/storeConfig";

/** Reserved feed slot height (padding + row). */
export const HOME_STORE_STATUS_HEIGHT = 52;

const HomeStoreStatus = () => {
  const storeConfig = useStoreConfig({ fetch: true });
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
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

  return (
    <View
      style={[
        styles.wrap,
        isAlert ? styles.wrapAlert : styles.wrapOpen,
        { borderColor: isAlert ? `${accent}33` : "rgba(27, 122, 78, 0.18)" },
      ]}
    >
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
  );
};

export default memo(HomeStoreStatus);

const styles = StyleSheet.create({
  wrap: {
    height: HOME_STORE_STATUS_HEIGHT,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  wrapOpen: {
    backgroundColor: "rgba(27, 122, 78, 0.06)",
  },
  wrapAlert: {
    backgroundColor: "#FFFBF5",
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
});
