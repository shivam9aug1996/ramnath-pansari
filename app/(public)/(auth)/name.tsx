import { StyleSheet, Text, View } from "react-native";
import React from "react";
import Name from "@/screens/name";
import AppTransition from "@/components/AppTransition";
const name = () => {
  return <AppTransition><Name /></AppTransition>;
};

export default name;

const styles = StyleSheet.create({});
