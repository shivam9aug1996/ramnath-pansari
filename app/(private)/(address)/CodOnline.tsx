import { Pressable, StyleSheet, Text, View } from "react-native";
import React, { useState } from "react";
import BottomSheet from "@/components/BottomSheet";

const CodOnline = ({ setIsPayModal, isPayModal }) => {
  const [isOpen, setIsOpen] = useState(false);
  if (isOpen) {
    return (
      <>
        <BottomSheet
          onClose={() => {
           // console.log("closed");
            setIsOpen(false);
          }}
        >
          <Text>hi</Text>
        </BottomSheet>
      </>
    );
  } else {
    return (
      <Pressable
        onPress={() => {
          setIsOpen(true);
        }}
      >
        <Text>Open</Text>
      </Pressable>
    );
  }
};

export default CodOnline;

const styles = StyleSheet.create({});
