import { StyleSheet, Text, View } from "react-native";
import React, { memo } from "react";
import { Category } from "@/types/global";
import CategorySelector from "@/app/(private)/(category)/CategoryList/CategorySelector";

const emojiMap: Record<string, string> = {
  "Staples": "🌾",
  "Packaged Food": "🍱",
  "Dairy & Bakery": "🧈",
};

const CategoryCard = ({
  category,
  onSelect,
  index = 0,
  length = 0,
}: {
  category: Category;
  onSelect: any;
  index?: number;
  length?: number;
}) => {
  const emoji = emojiMap[category?.name] || "🛒";

  return (
    <View style={[styles.cardWrapper, { marginBottom: index !== length - 1 ? 16 : 0 }]}>
      <View style={styles.categoryCard}>
        <View style={styles.titleRow}>
          <Text style={styles.emoji}>{emoji}</Text>
          <Text style={styles.categoryTitleText}>{category?.name}</Text>
        </View>

        <View style={styles.childrenContainer}>
          <CategorySelector
            categories={category?.children}
            onSelectCategory={(data, childIndex) => onSelect(data, category, childIndex)}
            variant="large"
          />
        </View>
      </View>
    </View>
  );
};

export default memo(CategoryCard);

const styles = StyleSheet.create({
  cardWrapper: {
    paddingHorizontal:20
  },
  categoryCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingVertical:16
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  emoji: {
    fontSize: 22,
    marginRight: 8,
  },
  categoryTitleText: {
    fontFamily: "Raleway_700Bold",
    fontSize: 16,
    color: "#222",
  },
  childrenContainer: {
    marginTop: 8,
  },
});
