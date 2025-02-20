import React, { memo } from "react";
import {
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import ContentLoader, { Rect } from "react-content-loader/native";
import { Colors } from "@/constants/Colors";

const PLACEHOLDER_DATA = Array.from({ length: 5 }, (_, index) => ({
  _id: `${index + 1}`,
}));

const RecentSearchPlaceholder = () => {
  const renderItem = ({ index }: { index: number }) => (
    <TouchableOpacity style={styles.item} key={index}>
      <ContentLoader
        speed={2}
        width="100%"
        height={30}
        backgroundColor="#f3f3f3"
        foregroundColor="#ecebeb"
        style={styles.loaderContent}
      >
        <Rect rx={5} ry={5} width="100%" height={40} />
      </ContentLoader>
    </TouchableOpacity>
  );

  return (
    <FlatList
    bounces={Platform.OS === "android" ? false : true}
      data={PLACEHOLDER_DATA}
      keyExtractor={(item) => item._id}
      renderItem={renderItem}
      ListHeaderComponent={<Text style={styles.title}>Recent Searches</Text>}
      keyboardShouldPersistTaps="always"
      showsVerticalScrollIndicator={false}
    />
  );
};

export default memo(RecentSearchPlaceholder);

const styles = StyleSheet.create({
  title: {
    fontSize: 15,
    marginBottom: 10,
    marginTop: 20,
    fontFamily: "Raleway_700Bold",
    color: Colors.light.darkGreen,
  },
  item: {
    backgroundColor: "#F1F4F3",
    marginBottom: 15,
    borderRadius: 18,
    padding: 10,
  },
  loaderContent: {
    width: "100%",
  },
});
