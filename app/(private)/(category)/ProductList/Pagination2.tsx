import React, { memo } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Colors } from "@/constants/Colors";
import { PaginationProps } from "@/types/global";
import { Platform } from "react-native";

const Pagination2 = ({
  page,
  totalPages,
  isFetching,
  onNext,
  onPrevious,
  onPress,
}: PaginationProps) => {
  console.log("pagination------>");

  // Helper function to generate page numbers
  const generatePageArray = () => {
    let pages = [];
    const maxPagesToShow = 5; // Maximum number of page buttons to show at once

    if (totalPages <= maxPagesToShow) {
      // If the total pages are less than or equal to the max pages to show, just return all pages
      pages = [...Array(totalPages).keys()].map((x) => x + 1);
    } else {
      // Otherwise, show a limited range and use ellipsis for overflow
      if (page <= 3) {
        pages = [1, 2, 3, 4, "..."];
      } else if (page >= totalPages - 2) {
        pages = [
          "...",
          totalPages - 3,
          totalPages - 2,
          totalPages - 1,
          totalPages,
        ];
      } else {
        pages = ["...", page - 1, page, page + 1, "..."];
      }
    }

    return pages;
  };

  const pageArray = generatePageArray();

  return (
    <View style={styles.paginationWrapper}>
      <View style={styles.paginationContainer}>
        <TouchableOpacity
          style={[
            styles.arrowButton,
            {
              opacity: page === 1 || isFetching ? 0.5 : 1,
            },
          ]}
          onPress={onPrevious}
          disabled={page === 1 || isFetching}
        >
          <Text style={styles.arrowButtonText}>{"<"}</Text>
        </TouchableOpacity>

        {pageArray?.map((item, index) => {
          if (item === "...") {
            return (
              <Text key={index} style={styles.ellipsisText}>
                ...
              </Text>
            );
          }
          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.pageButton,
                {
                  backgroundColor:
                    page === item
                      ? Colors.light.gradientGreen_2
                      : Colors.light.mediumGrey,
                },
              ]}
              onPress={() => {
                onPress(item);
              }}
            >
              <Text style={styles.pageButtonText}>{item}</Text>
            </TouchableOpacity>
          );
        })}

        <TouchableOpacity
          style={[
            styles.arrowButton,
            {
              opacity: page === totalPages || isFetching ? 0.5 : 1,
            },
          ]}
          onPress={onNext}
          disabled={page === totalPages || isFetching}
        >
          <Text style={styles.arrowButtonText}>{">"}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default memo(Pagination2);

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
    padding: 10,
    backgroundColor: Colors.light.background,
    borderRadius: 8,
    shadowColor: Colors.light.darkGrey,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  arrowButton: {
    backgroundColor: Colors.light.gradientGreen_2,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
  },
  arrowButtonText: {
    color: Colors.light.white,
    fontSize: 18,
    fontWeight: "bold",
  },
  pageButton: {
    backgroundColor: Colors.light.mediumGrey,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginHorizontal: 5,
  },
  pageButtonText: {
    color: Colors.light.white,
    fontSize: 16,
    fontWeight: "bold",
  },
  ellipsisText: {
    fontSize: 16,
    fontWeight: "bold",
    color: Colors.light.darkGrey,
    marginHorizontal: 5,
  },
});
