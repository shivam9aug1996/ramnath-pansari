import { StyleSheet, TouchableOpacity, View } from "react-native";
import React from "react";
import BottomSheet from "@/components/BottomSheet";
import WebMapRenderer from "./WebMapRenderer";
import { router } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons"; // 👈 Import MaterialIcons

const MapBottomSheet = ({
  latitude,
  longitude,
  visible,
  onClose,
}: {
  latitude: string;
  longitude: string;
  visible: boolean;
  onClose: () => void;
}) => {
  return (
    <View
      style={{
        flex: 1,
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        height: visible ? "100%" : 0,
        width: visible ? "100%" : 0,
        zIndex: visible ? 1 : 0,
        marginTop: 40,
        paddingBottom: 40,
      }}
    >
      {visible && (
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <MaterialIcons name="close" size={24} color="white" />
        </TouchableOpacity>
      )}
      <WebMapRenderer
        latitude={latitude}
        longitude={longitude}
        onDone={onClose}
        visible={visible}
      />
    </View>
  );
};

export default MapBottomSheet;

const styles = StyleSheet.create({
  closeButton: {
    position: "absolute",
    top: 0,
    right: -15,
    zIndex: 1000,
    backgroundColor: "black",
    padding: 8,
    borderRadius: 20,
  },
});
