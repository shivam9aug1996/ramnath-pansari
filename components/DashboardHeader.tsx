import { StyleSheet, TouchableOpacity, View } from "react-native";
import React, { memo } from "react";
import { Image } from "expo-image";

import { Colors } from "@/constants/Colors";
import { router } from "expo-router";
import AccountOption from "./AccountOption";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import TypewriterGreeting from "./TypewriterGreeting";

type DashboardHeaderProps = {
  userName?: string | null;
  profileImage?: string | null;
  onProfilePress?: () => void;
  isGuestUser?: boolean;
};

const DashboardHeader = ({
  userName,
  profileImage,
  onProfilePress,
  isGuestUser,
}: DashboardHeaderProps) => {
  return (
    <View style={styles.headerContainer}>
      {/* {true && (
          <WeatherEmojiOverlay />
        )} */}
      <View style={{ flex: 2 }}>
        {isGuestUser ? (
          <AccountOption
            onPress={() => {
              router.navigate("/login");
            }}
            icon={
              <MaterialCommunityIcons
                name="login"
                size={20}
                color={Colors.light.gradientGreen_2}
              />
            }
            label="Login/Signup"
          />
        ) : (
          <TypewriterGreeting
            userName={userName}
          />

        )}
      </View>
      <TouchableOpacity
        style={styles.avatarButton}
        onPress={onProfilePress}
      >
        <Image
          style={styles.avatar}
          contentFit="cover"
          source={{
            uri:
              profileImage ||
              "https://static.vecteezy.com/system/resources/previews/036/594/092/non_2x/man-empty-avatar-photo-placeholder-for-social-networks-resumes-forums-and-dating-sites-male-and-female-no-photo-images-for-unfilled-user-profile-free-vector.jpg",
          }}
        />
      </TouchableOpacity>
    </View>
  );
};

export default memo(DashboardHeader);

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  avatarButton: {
    flex: 1,
    alignItems: "flex-end",
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: Colors.light.lightGreen,
    backgroundColor: "#F8FAFC",
  },
});
