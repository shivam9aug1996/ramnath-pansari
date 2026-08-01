import { StyleSheet, Text, View } from "react-native";
import React from "react";
import { TextStyle, ViewStyle } from "react-native";
import { Colors } from "@/constants/Colors";
import { Image } from "expo-image";

const ProfileContainer = ({ userInfo }: { userInfo: any }) => {
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
      <View style={styles.textBlock}>
        <Text style={styles.profileName}>{userInfo?.name}</Text>
        {!userInfo?.isGuestUser && (
          <Text style={styles.profilePhone}>{`+91 ${userInfo?.mobileNumber}`}</Text>
        )}
      </View>
    </View>
  );
};

export default ProfileContainer;

const styles = StyleSheet.create({
  profileContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 14,
  } as ViewStyle,
  profileImage: {
    height: 64,
    width: 64,
    borderRadius: 32,
    borderWidth: 2.5,
    borderColor: Colors.light.gradientGreen_2,
    backgroundColor: "#F8FAFC",
  },
  textBlock: {
    flex: 1,
    gap: 4,
  },
  profileName: {
    fontFamily: "Montserrat_700Bold",
    fontSize: 18,
    color: Colors.light.darkGrey,
    letterSpacing: 0.2,
  } as TextStyle,
  profilePhone: {
    fontFamily: "Montserrat_600SemiBold",
    fontSize: 13,
    color: Colors.light.mediumGrey,
    letterSpacing: 0.5,
  } as TextStyle,
});
