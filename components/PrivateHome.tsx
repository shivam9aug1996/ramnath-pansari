import React, { lazy, Suspense, useEffect } from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  Text,
  Button,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { useSelector } from "react-redux";
import { useFetchCategoriesQuery } from "@/redux/features/categorySlice";
import { RootState, Category } from "@/types/global";
import ScreenSafeWrapper from "@/components/ScreenSafeWrapper";
import { Colors } from "@/constants/Colors";
import { truncateText } from "@/utils/utils";
import CustomSuspense from "./CustomSuspense";
import CategoryCardPlaceholder from "./CategoryCardPlaceholder";
import CategoryCard from "./CategoryCard";
import DashboardHeader from "./DashboardHeader";
import CustomTextInput from "./CustomTextInput";
import Carasole from "./Carasole";
import WebView from "react-native-webview";
import RecentlyViewed from "./RecentlyViewed";
import store from "@/redux/store";
import {
  clearRecentlyViewed,
  loadRecentlyViewed,
} from "@/redux/features/recentlyViewedSlice";
import PersonalAI from "./PersonalAI";
import SpinWheel from "@/app/components/SpinWheel";
import Toast from "react-native-toast-message";
import DeferredFadeIn from "./DeferredFadeIn";
import RecentlyViewedProducts from "@/app/(private)/(productDetail)/RecentlyViewedProducts";

// const DashboardHeader = lazy(() => import("./DashboardHeader"));
// const CustomTextInput = lazy(() => import("@/components/CustomTextInput"));
// const Carasole = lazy(() => import("./Carasole"));
// const CategoryCard = lazy(() => import("./CategoryCard"));

const PrivateHome = () => {
  const token = useSelector((state: RootState) => state?.auth?.token);
  const userData = useSelector((state: RootState) => state?.auth?.userData);
  const { data: categoriesData, isFetching: isCategoryFetching } =
    useFetchCategoriesQuery({}, { skip: !token });
  const router = useRouter();

  useEffect(() => {
    store.dispatch(loadRecentlyViewed());
  }, []);

  const handleCategorySelect = (
    selectedCategory: Category,
    parentCategory: Category,
    index
  ) => {
    const selectedIndex = parentCategory.children.findIndex(
      (item) => item?._id === selectedCategory?._id
    );
   // console.log("kjytr567890", index);
    router.push({
      pathname: `/(category)/${parentCategory?._id}`,
      params: {
        name: parentCategory?.name,
        selectedCategoryIdIndex: selectedIndex,
      },
    });

    // router.push({
    //   pathname: `/(private)/(tabs)/cat`,
    //   params: {
    //     name: parentCategory?.name,
    //     selectedCategoryIdIndex: selectedIndex,
    //     id: parentCategory?._id,
    //   },
    // });
  };

  const handleProfilePress = () => {
    router.navigate("/(tabs)/account");
  };

  return (
    <>
      <ScreenSafeWrapper showBackButton={false}>
        {/* <CustomSuspense fallback={<View style={{ flex: 1 }} />}> */}
        <DeferredFadeIn delay={100} style={{ flex: 1 }}>
          <ScrollView
            bounces={Platform.OS === "android" ? false : true}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.container}>
              <DashboardHeader
                userName={truncateText(userData?.name?.split(" ")[0], 10)}
                profileImage={userData?.profileImage}
                onProfilePress={handleProfilePress}
              />
              <Text style={styles.subtitleText}>
                Your one-stop shop for everything you love.
              </Text>
              {/* <RecentlyViewed /> */}

              <CustomTextInput
                onChangeText={() => {}}
                value="Search..."
                type="search"
                variant={2}
                wrapperStyle={styles.textInputWrapper}
                textInputStyle={styles.textInputStyle}
                onPress={() => {
                  router.push("/(search)/search");
                  // router.push("/(private)/(tabs)/search");
                }}
              />

              {/* <DeferredFadeIn delay={150}>
                <Carasole />
                </DeferredFadeIn> */}

              {/* <Suspense fallback={null}> */}
              <DeferredFadeIn delay={200}>
                {isCategoryFetching ? (
                  <View>
                    <CategoryCardPlaceholder />
                    <CategoryCardPlaceholder />
                  </View>
                ) : (
                  categoriesData?.categories?.map(
                    (category: Category, index) => (
                      <CategoryCard
                        key={category?._id?.toString()}
                        category={category}
                        onSelect={handleCategorySelect}
                      />
                    )
                  )
                )}
              </DeferredFadeIn>
              {/* </Suspense> */}
            </View>
           <DeferredFadeIn delay={200}>
            <RecentlyViewedProducts variant={"compact"} />
           </DeferredFadeIn>
            {/* <SpinWheel/> */}
          </ScrollView>
        </DeferredFadeIn>
        {/* </CustomSuspense> */}
        {/* <Button
          title="go"
          onPress={() => {
            router.navigate("/(tabs)/cat?id=1&name=shivam");
          }}
        /> */}
      </ScreenSafeWrapper>
    </>
  );
};

export default PrivateHome;

const styles = StyleSheet.create({
  container: {
    paddingTop: 10,
    paddingBottom: 60,
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
  background1: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    width: "100%",
    height: "100%",
    zIndex: -1,
    opacity: 1,
  },
});
