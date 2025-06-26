import { StyleSheet, Text, View } from "react-native";
import React, { lazy } from "react";
import CustomSuspense from "@/components/CustomSuspense";
import PrivateHome from "@/components/PrivateHome";
import ScrollHideHeader from "@/components/ScrollHideHeader";
import WithoutDeferred from "@/components/WithoutDeferred";
import { SafeAreaView } from "react-native-safe-area-context";
import WithDeferred from "@/components/WithDeferred";

const home = () => {
  // return <SafeAreaView>
  //   <WithDeferred />
  // </SafeAreaView>
  return (
    <PrivateHome />
  );
};

export default home;

const styles = StyleSheet.create({});
