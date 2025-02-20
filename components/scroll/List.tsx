import React from "react";
import { StyleSheet, Text, View, FlatList, Platform } from "react-native";

// Helper function to generate random names
const generateRandomNames = (count) => {
  const names = [];
  const firstNames = [
    "John",
    "Jane",
    "Sam",
    "Alex",
    "Chris",
    "Emily",
    "Sophia",
    "Liam",
    "Noah",
    "Mia",
  ];
  const lastNames = [
    "Smith",
    "Johnson",
    "Brown",
    "Taylor",
    "Anderson",
    "Thomas",
    "Lee",
    "White",
    "Harris",
    "Clark",
  ];

  for (let i = 0; i < count; i++) {
    const randomFirstName =
      firstNames[Math.floor(Math.random() * firstNames.length)];
    const randomLastName =
      lastNames[Math.floor(Math.random() * lastNames.length)];
    names.push({ id: `${i}`, name: `${randomFirstName} ${randomLastName}` });
  }
  return names;
};

const List = () => {
  const data = generateRandomNames(100);

  const renderItem = ({ item }) => (
    <View style={styles.item}>
      <Text style={styles.text}>{item.name}</Text>
    </View>
  );

  return (
    <FlatList
    bounces={Platform.OS === "android" ? false : true}
      data={data}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
    />
  );
};

export default List;

const styles = StyleSheet.create({
  item: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  text: {
    fontSize: 16,
  },
});
