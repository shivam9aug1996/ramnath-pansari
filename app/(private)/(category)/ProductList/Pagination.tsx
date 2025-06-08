import React, { memo } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Colors } from "@/constants/Colors";
import { PaginationProps } from "@/types/global";
import { Platform } from "react-native";

const Pagination = ({
  page,
  totalPages,
  isFetching,
  onNext,
  onPrevious,
}: PaginationProps) => {
  return (
    <View style={styles.paginationWrapper}>
      <View
        style={[styles.paginationContainer, { opacity: isFetching ? 0.5 : 1 }]}
      >
        <TouchableOpacity
          style={[styles.button, page === 1 && styles.disabledButton]}
          onPress={onPrevious}
          disabled={page === 1 || isFetching}
        >
          <Text style={styles.buttonText}>Previous</Text>
        </TouchableOpacity>

        <View style={styles.pageInfo}>
          {!isFetching && (
            <Text style={styles.pageText}>{`${page} / ${totalPages}`}</Text>
          )}
        </View>

        <TouchableOpacity
          style={[styles.button, page === totalPages && styles.disabledButton]}
          onPress={onNext}
          disabled={page === totalPages || isFetching}
        >
          <Text style={styles.buttonText}>Next</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default memo(Pagination);

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
