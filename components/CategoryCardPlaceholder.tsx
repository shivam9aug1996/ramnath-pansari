import { StyleSheet, View } from "react-native";
import React, { memo } from "react";
import { imageBorderStyle } from "@/app/(private)/(category)/CategoryList/utils";
import { arrayColor } from "@/app/(private)/(category)/CategoryList/constants";
import ContentLoader, { Rect } from "react-content-loader/native";
import CategorySelectorPlaceholder from "@/app/(private)/(category)/CategoryList/CategorySelectorPlaceholder";

const CategoryCardPlaceholder = () => {
  const borderStyle = imageBorderStyle(arrayColor, false, Math.random());

  const renderTitleLoader = () => {
    return (
      <ContentLoader
        speed={2}
        width={100}
        height={20}
        backgroundColor="#f3f3f3"
        foregroundColor="#ecebeb"
      >
        <Rect rx={5} ry={5} width="100" height="15" />
      </ContentLoader>
    );
  };

  return (
    <View style={styles.categoryCard}>
      <View style={[styles.categoryTitleContainer, borderStyle]}>
        {renderTitleLoader()}
      </View>
      <CategorySelectorPlaceholder />
    </View>
  );
};

export default memo(CategoryCardPlaceholder);

const styles = StyleSheet.create({
  categoryCard: {
    flex: 1,
    flexDirection: "column",
    marginBottom: 40,
  },
  categoryTitleContainer: {
    borderRadius: 23,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderWidth: 1,
    alignSelf: "flex-start",
  },
}); 