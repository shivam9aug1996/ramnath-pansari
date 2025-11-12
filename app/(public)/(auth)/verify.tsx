import { StyleSheet, Text, View } from "react-native";
import React from "react";
import AppTransition from "@/components/AppTransition";
import VerifyOtp from "@/screens/verifyOtp";
import VerifyPassword from "@/screens/verifyOtp/VerifyPassword";

const verify = () => {
  //return <VerifyOtp />
  return <VerifyPassword />
};

export default verify;