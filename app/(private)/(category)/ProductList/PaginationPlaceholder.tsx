import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import React from "react";
import { Colors } from "@/constants/Colors";

const PaginationPlaceholder = () => {
  return (
    <View style={styles.paginationWrapper}>
      <View style={[styles.paginationContainer, { opacity: 0.5 }]}>
        <TouchableOpacity
          style={[styles.button, styles.disabledButton]}
          disabled={true}
        >
          <Text style={styles.buttonText}>Previous</Text>
        </TouchableOpacity>

        <View style={styles.pageInfo}></View>

        <TouchableOpacity
          style={[styles.button, styles.disabledButton]}
          disabled={true}
        >
          <Text style={styles.buttonText}>Next</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default PaginationPlaceholder;

const styles = StyleSheet.create({
  paginationWrapper: {
    position: "absolute",
    bottom: Platform.OS === "android" ? 20 : 0,
    alignSelf: "center",
    width: "100%",
    paddingHorizontal: 10,
    zIndex: 8,
  },
  paginationContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    backgroundColor: Colors.light.background,
    borderRadius: 8,
    shadowColor: Colors.light.darkGrey,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  button: {
    backgroundColor: Colors.light.gradientGreen_2,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    minWidth: 100,
    alignItems: "center",
  },
  disabledButton: {
    backgroundColor: Colors.light.lightGrey,
  },
  buttonText: {
    color: Colors.light.white,
    fontSize: 16,
    fontWeight: "bold",
  },
  pageInfo: {
    alignItems: "center",
  },
  pageText: {
    fontSize: 16,
    fontWeight: "bold",
    color: Colors.light.darkGrey,
  },
  loaderContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
  loadingText: {
    marginLeft: 10,
    fontSize: 14,
    color: Colors.light.darkGrey,
  },
});
