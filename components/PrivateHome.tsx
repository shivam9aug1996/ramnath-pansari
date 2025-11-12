import React, { useEffect, useState } from "react";
import { StyleSheet, View, ScrollView, Platform, TextInput, RefreshControl } from "react-native";
import { router, useRouter } from "expo-router";
import { useDispatch, useSelector } from "react-redux";
import { setCategoryData, useFetchCategoriesQuery } from "@/redux/features/categorySlice";
import { RootState, Category } from "@/types/global";
import ScreenSafeWrapper from "@/components/ScreenSafeWrapper";
import { Colors } from "@/constants/Colors";
import { truncateText } from "@/utils/utils";
import CategoryCardPlaceholder from "./CategoryCardPlaceholder";
import CategoryCard from "./CategoryCard";
import DashboardHeader from "./DashboardHeader";
import CustomTextInput from "./CustomTextInput";

import store from "@/redux/store";
import { loadRecentlyViewed } from "@/redux/features/recentlyViewedSlice";
import DeferredFadeIn from "./DeferredFadeIn";
import RecentlyViewedProducts from "@/app/(private)/(productDetail)/RecentlyViewedProducts";
import GreetingMessage from "./GreetingMessage/GreetingMessage";
import Carasole from "./Carasole";
import GreetingMessageWrapper from "./GreetingMessage/GreetingMessageWrapper";
import Example from "@/utils/Example";
import WeatherSection from "./WeatherSection/WeatherSection";
import HomeSearch from "./HomeSearch";
import JammedUIExample from "./JammedUIExample";
import { setSelectedSubCategoryId } from "@/redux/features/searchSlice";
import { Text } from "react-native";
import Products from "@/app/(private)/(category)/ProductList/Products";

const PrivateHome = () => {
  const dispatch = useDispatch();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const token = useSelector((state: RootState) => state?.auth?.token);
  const userData = useSelector((state: RootState) => state?.auth?.userData);
  const { data: categoriesData, isFetching: isCategoryFetching,refetch } =
    useFetchCategoriesQuery({}, { skip: !token });

    //console.log("categoriesData",JSON.stringify(categoriesData))

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
    // const selectedCategory1 = parentCategory.children.find(
    //   (item) => item?._id === selectedCategory?._id
    // );
   // console.log("selectedCategory",JSON.stringify(selectedCategory))
   console.log("categoriesData",JSON.stringify(selectedCategory))
    const selectedCategory1 = categoriesData?.categories.find(
      (item) => {
        return item?._id == parentCategory?._id
      }
    );
    console.log("selectedCategory1",JSON.stringify(selectedCategory1))
    console.log("selectedIndex",JSON.stringify(selectedIndex))
    // router.push({
    //   pathname: `/(category)/${parentCategory?._id}`,
    //   params: {
    //     name: parentCategory?.name,
    //     selectedCategoryIdIndex: selectedIndex?.toString(),
    //     id: parentCategory?._id,
    //   },
    // });
    dispatch(setCategoryData(selectedCategory1))
    
   // dispatch(setSelectedSubCategoryId(selectedCategory1))
    router.push(`/(category)/${parentCategory?._id?.toString()}?name=${parentCategory?.name}&selectedCategoryIdIndex=${selectedIndex?.toString()}`)
  };

  const handleProfilePress = () => {
    router.navigate("/(tabs)/account");
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    refetch();
    setIsRefreshing(false);
  };

  return (
    <>
      <ScreenSafeWrapper
        showBackButton={false}
        wrapperStyle={{ paddingHorizontal: 0 }}
        showWeatherSection={true}
        showGradient={true}
      >
        <DeferredFadeIn delay={100} style={{ flex: 1 }}>
          
          <ScrollView
            refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}
            bounces={Platform.OS === "android" ? false : true}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.container}>
              <DashboardHeader
                userName={truncateText(userData?.name?.split(" ")[0], 10)}
                profileImage={userData?.profileImage}
                onProfilePress={handleProfilePress}
                isGuestUser={userData?.isGuestUser}
              />

              {/* <DeferredFadeIn
              delay={300}
              fallback={<View style={{height:27}}/>}
              >
                <GreetingMessageWrapper />
              </DeferredFadeIn> */}

              <View style={{ paddingHorizontal: 20 }}>
               <HomeSearch />
                
              </View>
              <DeferredFadeIn
                delay={100}
                fallback={<View style={{ width: 393, height: 236 }} />}
                style={{ flex: 1 }}
              >
                <Carasole />
              </DeferredFadeIn>

              <DeferredFadeIn
                delay={0}
                //fallback={<View style={{ minWidth: "100%", minHeight: 80 }} />}
              >
                <View style={{ minHeight: 80, minWidth: "100%" }}>
                  <WeatherSection />
                </View>
              </DeferredFadeIn>

              <DeferredFadeIn delay={200}>
                {isCategoryFetching ? (
                  <View style={{ paddingHorizontal: 20 }}>
                    <CategoryCardPlaceholder />
                    <CategoryCardPlaceholder />
                  </View>
                ) : (
                  categoriesData?.categories?.map(
                    (category: Category, index) => (
                      <CategoryCard
                        key={category?._id?.toString()}
                        category={category}
                        index={index}
                        onSelect={handleCategorySelect}
                        length={categoriesData?.categories?.length}
                      />
                    )
                  )
                )}
              </DeferredFadeIn>
            </View>
            <DeferredFadeIn delay={200}>
              <RecentlyViewedProducts variant={"compact"} />
            </DeferredFadeIn>
            <DeferredFadeIn delay={200}>
            </DeferredFadeIn>
       
          </ScrollView>
          
        </DeferredFadeIn>
        
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
    backgroundColor: Colors.light.white,
    borderRadius: 25,
    // shadowColor: Colors.light.darkGreen,
    // shadowOffset: {
    //   width: 0,
    //   height: 4,
    // },
    // shadowOpacity: 0.1,
    // shadowRadius: 8,
    // elevation: 8,
    borderWidth: 2,
    borderColor: Colors.light.lightGrey,
  },
  textInputStyle: {
    fontFamily: "Raleway_400Regular",
    fontSize: 12,
    color: Colors.light.darkGreen,
    top: 1,
    //opacity: 0.6,
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
