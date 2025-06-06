// import { Dimensions, StyleSheet, Text, View } from "react-native";
// import React, { lazy, Suspense } from "react";
// import { useLocalSearchParams } from "expo-router";
// import { useFetchCategoriesQuery } from "@/redux/features/categorySlice";
// import ScreenSafeWrapper from "@/components/ScreenSafeWrapper";
// import CustomSuspense from "@/components/CustomSuspense";
// import CategorySelectorPlaceholder from "./CategoryList/CategorySelectorPlaceholder";
// import SubCategorySelectorPlaceholder from "./CategoryList/SubCategorySelectorPlaceholder";
// // import TryAgain from "./CategoryList/TryAgain";
// // import CategoryList from "./CategoryList/CategoryList";
// // import Products from "./ProductList/Products";
// // import GoToCart from "./ProductList/GoToCart";
// import Animated, {
//   useAnimatedStyle,
//   withTiming,
//   useSharedValue,
//   Easing,
//   withSpring,
// } from "react-native-reanimated";
// import { Colors } from "@/constants/Colors";
// import Offline from "@/components/Offline";
// const Products = lazy(() => import("./ProductList/Products"));
// const CategoryList = lazy(() => import("./CategoryList/CategoryList"));

// const TryAgain = lazy(() => import("./CategoryList/TryAgain"));
// const GoToCart = lazy(() => import("./ProductList/GoToCart"));

// const product = () => {
//   const { id, name, selectedCategoryIdIndex } = useLocalSearchParams<{
//     id: string;
//     name?: string;
//   }>();
//   const headerVisible = useSharedValue(1);

//   const {
//     data: getCategories,
//     isFetching: isCategoryFetching,
//     isError: isCategoryFetchingError,
//     refetch,
//   } = useFetchCategoriesQuery(
//     {
//       categoryId: id,
//     },
//     { skip: !id }
//   );

//   console.log("uytfghjghjkhgfghj", JSON.stringify(getCategories));

//   return (
//     <CustomSuspense delay={100}>
//       <ScreenSafeWrapper showCartIcon={true} title={name} showSearchIcon={true}>
//         <CustomSuspense delay={0}>
//           {isCategoryFetchingError ? (
//             <Suspense fallback={null}>
//               <TryAgain refetch={refetch} />
//             </Suspense>
//           ) : (
//             <>
//               <Animated.View
//                 style={[
//                   {
//                     position: "absolute",
//                     top: 45,
//                     left: -30,
//                     right: -30,
//                     backgroundColor: Colors.light.background,
//                     zIndex: 999,
//                     //paddingHorizontal: 30,
//                     //width: Dimensions.get("window").width,
//                   },
//                   useAnimatedStyle(() => {
//                     const translateY = withTiming(
//                       headerVisible.value === 1 ? 0 : -350,
//                       {
//                         duration: 700,
//                         easing: Easing.bezier(0.25, 0.1, 0.25, 1),
//                       }
//                     );

//                     const height = withTiming(
//                       headerVisible.value === 1 ? 180 : 50,
//                       {
//                         duration: 700,
//                         easing: Easing.bezier(0.25, 0.1, 0.25, 1),
//                       }
//                     );

//                     return {
//                       transform: [{ translateY }],
//                       height,
//                     };
//                   }),
//                 ]}
//               >
//                 <Suspense
//                   fallback={
//                     <CategorySelectorPlaceholder
//                       contentContainerStyle={{ paddingHorizontal: 30 }}
//                     />
//                   }
//                 >
//                   <CategoryList
//                     contentContainerStyle={{ paddingHorizontal: 30 }}
//                     categories={getCategories?.children}
//                     isCategoryFetching={isCategoryFetching}
//                     selectedCategoryIdIndex={selectedCategoryIdIndex}
//                     parentCategory={{_id: id, name: name}}
//                   />
//                 </Suspense>
//               </Animated.View>

//               <CustomSuspense>
//                 <Suspense fallback={null}>
//                   <Products
//                     headerVisible={headerVisible}
//                     isCategoryFetching={isCategoryFetching}
//                   />
//                 </Suspense>
//               </CustomSuspense>
//             </>
//           )}
//         </CustomSuspense>
//       </ScreenSafeWrapper>

//       <CustomSuspense>
//         <Suspense fallback={null}>
//           <GoToCart />
//         </Suspense>
//       </CustomSuspense>
//     </CustomSuspense>
//   );
// };

// export default product;

// const styles = StyleSheet.create({});
