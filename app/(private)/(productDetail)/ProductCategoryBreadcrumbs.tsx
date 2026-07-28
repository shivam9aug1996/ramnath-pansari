import React, { memo, useCallback } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { useDispatch } from "react-redux";

import { Colors } from "@/constants/Colors";
import { fonts } from "@/constants/Fonts";
import type { Category } from "@/types/global";
import type { CategoryPathItem } from "@/utils/categoryPath";
import { setCategoryData } from "@/redux/features/categorySlice";
import { setSelectedSubCategoryId } from "@/redux/features/productSlice";

type Props = {
  breadcrumbs: CategoryPathItem[];
  categories: Category[];
};

const ProductCategoryBreadcrumbs = ({ breadcrumbs, categories }: Props) => {
  const dispatch = useDispatch();

  const handlePress = useCallback(
    (index: number) => {
      
      if(router.canGoBack()) {
        router.back();
      }else{
        router.navigate('/home');
      }
      return;

      const rootId = breadcrumbs[0]?._id;
      if (!rootId) return;

      const root = categories.find((c) => c._id === rootId);
      if (!root) return;

      dispatch(setCategoryData(root));

      let selectedCategoryIdIndex = 0;
      if (breadcrumbs.length >= 2) {
        const l2Id = breadcrumbs[1]._id;
        const l2Index = root.children?.findIndex((c) => c._id === l2Id) ?? -1;
        selectedCategoryIdIndex = Math.max(0, l2Index);
      }

      // Leaf (L3+) → select that subcategory; L1/L2 → reset to "all"
      if (index >= 2 && breadcrumbs[index]) {
        dispatch(
          setSelectedSubCategoryId({
            _id: breadcrumbs[index]._id,
            name: breadcrumbs[index].name,
          }),
        );
      } else {
        dispatch(setSelectedSubCategoryId("null"));
      }
      
      router.navigate(
        `/(category)/${root._id}?name=${encodeURIComponent(root.name)}&selectedCategoryIdIndex=${selectedCategoryIdIndex}`,
      );
    },
    [breadcrumbs, categories, dispatch],
  );

  if (breadcrumbs.length === 0) return null;

  return (
    <View style={styles.row}>
      {breadcrumbs.map((crumb, index) => {
        const isLast = index === breadcrumbs.length - 1;
        return (
          <View key={crumb._id} style={styles.crumbWrap}>
            {index > 0 ? <Text style={styles.sep}>›</Text> : null}
            {isLast ? (
              <Text style={styles.current} numberOfLines={1}>
                {crumb.name}
              </Text>
            ) : (
              <Pressable
                accessibilityRole="link"
                onPress={() => handlePress(index)}
                hitSlop={6}
              >
                <Text style={styles.link} numberOfLines={1}>
                  {crumb.name}
                </Text>
              </Pressable>
            )}
          </View>
        );
      })}
    </View>
  );
};

export default memo(ProductCategoryBreadcrumbs);

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    marginBottom: 10,
    paddingHorizontal: 2,
    gap: 2,
  },
  crumbWrap: {
    flexDirection: "row",
    alignItems: "center",
    maxWidth: "100%",
  },
  sep: {
    marginHorizontal: 4,
    color: Colors.light.mediumLightGrey,
    fontFamily: fonts.defaultMedium.fontFamily,
    fontSize: 12,
  },
  link: {
    color: Colors.light.linkText,
    fontFamily: fonts.defaultMedium.fontFamily,
    fontSize: 12,
  },
  current: {
    color: Colors.light.mediumGrey,
    fontFamily: fonts.defaultMedium.fontFamily,
    fontSize: 12,
  },
});
