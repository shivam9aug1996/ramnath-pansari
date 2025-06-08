import {
  Dimensions,
  StyleSheet,
  View,
  InteractionManager,
  ActivityIndicator,
  Text,
} from "react-native";
import React, { useEffect, useState } from "react";
import { useLocalSearchParams } from "expo-router";
import { useFetchCategoriesQuery } from "@/redux/features/categorySlice";
import { Colors } from "@/constants/Colors";
import TryAgain from "./CategoryList/TryAgain";
import { useSharedValue } from "react-native-reanimated";
import ProductsPlaceholder from "./ProductList/ProductListPlaceholder"

// Directly import components at the top
import ScreenSafeWrapper from "@/components/ScreenSafeWrapper";
import CategoryList from "./CategoryList/CategoryList";
import Products from "./ProductList/Products";
import GoToCart from "./ProductList/GoToCart";
import FadeInSlideUp from "@/app/components/FadeInSlideUp";
import FadeSlideIn from "@/app/components/FadeSlideIn";
import { useStagedLoad } from "./ProductList/useStagedLoad";
import LazyLoadWrapper from "@/app/components/LazyLoadWrapper";
import MockLagComponent from "@/app/components/MockLagComponent";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/types/global";
import GoToCartWrapper from "./ProductList/GoToCartWrapper";
import DeferredFadeIn from "@/components/DeferredFadeIn";
import Heavy from "./ProductList/Heavy";
import { setProductListScrollParams } from "@/redux/features/productSlice";
const ProductScreen = () => {
  const { id, name, selectedCategoryIdIndex } = useLocalSearchParams<{
    id: string;
    name?: string;
  }>();
  const dispatch = useDispatch()

  // Category header animation control
  const headerVisible = useSharedValue(1);

  const {
    data: getCategories,
    isFetching: isCategoryFetching,
    isError: isCategoryFetchingError,
    refetch,
  } = useFetchCategoriesQuery(
    {
      categoryId: id,
    },
    { skip: !id }
  );

  //const { showWrapper, showCategories, showProducts, showGoToCart } = {showWrapper:true, showCategories:true, showProducts:true, showGoToCart:true}

  // Show states
  // const [showCategories, setShowCategories] = useState(false);
  // const [showProducts, setShowProducts] = useState(false);
  // const [showGoToCart, setShowGoToCart] = useState(false);
  // const [showWrapper, setShowWrapper] = useState(false);

  // useEffect(() => {
  //   // Step 1: Start loading ScreenSafeWrapper after interactions settle
  //   const task = InteractionManager.runAfterInteractions(() => {
  //     requestAnimationFrame(()=>{
  //       setShowWrapper(true);
  //     })
  //   });

  //   return () => InteractionManager.clearInteractionHandle(task);
  // }, []);

  // useEffect(() => {
  //   // Step 2: After Wrapper shows, start loading Categories
  //   if (showWrapper) {
  //     InteractionManager.runAfterInteractions(() => {
  //       requestAnimationFrame(()=>{
  //         setShowCategories(true);
  //       })
  //     });
  //   }
  // }, [showWrapper]);

  // useEffect(() => {
  //   // Step 3: After Categories show, load Products
  //   if (showCategories) {
  //     InteractionManager.runAfterInteractions(() => {
  //       requestAnimationFrame(()=>{
  //         setShowProducts(true);
  //       })
  //     });
  //   }
  // }, [showCategories]);

  // useEffect(() => {
  //   // Step 4: After Products show, load GoToCart
  //   if (showProducts) {
  //     InteractionManager.runAfterInteractions(() => {
  //       requestAnimationFrame(()=>{
  //         setShowGoToCart(true);
  //       })
  //     });
  //   }
  // }, [showProducts]);


  useEffect(()=>{
    return ()=>{
      dispatch(setProductListScrollParams({direction:"up",isBeyondThreshold:false}))
    }
  },[])


  return (
    <>
      {/* Only show ScreenSafeWrapper when it's ready */}
      
        <ScreenSafeWrapper
          showCartIcon={true}
          title={name}
          showSearchIcon={true}
        >
          {/* {showWrapper && ( */}
          <>
            {isCategoryFetchingError ? (
              <TryAgain refetch={refetch} />
            ) : (
              <>
                {/* Categories */}
                {/* {showCategories ? ( */}
                <View
                  style={{
                    position: "absolute",
                    top: 45,
                    left: -30,
                    right: -30,
                    backgroundColor: Colors.light.background,
                    zIndex: 999,
                  }}
                >
                  <DeferredFadeIn delay={0}>
                    <CategoryList
                      contentContainerStyle={{ paddingHorizontal: 30 }}
                      categories={getCategories?.children}
                      isCategoryFetching={isCategoryFetching}
                      selectedCategoryIdIndex={selectedCategoryIdIndex}
                      parentCategory={{ _id: id, name: name }}
                    />
                  </DeferredFadeIn>
                </View>
                {/* ) : null} */}

                <DeferredFadeIn style={{ flex: 1 }} delay={200}>
                  
                  <Products
                    headerVisible={headerVisible}
                    isCategoryFetching={isCategoryFetching}
                  />
                </DeferredFadeIn>
                {/* Products */}
                {/* {showProducts ? (
                  <Products
                    headerVisible={headerVisible}
                    isCategoryFetching={isCategoryFetching}
                  />
                ) : (
                  // Skeleton loader while waiting for products
                  <View style={styles.loader}>
                    <ActivityIndicator
                      size="large"
                      color={Colors.light.tintColorLight}
                    />
                  </View>
                )} */}
              </>
            )}
          </>
          {/* )} */}
        </ScreenSafeWrapper>
      

      {/* GoToCart */}
      <DeferredFadeIn delay={100}>
        <GoToCartWrapper showGoToCart={true} />
      </DeferredFadeIn>
      {/* <DeferredFadeIn delay={1000}>
        <Heavy/>
      </DeferredFadeIn> */}
    </>
  );
};

export default ProductScreen;

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
