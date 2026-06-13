import { Image } from "expo-image";
import React, { memo, useEffect, useRef } from "react";
import {
  Dimensions,
  Image as RNImage,
  Pressable,
  View,
} from "react-native";
import Animated, { useSharedValue } from "react-native-reanimated";
import Pagi from "./Pagi";
import { router, useIsFocused } from "expo-router";
import {
  setCategoryData,
  useFetchCategoriesQuery,
} from "@/redux/features/categorySlice";
import { useDispatch, useSelector } from "react-redux";
import { Category, RootState } from "@/types/global";
import Carousel from "pinar";

type CarouselItem = {
  id: number;
  category: Pick<Category, "_id" | "name" | "children"> | null;
  imageUri: string;
};

const banner1Uri = RNImage.resolveAssetSource(
  require("../assets/images/banner1.png"),
).uri;

const banner2Uri = RNImage.resolveAssetSource(
  require("../assets/images/banner2.png"),
).uri;

const carouselData: CarouselItem[] = [
  {
    id: 0,
    category: null,
    imageUri: banner1Uri,
  },
  {
    id: 1,
    category: null,
    imageUri: banner2Uri,
  },
  {
    id: 2,
    category: {
      _id: "66a2498a50d9ec140942917d",
      name: "Dals & Pulses",
      children: [],
    },
    imageUri:
      "https://rukminim2.flixcart.com/fk-p-flap/960/420/image/4f42398937013ef1.jpg?q=100",
  },
  {
    id: 3,
    category: {
      _id: "67a5879461d60ec5eb8b4266",
      name: "Coffee",
      children: [],
    },
    imageUri:
      "https://rukminim2.flixcart.com/fk-p-flap/960/420/image/61725d49f1a21828.jpeg?q=100",
  },
  {
    id: 4,
    category: {
      _id: "67a5883461d60ec5eb8b426a",
      name: "Tea",
      children: [],
    },
    imageUri:
      "https://rukminim2.flixcart.com/fk-p-flap/960/420/image/4fb35b7f555375d7.jpeg?q=100",
  },
];

type CarasoleProps = {
  onScrollToCategories?: () => void;
};

function Carasole({ onScrollToCategories }: CarasoleProps) {
  const width = Dimensions.get("window").width;
  const currentIndex = useSharedValue(0);
  const token = useSelector((state: RootState) => state?.auth?.token);
  const isFocused = useIsFocused();
  const carouselRef = useRef<any>(null);
  const dispatch = useDispatch();

  const { data: categoriesData } = useFetchCategoriesQuery(
    {},
    { skip: !token }
  );

//console.log("isFocused", isFocused);

useEffect(() => {
  if (carouselRef.current) {
    if (isFocused) {
      carouselRef.current?.startAutoplay(); // ✅ correct method
    } else {
      carouselRef.current?.stopAutoplay(); // ✅ correct method
    }
  }
}, [isFocused]);

  return (
    <View style={{ flex: 1,marginHorizontal:5 }}>
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
           // console.log("index", index);
            currentIndex.value = index.index;
          }}
          mergeStyles
          horizontal

          showsDots={false}
          showsControls={false}
         // autoplay={isFocused}
          loop
          width={width}
          height={width / 2}

        >
          {carouselData.map((item) => (
            <Pressable
              key={item.id}
              onPress={() => {
                if (!item.category) {
                  onScrollToCategories?.();
                  return;
                }

                const selectedCategory = item.category;
                const categories = (categoriesData?.categories ?? []) as Category[];
                let selectedIndex = 0;
                let parentCategory: Category | undefined;

                for (const parent of categories) {
                  const childIndex = parent.children.findIndex(
                    (child: Category) => child._id === selectedCategory._id,
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
              }}
              style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Image
                source={{ uri: item.imageUri }}
                style={{
                  height: width / 2,
                  width: width - 20,
                  borderRadius: 30,
                }}
                contentFit="cover"
                recyclingKey={`carousel-${item.id}`}
              />
            </Pressable>
          ))}
        </Carousel>
       
      </View>
      <Pagi data={carouselData} currentIndex={currentIndex} />
    </View>
  );
}

export default memo(Carasole);
