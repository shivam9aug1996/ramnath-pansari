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
    marginTop: 24,
    minHeight: 40,
    paddingHorizontal: 20,
    paddingVertical: 16,
  } as ViewStyle,
  profileImage: {
    height: 100,
    width: 100,
    borderRadius: 50,
    marginBottom: 20,
    borderWidth: 3,
    borderColor: Colors.light.gradientGreen_2,
    backgroundColor: '#F8FAFC',
  },
  profileName: {
    fontFamily: "Montserrat_700Bold",
    fontSize: 20,
    color: Colors.light.darkGrey,
    marginBottom: 8,
    letterSpacing: 0.3,
    textAlign: 'center',
  } as TextStyle,
  profilePhone: {
    fontFamily: "Montserrat_600SemiBold",
    fontSize: 14,
    color: Colors.light.mediumGrey,
    letterSpacing: 0.8,
    textAlign: 'center',
  } as TextStyle,
});
