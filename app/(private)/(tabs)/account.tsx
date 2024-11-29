import React from "react";
import {
  StyleSheet,
  Text,
  View,
  ViewStyle,
  TextStyle,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import ScreenSafeWrapper from "@/components/ScreenSafeWrapper";
import { Image } from "expo-image";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Colors } from "@/constants/Colors";
import { router } from "expo-router";
import { setCheckoutFlow } from "@/redux/features/orderSlice";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/types/global";
import { useLogoutMutation } from "@/redux/features/authSlice";
import Feather from "@expo/vector-icons/Feather";
interface AccountOptionProps {
  icon: React.ReactNode;
  label: string;
  onPress: any;
  iconColor?: string;
}

const AccountOption: React.FC<AccountOptionProps> = ({
  icon,
  label,
  onPress,
}) => (
  <TouchableOpacity style={styles.optionContainer} onPress={onPress}>
    <View style={styles.optionContent}>
      {icon}
      <Text style={styles.optionLabel}>{label}</Text>
    </View>
    <MaterialIcons
      name="navigate-next"
      size={18}
      color={Colors.light.mediumGrey}
    />
  </TouchableOpacity>
);

const Account: React.FC = () => {
  const dispatch = useDispatch();
  const userInfo = useSelector((state: RootState) => state.auth.userData);
  const [logout, { isError: islogouterror, isSuccess }] = useLogoutMutation();
  console.log(userInfo);
  return (
    <ScreenSafeWrapper title="Profile" showCartIcon>
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
        <Text
          style={styles.profilePhone}
        >{`+91 ${userInfo?.mobileNumber}`}</Text>
      </View>

      <ScrollView style={{ flex: 1, marginTop: 25 }}>
        <View style={styles.optionsContainer}>
          <AccountOption
            onPress={() => {
              router.push("/profile");
            }}
            icon={
              <MaterialCommunityIcons
                name="account"
                size={20}
                color={Colors.light.gradientGreen_2}
              />
            }
            label="My Profile"
          />
          <AccountOption
            onPress={() => {
              dispatch(setCheckoutFlow(false));
              router.push("/(order)/order");
            }}
            icon={
              <Feather
                name="package"
                size={20}
                color={Colors.light.gradientGreen_2}
              />
            }
            label="Orders"
          />
          <AccountOption
            onPress={() => {
              dispatch(setCheckoutFlow(false));
              router.push("/(address)/addressList");
            }}
            icon={
              <Ionicons
                name="location-sharp"
                size={20}
                color={Colors.light.gradientGreen_2}
              />
            }
            label="Saved Addresses"
          />
          <AccountOption
            onPress={async () => {
              await logout({})?.unwrap();
            }}
            icon={
              <MaterialIcons
                name="logout"
                size={20}
                color={Colors.light.gradientRed_1}
              />
            }
            label="Logout"
          />
        </View>
      </ScrollView>
    </ScreenSafeWrapper>
  );
};

export default Account;

const styles = StyleSheet.create({
  profileContainer: {
    flex: 0.25,
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
  optionsContainer: {
    flex: 0.75,
    gap: 15,
    marginTop: 10,
  } as ViewStyle,
  optionContainer: {
    backgroundColor: "#F1F3F2",
    borderRadius: 23,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingVertical: 20,
    alignItems: "center",
  } as ViewStyle,
  optionContent: {
    flexDirection: "row",
    alignItems: "center",
  } as ViewStyle,
  optionLabel: {
    fontFamily: "Raleway_500Medium",
    fontSize: 10,
    color: Colors.light.mediumGrey,
    marginLeft: 23.5,
  } as TextStyle,
});
