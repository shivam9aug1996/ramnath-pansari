import { StyleSheet, Text, View } from "react-native";
import React from "react";
import { useLocalSearchParams } from "expo-router";
import CatPro from "@/components/CatPro";

const cat = () => {
  const { id, name, selectedCategoryIdIndex } = useLocalSearchParams<{
    id: string;
    name?: string;
  }>();
  return (
    <CatPro
      id={id}
      name={name}
      selectedCategoryIdIndex={selectedCategoryIdIndex}
    />
  );
};

export default cat;

const styles = StyleSheet.create({});
