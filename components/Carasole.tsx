import { Image } from "expo-image";
import React, { memo, useEffect, useRef } from "react";
import {
  Dimensions,
  Pressable,
  View,
} from "react-native";
import ContentLoader, { Circle, Rect } from "react-content-loader/native";
import Animated, { useSharedValue } from "react-native-reanimated";
import Pagi from "./Pagi";
import { router, useIsFocused } from "expo-router";
import {
  setCategoryData,
  useFetchCategoriesQuery,
} from "@/redux/features/categorySlice";
import { useCachedCarouselBanners } from "@/hooks/useCachedCarousel";
import { useDispatch, useSelector } from "react-redux";
import { CarouselBannerDocument, Category, RootState } from "@/types/global";
import Carousel from "pinar";

/** Pagi minHeight (20) + carousel/pagi marginBottom (10 + 10). */
export const CAROUSEL_PAGI_SLOT_HEIGHT = 40;

export function getCarouselSlotHeight(windowWidth: number): number {
  return windowWidth / 2 + CAROUSEL_PAGI_SLOT_HEIGHT;
}

type CarasoleProps = {
  onScrollToCategories?: () => void;
};

/** Matches CategoryCardPlaceholder shimmer colors. */
const SKELETON_BG = "#f3f3f3";
const SKELETON_FG = "#ecebeb";

function CarouselSlotPlaceholder({ width }: { width: number }) {
  const imageWidth = width - 30;
  const imageHeight = width / 2;

  return (
    <View style={{ flex: 1, marginLeft:15}}>
      <View
        style={{
          marginBottom: 10,
          marginRight: 10,
        }}
      >
        <ContentLoader
          speed={2}
          width={imageWidth}
          height={imageHeight}
          backgroundColor={SKELETON_BG}
          foregroundColor={SKELETON_FG}
        >
          <Rect
            x={0}
            y={0}
            rx={30}
            ry={30}
            width={imageWidth}
            height={imageHeight}
          />
        </ContentLoader>
      </View>
      <ContentLoader
        speed={2}
        width={imageWidth}
        height={20}
        backgroundColor={SKELETON_BG}
        foregroundColor={SKELETON_FG}
      >
        <Circle cx={imageWidth / 2 - 16} cy={10} r={4} />
        <Circle cx={imageWidth / 2} cy={10} r={4} />
        <Circle cx={imageWidth / 2 + 16} cy={10} r={4} />
      </ContentLoader>
      <View style={{ marginBottom: 10 }} />
    </View>
  );
}

function Carasole({ onScrollToCategories }: CarasoleProps) {
  const width = Dimensions.get("window").width;
  const currentIndex = useSharedValue(0);
  const token = useSelector((state: RootState) => state?.auth?.token);
  const appSyncReady = useSelector((state: RootState) => state.appSync?.ready);
  const isFocused = useIsFocused();
  const carouselRef = useRef<any>(null);
  const dispatch = useDispatch();

  const { data: categoriesData } = useFetchCategoriesQuery(
    {},
    { skip: !token || !appSyncReady },
  );
  const banners = useCachedCarouselBanners();

  useEffect(() => {
    if (carouselRef.current) {
      if (isFocused) {
        carouselRef.current?.startAutoplay();
      } else {
        carouselRef.current?.stopAutoplay();
      }
    }
  }, [isFocused]);

  const handleBannerPress = (banner: CarouselBannerDocument) => {
    if (banner.actionType === "scroll_categories") {
      onScrollToCategories?.();
      return;
    }

    if (banner.actionType !== "category" || !banner.categoryId) {
      return;
    }

    const categories = (categoriesData?.categories ?? []) as Category[];
    let selectedIndex = 0;
    let parentCategory: Category | undefined;

    for (const parent of categories) {
      const childIndex = parent.children.findIndex(
        (child: Category) => child._id === banner.categoryId,
      );
      if (childIndex >= 0) {
        parentCategory = parent;
        selectedIndex = childIndex;
        break;
      }
    }

    if (!parentCategory) return;

    dispatch(setCategoryData(parentCategory));

    router.push(
      `/(category)/${parentCategory._id}?name=${parentCategory.name}&selectedCategoryIdIndex=${selectedIndex}`,
    );
  };

  if (banners.length === 0) {
    return <CarouselSlotPlaceholder width={width} />;
  }

  return (
    <View style={{ flex: 1, marginHorizontal: 5 }}>
      <View
        style={{
          flex: 1,
          borderRadius: 30,
          overflow: "hidden",
          marginBottom: 10,
          marginRight: 10,
        }}
      >
        <Carousel
          ref={carouselRef}
          onIndexChanged={(index) => {
            currentIndex.value = index.index;
          }}
          mergeStyles
          horizontal
          showsDots={false}
          showsControls={false}
          loop
          width={width}
          height={width / 2}
        >
          {banners.map((item) => (
            <Pressable
              key={item.id}
              onPress={() => handleBannerPress(item)}
              style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Image
                source={{ uri: item.imageUrl }}
                contentFit="cover"
                transition={250}
                style={{
                  height: width / 2,
                  width: width - 20,
                  borderRadius: 30,
                  backgroundColor: SKELETON_BG,
                }}
                recyclingKey={`carousel-${item.id}`}
              />
            </Pressable>
          ))}
        </Carousel>
      </View>
      <Pagi data={banners} currentIndex={currentIndex} />
    </View>
  );
}

export default memo(Carasole);
