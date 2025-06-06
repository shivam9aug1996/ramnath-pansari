import React from "react";
import { StyleSheet, Text, View, FlatList, Dimensions, Platform } from "react-native";

// Generate random grocery categories
const generateRandomCategories = () => {
  const categories = ["All", "Apple", "Mango", "Banana", "Kiwi"];
  return categories.map((category, index) => ({
    id: `${index}`,
    name: category,
  }));
};

const Cat2 = () => {
  const data = generateRandomCategories();

  const renderItem = ({ item }) => (
    <View style={styles.item}>
      <Text style={styles.text}>{item.name}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
      bounces={Platform.OS === "android" ? false : true}
        data={data}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
};

export default Cat2;

const styles = StyleSheet.create({
  container: {
    // flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
  },
  listContainer: {
    paddingHorizontal: 10,
  },
  item: {
    backgroundColor: "#f0f0f0",
    padding: 20,
    marginHorizontal: 10,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    fontSize: 16,
    fontWeight: "bold",
  },
});
