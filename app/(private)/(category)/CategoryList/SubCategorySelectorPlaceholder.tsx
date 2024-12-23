import { FlatList, StyleSheet } from "react-native";
import React, { memo } from "react";
import ContentLoader, { Rect } from "react-content-loader/native";
import { categoryListPlaceholder } from "./utils";

const SubCategorySelectorPlaceholder = () => {
  const renderLoader = (index: number) => {
    return (
      <ContentLoader
        key={index}
        speed={2}
        width={index == 0 ? 50 : 84}
        height={36.7}
        backgroundColor="#f3f3f3"
        foregroundColor="#ecebeb"
        style={styles.loaderStyle}
      >
        {index == 0 ? (
          <Rect rx={20} ry={20} width="50" height="36.7" />
        ) : (
          <Rect rx={20} ry={20} width="84" height="36.7" />
        )}
      </ContentLoader>
    );
  };
  const renderSubCategory = ({ item, index }: { item: any; index: number }) =>
    renderLoader(index);

  return (
    <FlatList
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
    marginRight: 10,
    marginBottom: 10,
    marginTop: 10,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
  },
  subCategoryContainer: {
    marginRight: 10,
    marginBottom: 10,
    marginTop: 10,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
  },
  subCategoryText: {
    fontSize: 14,
  },
});
