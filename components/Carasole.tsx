import { Image } from "expo-image";
import React, { memo, useEffect, useRef } from "react";
import {
  Dimensions,
  Pressable,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
// import Carousel from "react-native-reanimated-carousel";
import Animated, { useSharedValue } from "react-native-reanimated";
import Pagi from "./Pagi";
import { router } from "expo-router";
import { setCategoryData, useFetchCategoriesQuery } from "@/redux/features/categorySlice";
import { useSelector } from "react-redux";
import { RootState } from "@/types/global";
import { staticImage } from "@/app/(private)/(category)/CategoryList/utils";
import Carousel from "pinar";
import { useIsFocused } from "@react-navigation/native";
import DeferredFadeIn from "./DeferredFadeIn";
import { useDispatch } from "react-redux";

const carouselData = [
  {
    id: 1,
    category: {
      _id: "66a2498a50d9ec140942917d",
      name: "Dals & Pulses",
      children: [],
    },
    image:
      "https://rukminim2.flixcart.com/fk-p-flap/960/420/image/4f42398937013ef1.jpg?q=100"
  },
  {
    id: 2,
    category: {
      _id: "67a5879461d60ec5eb8b4266",
      name: "Coffee",
      children: [],
    },
    image:
      "https://rukminim2.flixcart.com/fk-p-flap/960/420/image/61725d49f1a21828.jpeg?q=100",
  },
  {
    id: 3,
    category: {
      _id: "67a5883461d60ec5eb8b426a",
      name: "Tea",
      children: [],
    },
    image:
      "https://rukminim2.flixcart.com/fk-p-flap/960/420/image/4fb35b7f555375d7.jpeg?q=100"
  },
 
];

function Carasole() {
  const width = Dimensions.get("window").width;
  const currentIndex = useSharedValue(0);
  const token = useSelector((state: RootState) => state?.auth?.token);
  const isFocused = useIsFocused();
  const carouselRef = useRef<Carousel>(null);
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
          {carouselData?.map((item, index) => {
            return <Pressable
              key={item?.id}
              onPress={() => {
               // console.log("carsole_pressed", item);
                const selectedCategory = item?.category;
                let selectedIndex = 0;
                let parentCategory = null;
                categoriesData?.categories?.forEach((item1) => {
                  item1?.children.map((item, index) => {
                   // console.log("65ewsdfghjkl", item?.name);
                    if (item?._id === selectedCategory?._id) {
                      parentCategory = item1;
                      selectedIndex = index;
                    }
                  });
                });
                const selectedCategory1 = categoriesData?.categories.find(
                  (item) => {
                    return item?._id == parentCategory?._id
                  }
                );
                dispatch(setCategoryData(selectedCategory1))

              //  console.log({ selectedIndex, parentCategory });
              router.push(`/(category)/${parentCategory?._id?.toString()}?name=${parentCategory?.name}&selectedCategoryIdIndex=${selectedIndex?.toString()}`)

               

              }}
              style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Image
                source={{
                  uri: item?.image || staticImage,
                }}
                style={{
                  height: width / 2,
                  width: width - 20,
                  borderRadius: 30,
                }}
                contentFit={"cover"}
              />
            </Pressable>
          })}
        </Carousel>
       
      </View>
      <Pagi data={carouselData} currentIndex={currentIndex} />
    </View>
  );
}

export default memo(Carasole);
