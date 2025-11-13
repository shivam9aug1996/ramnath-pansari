import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import React, { memo } from "react";

import { Colors } from "@/constants/Colors";
import { Link, router } from "expo-router";
import AccountOption from "./AccountOption";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import WeatherEmojiOverlay from "./WeatherEmojiOverlay";

const DashboardHeader = ({ userName, profileImage, onProfilePress,isGuestUser }) => {


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
  <Text style={styles.greetingText}>
    {`Hey1 ${userName} garg `}
  </Text>
)}


      </View>
      <TouchableOpacity
        style={{ flex: 1, alignItems: "flex-end" }}
        onPress={onProfilePress}
      >
        <Image
        style={{
          borderWidth:1,
          borderColor: Colors.light.lightGreen
        }}
          borderRadius={25}
          width={50}
          height={50}
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
  greetingText: {
    fontFamily: "Raleway_800ExtraBold",
    fontSize: 22,
    color: Colors.light.darkGreen,
    marginBottom: 3,
  },
  loginWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: "#D1D5DB", // subtle gray border
    alignSelf: "flex-start",
  },
  
  loginIcon: {
    width: 20,
    height: 20,
    marginRight: 8,
    tintColor: Colors.light.darkGreen,
  },
  
  loginText: {
    fontSize: 16,
    fontFamily: "Raleway_600SemiBold",
    color: Colors.light.darkGreen,
  }
  
  
});
