import { StyleSheet, Text, View } from "react-native";
import React from "react";
import usePusher from "./usePusher";
import Button from "@/components/Button";

const Push = () => {
  const { isConnected, error, startSocket, closeSocket, message } = usePusher(
    "a7a14b0a75a3d073c905",
    "ap2"
  );
  console.log("876thjkl", error);
  return (
    <View>
      <Text>Push</Text>
      <Button
        title="start"
        onPress={() => {
          startSocket("c1", "e1");
        }}
      />
      <Button
        onPress={() => {
          closeSocket();
        }}
        title="close"
      />
    </View>
  );
};

export default Push;

const styles = StyleSheet.create({});
