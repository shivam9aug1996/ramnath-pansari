import React, { memo } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Colors } from "@/constants/Colors";

type OrderPaginationBarProps = {
  page: number;
  totalPages: number;
  isFetching: boolean;
  onPrevious: () => void;
  onNext: () => void;
};

const OrderPaginationBar = ({
  page,
  totalPages,
  isFetching,
  onPrevious,
  onNext,
}: OrderPaginationBarProps) => {
  if (totalPages <= 1) return null;

  const atFirst = page <= 1;
  const atLast = page >= totalPages;

  return (
    <View style={[styles.container, isFetching && styles.containerLoading]}>
      <TouchableOpacity
        style={[styles.button, atFirst && styles.buttonDisabled]}
        onPress={onPrevious}
        disabled={atFirst || isFetching}
      >
        <Text style={[styles.buttonText, atFirst && styles.buttonTextDisabled]}>
          Previous
        </Text>
      </TouchableOpacity>

      <Text style={styles.pageText}>
        {isFetching ? "Loading..." : `${page} / ${totalPages}`}
      </Text>

      <TouchableOpacity
        style={[styles.button, atLast && styles.buttonDisabled]}
        onPress={onNext}
        disabled={atLast || isFetching}
      >
        <Text style={[styles.buttonText, atLast && styles.buttonTextDisabled]}>
          Next
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default memo(OrderPaginationBar);

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginTop: 8,
    marginBottom: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8E5",
  },
  containerLoading: {
    opacity: 0.7,
  },
  button: {
    minWidth: 96,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: Colors.light.gradientGreen_2,
    alignItems: "center",
  },
  buttonDisabled: {
    backgroundColor: Colors.light.lightGrey,
  },
  buttonText: {
    fontFamily: "Montserrat_600SemiBold",
    fontSize: 14,
    color: Colors.light.white,
  },
  buttonTextDisabled: {
    color: Colors.light.mediumGrey,
  },
  pageText: {
    fontFamily: "Montserrat_600SemiBold",
    fontSize: 14,
    color: Colors.light.darkGrey,
    paddingHorizontal: 8,
  },
});
