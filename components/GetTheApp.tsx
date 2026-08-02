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
   * `list` — about-page rows.
   * `compact` — account section: one row of store chips.
   * `banner` — home strip with both store buttons.
   */
  variant?: "list" | "compact" | "banner";
};

function StoreChip({
  onPress,
  label,
  accessibilityLabel,
  icon,
  fill,
}: {
  onPress: () => void;
  label: string;
  accessibilityLabel: string;
  icon: React.ReactNode;
  /** Stretch to fill row (account compact). */
  fill?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.storeChip,
        fill && styles.storeChipFill,
        pressed && styles.storeChipPressed,
      ]}
      accessibilityRole="link"
      accessibilityLabel={accessibilityLabel}
    >
      {icon}
      <Text style={[styles.storeChipText, fill && styles.storeChipTextFill]}>
        {label}
      </Text>
    </Pressable>
  );
}

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
      <View style={styles.banner}>
        <View style={styles.bannerCopy}>
          <Text style={styles.bannerTitle}>Shop easier in the app</Text>
          <Text style={styles.bannerSub} numberOfLines={1}>
            Faster checkout · live order tracking
          </Text>
        </View>
        <View style={styles.bannerActions}>
          <StoreChip
            onPress={onIos}
            label="App Store"
            accessibilityLabel="Download on the App Store"
            icon={
              <Ionicons
                name="logo-apple"
                size={15}
                color={Colors.light.darkGreen}
              />
            }
          />
          <StoreChip
            onPress={onAndroid}
            label="Play"
            accessibilityLabel="Get it on Google Play"
            icon={
              <MaterialCommunityIcons
                name="google-play"
                size={15}
                color={Colors.light.darkGreen}
              />
            }
          />
        </View>
      </View>
    );
  }

  if (variant === "compact") {
    return (
      <View style={styles.compactRow}>
        <StoreChip
          fill
          onPress={onIos}
          label="iOS"
          accessibilityLabel="Download on the App Store"
          icon={
            <Ionicons
              name="logo-apple"
              size={18}
              color={Colors.light.gradientGreen_2}
            />
          }
        />
        <StoreChip
          fill
          onPress={onAndroid}
          label="Android"
          accessibilityLabel="Get it on Google Play"
          icon={
            <MaterialCommunityIcons
              name="google-play"
              size={18}
              color={Colors.light.gradientGreen_2}
            />
          }
        />
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
      ) : null}
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
  compactRow: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: 8,
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
  storeChipFill: {
    flex: 1,
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderColor: Colors.light.lightGrey,
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
  storeChipTextFill: {
    fontSize: 13,
    color: Colors.light.darkGrey,
    letterSpacing: 0.2,
  },
});
