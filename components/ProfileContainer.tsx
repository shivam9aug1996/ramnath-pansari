import { StyleSheet, Text, View } from "react-native";
import React from "react";
import { TextStyle } from "react-native";
import { ViewStyle } from "react-native";
import { Colors } from "@/constants/Colors";
import { Image } from "expo-image";

const ProfileContainer = ({ userInfo }) => {
  return (
    <View style={styles.profileContainer}>
      <Image
        source={{
          uri:
            userInfo?.profileImage ||
            "https://static.vecteezy.com/system/resources/previews/036/594/092/non_2x/man-empty-avatar-photo-placeholder-for-social-networks-resumes-forums-and-dating-sites-male-and-female-no-photo-images-for-unfilled-user-profile-free-vector.jpg",
        }}
        style={styles.profileImage}
      />
      <Text style={styles.profileName}>{userInfo?.name}</Text>
      <Text style={styles.profilePhone}>{`+91 ${userInfo?.mobileNumber}`}</Text>
    </View>
  );
};

export default ProfileContainer;

const styles = StyleSheet.create({
  profileContainer: {
    alignItems: "center",
    marginTop: 32,
    minHeight: 40,
  } as ViewStyle,
  profileImage: {
    height: 90,
    width: 90,
    borderRadius: 45,
    marginBottom: 15,
  },
  profileName: {
    fontFamily: "Montserrat_700Bold",
    fontSize: 18,
    color: Colors.light.darkGrey,
    marginBottom: 3,
  } as TextStyle,
  profilePhone: {
    fontFamily: "Montserrat_500Medium",
    fontSize: 10,
    color: Colors.light.darkGrey,
    letterSpacing: 1,
  } as TextStyle,
});
