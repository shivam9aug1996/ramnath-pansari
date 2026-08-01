import React, { memo, useCallback } from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import AccountOption from "@/components/AccountOption";
import { Colors } from "@/constants/Colors";
import {
  openAndroidPlayStore,
  openIosAppStore,
} from "@/utils/supportLinks";

type Props = {
  /** When true, skip the heading (parent already shows a section title). */
  hideIntro?: boolean;
  /**
   * `list` — account/about rows.
   * `banner` — compact home strip with both store buttons.
   */
  variant?: "list" | "banner";
};

/**
 * Web-only prompt with App Store / Play Store download links.
 * Hidden on native (user is already in the app).
 */
function GetTheApp({ hideIntro = false, variant = "list" }: Props) {
  const onIos = useCallback(() => {
    void openIosAppStore();
  }, []);

  const onAndroid = useCallback(() => {
    void openAndroidPlayStore();
  }, []);

  if (Platform.OS !== "web") {
    return null;
  }

  if (variant === "banner") {
    return (
      <View style={styles.banner} accessibilityRole="complementary">
        <View style={styles.bannerCopy}>
          <Text style={styles.bannerTitle}>Shop easier in the app</Text>
          <Text style={styles.bannerSub} numberOfLines={1}>
            Faster checkout · live order tracking
          </Text>
        </View>
        <View style={styles.bannerActions}>
          <Pressable
            onPress={onIos}
            style={({ pressed }) => [
              styles.storeChip,
              pressed && styles.storeChipPressed,
            ]}
            accessibilityRole="link"
            accessibilityLabel="Download on the App Store"
          >
            <Ionicons
              name="logo-apple"
              size={15}
              color={Colors.light.darkGreen}
            />
            <Text style={styles.storeChipText}>App Store</Text>
          </Pressable>
          <Pressable
            onPress={onAndroid}
            style={({ pressed }) => [
              styles.storeChip,
              pressed && styles.storeChipPressed,
            ]}
            accessibilityRole="link"
            accessibilityLabel="Get it on Google Play"
          >
            <MaterialCommunityIcons
              name="google-play"
              size={15}
              color={Colors.light.darkGreen}
            />
            <Text style={styles.storeChipText}>Play</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      {!hideIntro ? (
        <>
          <Text style={styles.heading}>Get the app</Text>
          <Text style={styles.sub}>
            For the best experience on your phone, download Ramnath Pansari.
          </Text>
        </>
      ) : (
        <Text style={styles.sub}>
          Best experience on your phone — download the app.
        </Text>
      )}
      <AccountOption
        onPress={onIos}
        icon={
          <Ionicons
            name="logo-apple"
            size={20}
            color={Colors.light.gradientGreen_2}
          />
        }
        label="Download for iOS"
      />
      <AccountOption
        onPress={onAndroid}
        icon={
          <MaterialCommunityIcons
            name="google-play"
            size={20}
            color={Colors.light.gradientGreen_2}
          />
        }
        label="Download for Android"
      />
    </View>
  );
}

export default memo(GetTheApp);

const styles = StyleSheet.create({
  wrap: {
    gap: 4,
  },
  heading: {
    fontFamily: "Montserrat_700Bold",
    fontSize: 15,
    color: Colors.light.darkGrey,
    letterSpacing: 0.2,
    marginBottom: 4,
    marginTop: 8,
  },
  sub: {
    fontFamily: "Raleway_500Medium",
    fontSize: 13,
    color: Colors.light.mediumGrey,
    lineHeight: 18,
    marginBottom: 8,
  },
  banner: {
    marginHorizontal: 16,
    marginTop: 4,
    marginBottom: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 18,
    backgroundColor: Colors.light.softGreen,
    borderWidth: 1,
    borderColor: "rgba(44, 175, 127, 0.18)",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  bannerCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  bannerTitle: {
    fontFamily: "Montserrat_700Bold",
    fontSize: 13,
    color: Colors.light.darkGreen,
    letterSpacing: 0.1,
  },
  bannerSub: {
    fontFamily: "Raleway_500Medium",
    fontSize: 11.5,
    color: Colors.light.mediumGrey,
    letterSpacing: 0.1,
  },
  bannerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexShrink: 0,
  },
  storeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 7,
    paddingHorizontal: 9,
    borderRadius: 999,
    backgroundColor: Colors.light.white,
    borderWidth: 1,
    borderColor: "rgba(25, 75, 56, 0.12)",
  },
  storeChipPressed: {
    backgroundColor: "rgba(44, 175, 127, 0.12)",
    borderColor: "rgba(44, 175, 127, 0.28)",
  },
  storeChipText: {
    fontFamily: "Raleway_600SemiBold",
    fontSize: 11,
    color: Colors.light.darkGreen,
  },
});
