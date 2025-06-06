// import { Dimensions, StyleSheet } from "react-native";
// import React, { useEffect, useState } from "react";
// import { useLocalSearchParams } from "expo-router";
// import { useFetchCategoriesQuery } from "@/redux/features/categorySlice";
// import ScreenSafeWrapper from "@/components/ScreenSafeWrapper";
// import Animated, {
//   useAnimatedStyle,
//   withTiming,
//   useSharedValue,
//   Easing,
// } from "react-native-reanimated";
// import { Colors } from "@/constants/Colors";
// import Offline from "@/components/Offline";
// import TryAgain from "./CategoryList/TryAgain";

// const ProductScreen = () => {
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

//   // Lazy loaded components (states)
//   const [ProductsComp, setProductsComp] = useState(null);
//   const [CategoryListComp, setCategoryListComp] = useState(null);
//   const [GoToCartComp, setGoToCartComp] = useState(null);

//   // Load lazily when component mounts
//   useEffect(() => {
//     (async () => {
//       const ProductsModule = await import("./ProductList/Products");
//       const CategoryListModule = await import("./CategoryList/CategoryList");
//       const GoToCartModule = await import("./ProductList/GoToCart");

//       setProductsComp(() => ProductsModule.default);
//       setCategoryListComp(() => CategoryListModule.default);
//       setGoToCartComp(() => GoToCartModule.default);
//     })();
//   }, []);

//   const categoryAnimatedStyle = useAnimatedStyle(() => {
//     const translateY = withTiming(headerVisible.value === 1 ? 0 : -350, {
//       duration: 700,
//       easing: Easing.bezier(0.25, 0.1, 0.25, 1),
//     });

//     const height = withTiming(headerVisible.value === 1 ? 180 : 50, {
//       duration: 700,
//       easing: Easing.bezier(0.25, 0.1, 0.25, 1),
//     });

//     return {
//       transform: [{ translateY }],
//       height,
//     };
//   });

//   return (
//     <>
//       <ScreenSafeWrapper showCartIcon={true} title={name} showSearchIcon={true}>
//         {isCategoryFetchingError ? (
//           <TryAgain refetch={refetch} />
//         ) : (
//           <>
//             {/* Lazy loaded CategoryList */}
//             {CategoryListComp && (
//               <Animated.View
//                 style={[
//                   {
//                     position: "absolute",
//                     top: 45,
//                     left: -30,
//                     right: -30,
//                     backgroundColor: Colors.light.background,
//                     zIndex: 999,
//                   },
//                   categoryAnimatedStyle,
//                 ]}
//               >
//                 <CategoryListComp
//                   contentContainerStyle={{ paddingHorizontal: 30 }}
//                   categories={getCategories?.children}
//                   isCategoryFetching={isCategoryFetching}
//                   selectedCategoryIdIndex={selectedCategoryIdIndex}
//                   parentCategory={{ _id: id, name: name }}
//                 />
//               </Animated.View>
//             )}

//             {/* Lazy loaded Products */}
//             {ProductsComp && (
//               <ProductsComp
//                 headerVisible={headerVisible}
//                 isCategoryFetching={isCategoryFetching}
//               />
//             )}
//           </>
//         )}
//       </ScreenSafeWrapper>

//       {/* Lazy loaded GoToCart */}
//       {GoToCartComp && <GoToCartComp />}
//     </>
//   );
// };

// export default ProductScreen;

// const styles = StyleSheet.create({});
