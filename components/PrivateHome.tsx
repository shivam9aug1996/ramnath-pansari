import React, { lazy, Suspense } from "react";
import { StyleSheet, View, ScrollView, Text } from "react-native";
import { useRouter } from "expo-router";
import { useSelector } from "react-redux";
import { useFetchCategoriesQuery } from "@/redux/features/categorySlice";
import { RootState, Category } from "@/types/global";
import ScreenSafeWrapper from "@/components/ScreenSafeWrapper";
import { Colors } from "@/constants/Colors";
import { truncateText } from "@/utils/utils";
import CustomSuspense from "./CustomSuspense";

const DashboardHeader = lazy(() => import("./DashboardHeader"));
const CustomTextInput = lazy(() => import("@/components/CustomTextInput"));
const Carasole = lazy(() => import("./Carasole"));
const CategoryCard = lazy(() => import("./CategoryCard"));

const PrivateHome = () => {
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

  return (
    <>
      <ScreenSafeWrapper showBackButton={false}>
        <CustomSuspense fallback={<View style={{ flex: 1 }} />}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.container}>
              <DashboardHeader
                userName={truncateText(userData?.name?.split(" ")[0], 10)}
                profileImage={userData?.profileImage}
                onProfilePress={handleProfilePress}
              />
              <Text style={styles.subtitleText}>
                Your one-stop shop for everything you love.
              </Text>

              <Suspense fallback={null}>
                <CustomTextInput
                  onChangeText={() => {}}
                  value="Search..."
                  type="search"
                  variant={2}
                  wrapperStyle={styles.textInputWrapper}
                  textInputStyle={styles.textInputStyle}
                  onPress={() => router.push("/(search)/search")}
                />
              </Suspense>
              <Suspense fallback={null}>
                <Carasole />
              </Suspense>

              <Suspense fallback={null}>
                {categoriesData?.categories?.map((category: Category) => (
                  <CategoryCard
                    key={category?._id}
                    category={category}
                    onSelect={handleCategorySelect}
                  />
                ))}
              </Suspense>
            </View>
          </ScrollView>
        </CustomSuspense>
      </ScreenSafeWrapper>
    </>
  );
};

export default PrivateHome;

const styles = StyleSheet.create({
  container: {
    paddingTop: 10,
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
});
