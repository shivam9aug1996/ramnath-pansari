import { StyleSheet, Text, View, ActivityIndicator } from "react-native";
  import React, { memo, useCallback, useEffect, useState } from "react";
  import Animated, { useAnimatedRef } from "react-native-reanimated";
  import ScreenSafeWrapper from "@/components/ScreenSafeWrapper";
  import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
  import { useDispatch, useSelector } from "react-redux";
  import { CartItem, RootState } from "@/types/global";
  import {
    setResetPagination,
    useFetchProductDetailQuery,
  } from "@/redux/features/productSlice";
  import { Colors } from "@/constants/Colors";
  import { ThemedText } from "@/components/ThemedText";
  import { Image } from "expo-image";
  import { staticImage } from "../(category)/CategoryList/utils";
  import { useFetchCartQuery } from "@/redux/features/cartSlice";
  import CartButton from "./CartButton";
  import Animation from "./Animation";
  import CustomSuspense from "@/components/CustomSuspense";
  import GoToCart from "../(category)/ProductList/GoToCart";
  import { addProductView } from "@/redux/features/recentlyViewedSlice";
  import RecentlyViewedProducts from "./RecentlyViewedProducts";
  import DeferredFadeIn from "@/components/DeferredFadeIn";
  import ParallaxScrollView from "@/components/ParallaxScrollView";
  import ProductInfoSections from "./ProductInfoSections";
  import FoodTypeBadge from "./FoodTypeBadge";
  import { ProductDetailBodySkeleton } from "./ProductDetailPlaceholder";
  import {
    productDetailContentStyles,
    PRODUCT_DETAIL_SCROLL_PADDING_BOTTOM,
  } from "./productDetailLayout";
  import { useGoToCartListPadding } from "@/contexts/DeliveryFloatContext";

  const contentStyles = productDetailContentStyles;
  const ProductDetail = ({id,extraData}:{id:string,extraData:any}) => {
   
    const { data, isFetching, isLoading, isSuccess } = useFetchProductDetailQuery(
      { productId: id },
      { skip: !id }
    );
    const scrollRef = useAnimatedRef<Animated.ScrollView>();
    const goToCartListPadding = useGoToCartListPadding();
  
    const dispatch = useDispatch();
  
    const userId = useSelector((state: RootState) => state?.auth?.userData?._id);
    const { data: cartData, isLoading: isCartLoading } = useFetchCartQuery(
      {
        userId,
      },
      {
        skip: !userId,
      }
    );
    const productStaleData = JSON.parse(extraData);
  
    const [showImage, setShowImage] = useState(false);
    // const isLoading = cartButtonProductId.includes(id);
    const image = data?.product?.image;
    const discountedPrice = data?.product?.discountedPrice;
    const name = data?.product?.name;
    const size = data?.product?.size;
    const price = data?.product?.price;
    const foodType =
      data?.productInformation?.vegNonVeg || data?.product?.foodType;
    const cartItem = cartData?.cart?.items?.find(
      (it: CartItem) => it?.productId === id
    );
  
    //console.log("hgnm,.", data);
  
    useEffect(()=>{
      if(!isFetching&&image){
        setShowImage(true);
    }else{
      setShowImage(false);
    }
    },[isFetching,image])
  
    useEffect(() => {
      dispatch(
        addProductView({
          id: id,
          name: name,
          image: image,
          price: price,
          discountedPrice: discountedPrice,
          size: size,
          isOutOfStock: data?.product?.isOutOfStock,
        })
      );
    }, [data?.product]);
  
    useFocusEffect(
      useCallback(() => {
        if (data?.product == null && router.canGoBack() && isSuccess) {
          dispatch(
            setResetPagination({
              item: {
                _id: id,
              },
              status: true,
            })
          );
          router.back();
        }
  
        return () => {};
      }, [data?.product, id])
    );
  
    return (
      <>
        <ScreenSafeWrapper showCartIcon>
          <DeferredFadeIn delay={100} style={{ flex: 1 }}>
            <ParallaxScrollView
              scrollRef={scrollRef}
              headerHeight={300}
              headerBackgroundColor={{
                light: Colors.light.background,
                dark: Colors.light.background,
              }}
              contentContainerStyle={{
                paddingBottom:
                  PRODUCT_DETAIL_SCROLL_PADDING_BOTTOM + goToCartListPadding,
                paddingTop: 10,
              }}
              contentStyle={{
                padding: 0,
                gap: 0,
              }}
              headerImage={
                <Image
                  transition={500}
                  blurRadius={showImage ? 0 : 10}
                  source={{
                    uri: showImage ? image : productStaleData?.image,
                  }}
                  style={styles.parallaxImage}
                  contentFit="contain"
                  cachePolicy="disk"
                />
              }
            >
              <View
                style={{
                  opacity: data?.product?.isOutOfStock ? 0.6 : 1,
                  marginTop: 16,
                  marginBottom: 40,
                }}
              >
                <View style={styles.textContainer}>
                  {isLoading ? (
                    <ProductDetailBodySkeleton />
                  ) : (
                    <>
                      <View style={contentStyles.textContainer}>
                        <View style={contentStyles.titleRow}>
                          <FoodTypeBadge foodType={foodType} size="md" />
                          <ThemedText
                            style={contentStyles.productName}
                            type="title"
                          >
                            {name}
                          </ThemedText>
                        </View>
                        {size ? (
                          <Text style={contentStyles.size}>{size}</Text>
                        ) : null}
                        {price && discountedPrice && price > discountedPrice && (
                          <View style={contentStyles.discountTag}>
                            <Text style={contentStyles.discountText}>
                              {Math.round(
                                ((price - discountedPrice) / price) * 100
                              )}
                              % OFF
                            </Text>
                          </View>
                        )}
                        <ThemedText
                          style={[contentStyles.productPrice, contentStyles.originalPrice]}
                          type="title"
                        >
                          {`MRP ₹ ${price}`}
                        </ThemedText>
                        <ThemedText style={contentStyles.productPrice} type="title">
                          {`₹ ${discountedPrice}`}
                        </ThemedText>
                        {data?.product?.isOutOfStock ||
                        !isSuccess ||
                        data?.product == null ? null : isCartLoading ? (
                          <View
                            style={contentStyles.cartButtonLoaderWrap}
                            pointerEvents="none"
                          >
                            <View style={contentStyles.cartButtonLoaderBar}>
                              <ActivityIndicator
                                size="small"
                                color={Colors.light.gradientGreen_1}
                              />
                            </View>
                          </View>
                        ) : (
                          <CartButton
                            value={cartItem?.quantity || 0}
                            item={data?.product}
                          />
                        )}
                      </View>

                      <ProductInfoSections
                        productInformation={data?.productInformation}
                        itemSpecifications={data?.itemSpecifications}
                        size={size || data?.itemSpecifications?.netQuantity}
                        foodType={foodType}
                      />
                    </>
                  )}
                </View>
              </View>

              <RecentlyViewedProducts
                variant="compact"
                scrollRef={scrollRef}
                filterProductIds={[id]}
              />
            </ParallaxScrollView>
          </DeferredFadeIn>
        </ScreenSafeWrapper>
  
        {data?.product?.isOutOfStock ? (
          <Animation
            id={data?.product?._id}
            isOutOfStock={data?.product?.isOutOfStock}
          />
        ) : data?.product !== null ? (
          <GoToCart />
        ) : // </CustomSuspense>
        null}
      </>
    );
  };
  
  export default memo(ProductDetail);
  
  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    textContainer: {
      position: "relative",
    },
    parallaxImage: {
      width: "100%",
      height: "100%",
    },
    addToCartButton: {
      marginTop: 25,
      paddingVertical: 12,
      borderRadius: 25,
      alignItems: "center",
      width: "90%",
      backgroundColor: Colors.light.lightGreen,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.3,
      shadowRadius: 6,
    },
    addToCartText: {
      color: Colors.light.white,
      fontSize: 18,
      fontWeight: "600",
      fontFamily: "Montserrat_600SemiBold",
    },
  });
  