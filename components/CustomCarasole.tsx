import { Image } from "expo-image";
import React, { memo, useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  Platform,
  TouchableOpacity,
  View,
  ViewToken,
} from "react-native";
import { router } from "expo-router";
import { useFetchCategoriesQuery } from "@/redux/features/categorySlice";
import { useSelector } from "react-redux";
import { RootState } from "@/types/global";
import { staticImage } from "@/app/(private)/(category)/CategoryList/utils";

const carouselData = [
  {
    id: 1,
    category: {
      _id: "66a24ac950d9ec140942918b",
      name: "Atta & Flours",
      children: [],
    },
    image:
      "https://rukminim2.flixcart.com/fk-p-flap/960/420/image/107ad841d07533a9.jpg?q=100",
  },
  {
    id: 2,
    category: {
      _id: "66a2498a50d9ec140942917d",
      name: "Dals & Pulses",
      children: [],
    },
    image:
      "https://rukminim2.flixcart.com/fk-p-flap/480/210/image/e5044575b65e3823.jpeg?q=100",
  },
];

function CustomCarasole() {
  const width = Dimensions.get("window").width;
  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const token = useSelector((state: RootState) => state?.auth?.token);
  const viewabilityConfig = { viewAreaCoveragePercentThreshold: 50 };

  const { data: categoriesData } = useFetchCategoriesQuery(
    {},
    { skip: !token }
  );

  const onViewableItemsChanged = React.useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0) {
        setCurrentIndex(viewableItems[0].index || 0);
      }
    },
    []
  );

  const viewabilityConfigCallbackPairs = useRef([
    { viewabilityConfig, onViewableItemsChanged },
  ]);

  // Auto-scroll functionality
  React.useEffect(() => {
    const timer = setInterval(() => {
      if (flatListRef.current) {
        const nextIndex = (currentIndex + 1) % carouselData.length;
        flatListRef.current.scrollToIndex({
          index: nextIndex,
          animated: true,
        });
      }
    }, 3000); // Change slide every 3 seconds

    return () => clearInterval(timer);
  }, [currentIndex]);

  const renderItem = ({ item }: { item: typeof carouselData[0] }) => (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => {
       // console.log("carousel_pressed", item);
        const selectedCategory = item?.category;
        let selectedIndex = 0;
        let parentCategory = null;
        categoriesData?.categories?.forEach((item1) => {
          item1?.children.map((item, index) => {
            if (item?._id === selectedCategory?._id) {
              parentCategory = item1;
              selectedIndex = index;
            }
          });
        });
        router.push({
          pathname: `/(category)/${parentCategory?._id}`,
          params: {
            name: parentCategory?.name,
            selectedCategoryIdIndex: selectedIndex,
          },
        });
      }}
      style={{
        width: width,
        height: width * 0.4,
      }}
    >
      <Image
        source={{ uri: item?.image || staticImage }}
        style={{
          width: "100%",
          height: "100%",
          borderRadius: 0,
        }}
        contentFit="cover"
      />
    </TouchableOpacity>
  );

  return (
    <View style={{ marginBottom: 15 }}>
      <FlatList
      bounces={Platform.OS === "android" ? false : true}
        ref={flatListRef}
        data={carouselData}
        renderItem={renderItem}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        viewabilityConfigCallbackPairs={viewabilityConfigCallbackPairs.current}
        onScrollToIndexFailed={(info) => {
          const wait = new Promise((resolve) => setTimeout(resolve, 500));
          wait.then(() => {
            flatListRef.current?.scrollToIndex({
              index: info.index,
              animated: true,
            });
          });
        }}
      />
      <View
        style={{
          flexDirection: "row",
          justifyContent: "center",
          marginTop: 8,
          position: "absolute",
          bottom: 10,
          left: 0,
          right: 0,
        }}
      >
        {carouselData.map((_, index) => (
          <View
            key={index}
            style={{
              width: 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: currentIndex === index ? "#fff" : "rgba(255,255,255,0.5)",
              marginHorizontal: 3,
            }}
          />
        ))}
      </View>
    </View>
  );
}

export default memo(CustomCarasole);