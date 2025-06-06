import { StyleSheet, Text, View } from "react-native";
import React from "react";
import AppTransition from "@/components/AppTransition";
import VerifyOtp from "@/screens/verifyOtp";

const verify = () => {
  return <AppTransition><VerifyOtp /></AppTransition>;
};

export default verify;