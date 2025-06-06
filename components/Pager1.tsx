import React from "react";
import {
  StyleSheet,
  Text,
  View,
  Image,
  Dimensions,
  Animated,
  ImageRequireSource,
} from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import PagerView from "react-native-pager-view";

const data = [
  {
    type: "Humlan P",
    imageUri: require("../assets/images/urbanears_blue.png"),
    heading: "Vibrant colors",
    description: "Four on-trend colorways to seamlessly suit your style.",
    key: "first",
    color: "#9dcdfa",
  },
  {
    type: "Pampas",
    imageUri: require("../assets/images/urbanears_pink.png"),
    heading: "Redefined sound",
    description: "A bold statement tuned to perfection.",
    key: "second",
    color: "#db9efa",
  },
  {
    type: "Humlan P",
    imageUri: require("../assets/images/urbanears_grey.png"),
    heading: "Great quality",
    description:
      "An Urbanears classic! Listen-all-day fit. Striking the perfect balance of effortless technology",
    key: "third",
    color: "#999",
  },
  {
    type: "Humlan B",
    imageUri: require("../assets/images/urbanears_mint.png"),
    heading: "From Sweden",
    description:
      "The “Plattan” in Plattan headphones is Swedish for “the slab.”",
    key: "fourth",
    color: "#a1e3a1",
  },
];
const { width } = Dimensions.get("window");
const CAROUSEL_HEIGHT = width * 0.75; // Define the carousel's height
const DOT_SIZE = 12;

const Item = ({
  imageUri,
  heading,
  description,
}: {
  imageUri: ImageRequireSource;
  description: string;
  heading: string;
}) => {
  return (
    <View style={styles.itemStyle}>
      <Image source={imageUri} style={styles.imageStyle} />
      {/* <View style={styles.textContainer}>
        <Text style={styles.heading}>{heading}</Text>
        <Text style={styles.description}>{description}</Text>
      </View> */}
    </View>
  );
};

const Pagination = ({
  scrollOffsetAnimatedValue,
  positionAnimatedValue,
}: {
  scrollOffsetAnimatedValue: Animated.Value;
  positionAnimatedValue: Animated.Value;
}) => {
  const translateX = Animated.add(
    scrollOffsetAnimatedValue,
    positionAnimatedValue
  ).interpolate({
    inputRange: [0, data.length],
    outputRange: [0, data.length * DOT_SIZE * 2],
  });

  return (
    <View style={styles.paginationContainer}>
      <Animated.View
        style={[
          styles.paginationIndicator,
          {
            transform: [{ translateX }],
          },
        ]}
      />
      {data.map((item) => (
        <View key={item.key} style={styles.paginationDotContainer}>
          <View
            style={[styles.paginationDot, { backgroundColor: item.color }]}
          />
        </View>
      ))}
    </View>
  );
};

const AnimatedPagerView = Animated.createAnimatedComponent(PagerView);

export default function HeadphonesCarousel() {
  const scrollOffsetAnimatedValue = React.useRef(new Animated.Value(0)).current;
  const positionAnimatedValue = React.useRef(new Animated.Value(0)).current;

  return (
    <ScrollView
      nestedScrollEnabled={false}
      contentContainerStyle={styles.carouselContainer}
    >
      <AnimatedPagerView
        initialPage={0}
        style={styles.carousel}
        onPageScroll={Animated.event(
          [
            {
              nativeEvent: {
                offset: scrollOffsetAnimatedValue,
                position: positionAnimatedValue,
              },
            },
          ],
          { useNativeDriver: true }
        )}
      >
        {data.map(({ key, ...item }, index) => (
          <View key={key}>
            <Item key={key} {...item} />
          </View>
        ))}
      </AnimatedPagerView>

      {/* Pagination */}
      <Pagination
        scrollOffsetAnimatedValue={scrollOffsetAnimatedValue}
        positionAnimatedValue={positionAnimatedValue}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  carouselContainer: {
    height: CAROUSEL_HEIGHT,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  carousel: {
    width: "100%",
    height: "100%",
  },
  itemStyle: {
    width: width * 0.85, // Slightly smaller than screen width
    height: CAROUSEL_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
  },
  imageStyle: {
    width: "80%",
    height: "60%",
    resizeMode: "contain",
  },
  textContainer: {
    marginTop: 10,
    alignItems: "center",
  },
  heading: {
    color: "#444",
    textTransform: "uppercase",
    fontSize: 18,
    fontWeight: "800",
    textAlign: "center",
  },
  description: {
    color: "#888",
    fontWeight: "600",
    textAlign: "center",
    marginTop: 5,
    fontSize: 14,
    lineHeight: 20,
  },
  paginationContainer: {
    position: "absolute",
    bottom: 20,
    flexDirection: "row",
    // justifyContent: "center",
    alignItems: "center",
    // gap: 2.5,
  },
  paginationDotContainer: {
    margin: 6,
  },
  paginationDot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
  },
  paginationIndicator: {
    position: "absolute",
    width: DOT_SIZE * 2,
    height: DOT_SIZE * 2,
    borderRadius: DOT_SIZE,
    borderWidth: 2,
    borderColor: "#ddd",
  },
});
