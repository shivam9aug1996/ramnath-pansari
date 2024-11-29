import React, { useEffect } from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  Text,
  Image,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import { useSelector } from "react-redux";
import { useFetchCategoriesQuery } from "@/redux/features/categorySlice";
import { RootState, Category } from "@/types/global";
import ScreenSafeWrapper from "@/components/ScreenSafeWrapper";
import { Colors } from "@/constants/Colors";
import CustomTextInput from "@/components/CustomTextInput";
import CategorySelector from "../../(category)/CategoryList/CategorySelector";
import { imageBorderStyle } from "../../(category)/CategoryList/utils";
import { arrayColor } from "../../(category)/CategoryList/constants";
import { truncateText } from "@/utils/utils";
import withPrivateRoute from "@/components/withPrivateRoute";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import LottieMenWalking from "../../(address)/LottieMenWalking";
import { NativeModules } from "react-native";
import TabContainer from "../../(category)/ProductList/Tab/TabContainer";
const { UPIModule } = NativeModules;

const initiateUPIPayment = async () => {
  try {
    UPIModule.logMessage("Hello from React Native!");
  } catch (error) {
    console.error("Payment Error:", error);
  }
};

const DashboardHeader = ({ userName, profileImage, onProfilePress }) => {
  // const translateY = useSharedValue(0);

  // React.useEffect(() => {
  //   translateY.value = withRepeat(
  //     withTiming(10, { duration: 500, easing: Easing.ease }),
  //     -1,
  //     true
  //   );
  // }, [translateY]);

  // const animatedStyle = useAnimatedStyle(() => {
  //   return {
  //     transform: [{ translateY: translateY.value }],
  //   };
  // });
  const rotateValue = useSharedValue(0);

  React.useEffect(() => {
    rotateValue.value = withRepeat(
      withTiming(50, { duration: 600, easing: Easing.ease }),
      4, // Infinite repetition
      true // Reverse direction for a waving effect
    );
  }, [rotateValue]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${rotateValue.value}deg` }],
    };
  });

  return (
    <View style={styles.headerContainer}>
      <View style={{ flex: 2 }}>
        <Text style={styles.greetingText}>
          {`Hey ${userName} `}
          <Animated.View style={[animatedStyle]}>
            <Text style={{ fontSize: 18 }}>👋</Text>
          </Animated.View>
        </Text>
      </View>
      <TouchableOpacity
        style={{ flex: 1, alignItems: "flex-end" }}
        onPress={onProfilePress}
      >
        <Image
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
const CategoryCard = ({
  category,
  onSelect,
}: {
  category: Category;
  onSelect: any;
}) => {
  const borderStyle = imageBorderStyle(arrayColor, false, Math.random());
  return (
    <View style={styles.categoryCard}>
      <View style={[styles.categoryTitleContainer, borderStyle]}>
        <Text style={styles.categoryTitleText}>{category?.name}</Text>
      </View>
      <CategorySelector
        categories={category?.children}
        onSelectCategory={(data) => onSelect(data, category)}
      />
    </View>
  );
};

const Dashboard = () => {
  const token = useSelector((state: RootState) => state?.auth?.token);
  const userData = useSelector((state: RootState) => state?.auth?.userData);
  const { data: categoriesData } = useFetchCategoriesQuery(
    {},
    { skip: !token }
  );
  const router = useRouter();

  const handleCategorySelect = (
    selectedCategory: Category,
    parentCategory: Category
  ) => {
    const selectedIndex = parentCategory.children.findIndex(
      (item) => item?._id === selectedCategory?._id
    );

    router.push({
      pathname: `/(category)/${parentCategory?._id}`,
      params: {
        name: parentCategory?.name,
        selectedCategoryIdIndex: selectedIndex,
      },
    });
  };

  const handleProfilePress = () => {
    router.navigate("/(tabs)/account");
  };

  useEffect(() => {
    initiateUPIPayment();
  }, []);
  return (
    <ScreenSafeWrapper showBackButton={false}>
      <TabContainer />
      {/* <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.container}>
          <DashboardHeader
            userName={truncateText(userData?.name?.split(" ")[0], 10)}
            profileImage={userData?.profileImage}
            onProfilePress={handleProfilePress}
          />
          <Text style={styles.subtitleText}>
            Your one-stop shop for everything you love.
          </Text>

          <CustomTextInput
            onChangeText={() => {}}
            value="Search..."
            type="search"
            variant={2}
            wrapperStyle={styles.textInputWrapper}
            textInputStyle={styles.textInputStyle}
            onPress={() => router.push("/(search)/search")}
          />

          {categoriesData?.categories?.map((category: Category) => (
            <CategoryCard
              key={category?._id}
              category={category}
              onSelect={handleCategorySelect}
            />
          ))}
        </View>
      </ScrollView> */}
    </ScreenSafeWrapper>
  );
};

export default Dashboard;

const styles = StyleSheet.create({
  container: {
    paddingTop: 10,
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  greetingText: {
    fontFamily: "Raleway_800ExtraBold",
    fontSize: 22,
    color: Colors.light.darkGreen,
    marginBottom: 3,
  },
  subtitleText: {
    fontFamily: "Raleway_500Medium",
    fontSize: 16,
    color: Colors.light.mediumLightGrey,
    paddingTop: 8,
  },
  textInputWrapper: {
    marginTop: 20,
    marginBottom: 30,
  },
  textInputStyle: {
    fontFamily: "Raleway_400Regular",
    fontSize: 12,
    color: Colors.light.darkGreen,
    top: 1,
    opacity: 0.6,
  },
  categoryCard: {
    flex: 1,
    flexDirection: "column",
    marginBottom: 40,
  },
  categoryTitleContainer: {
    borderRadius: 23,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderWidth: 1,
    alignSelf: "flex-start",
  },
  categoryTitleText: {
    fontFamily: "Raleway_500Medium",
    fontSize: 12,
    color: Colors.light.mediumGrey,
  },
});
