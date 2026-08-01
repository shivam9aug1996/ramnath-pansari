import React, { memo, useCallback } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
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
};

/**
 * Web-only prompt with App Store / Play Store download links.
 * Hidden on native (user is already in the app).
 */
function GetTheApp({ hideIntro = false }: Props) {
  const onIos = useCallback(() => {
    void openIosAppStore();
  }, []);

  const onAndroid = useCallback(() => {
    void openAndroidPlayStore();
  }, []);

  if (Platform.OS !== "web") {
    return null;
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
});
