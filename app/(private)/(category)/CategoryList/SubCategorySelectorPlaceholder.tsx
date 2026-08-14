import { FlatList, Platform, StyleSheet, View } from "react-native";
import React, { memo } from "react";
import ContentLoader, { Rect } from "react-content-loader/native";
import { categoryListPlaceholder } from "./utils";

const SubCategorySelectorPlaceholder = ({ contentContainerStyle }) => {
  const renderLoader = (index: number) => {
    const width = index === 0 ? 50 : 84;

    if (Platform.OS === "web") {
      return (
        <View
          key={index}
          style={[
            styles.loaderStyle,
            {
              width,
              height: 28,
              backgroundColor: "#f3f3f3",
            },
          ]}
        />
      );
    }

    return (
      <ContentLoader
        key={index}
        speed={2}
        width={width}
        height={28}
        backgroundColor="#f3f3f3"
        foregroundColor="#ecebeb"
        style={styles.loaderStyle}
      >
        {index === 0 ? (
          <Rect rx={14} ry={14} width="50" height="28" />
        ) : (
          <Rect rx={14} ry={14} width="84" height="28" />
        )}
      </ContentLoader>
    );
  };
  const renderSubCategory = ({ item, index }: { item: any; index: number }) =>
    renderLoader(index);

  return (
    <FlatList
    bounces={Platform.OS === "android" ? false : true}
      contentContainerStyle={contentContainerStyle}
      data={categoryListPlaceholder[0].children}
      horizontal
      keyExtractor={(item) => item._id}
      showsHorizontalScrollIndicator={false}
      renderItem={renderSubCategory}
    />
  );
};

export default memo(SubCategorySelectorPlaceholder);

const styles = StyleSheet.create({
  loaderStyle: {
    marginRight: 8,
    marginBottom: 6,
    marginTop: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  subCategoryContainer: {
    marginRight: 8,
    marginBottom: 6,
    marginTop: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  subCategoryText: {
    fontSize: 12,
  },
});
