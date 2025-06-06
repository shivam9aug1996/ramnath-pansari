import { StyleSheet } from "react-native";
import React from "react";
import Login from "@/screens/login";
import AppTransition from "@/components/AppTransition";
const login = () => {
  return <AppTransition><Login /></AppTransition>;
};

export default login;

const styles = StyleSheet.create({});
