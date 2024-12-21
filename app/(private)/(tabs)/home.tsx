import { StyleSheet, Text, View } from "react-native";
import React, { lazy } from "react";
import CustomSuspense from "@/components/CustomSuspense";
import PrivateHome from "@/components/PrivateHome";
import ScrollHideHeader from "@/components/ScrollHideHeader";

const home = () => {
  return (
    <CustomSuspense fallback={null}>
      <PrivateHome />
      {/* <ScrollHideHeader /> */}
    </CustomSuspense>
  );
};

export default home;

const styles = StyleSheet.create({});
