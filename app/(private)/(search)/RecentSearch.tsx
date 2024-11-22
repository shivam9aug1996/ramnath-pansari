import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
} from "react-native";
import React, { memo } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/types/global";
import {
  useDeleteRecentSearchMutation,
  useFetchRecentSearchQuery,
} from "@/redux/features/recentSearchSlice";
import { Entypo } from "@expo/vector-icons";
import { Colors } from "@/constants/Colors";
import { router } from "expo-router";
import RecentSearchPlaceholder from "./RecentSearchPlaceholder";

const RecentSearch = ({ onPress }) => {
  const userId = useSelector((state: RootState) => state.auth.userData?._id);
  const { data, isFetching, error, isLoading } = useFetchRecentSearchQuery({
    userId,
  });
  const [deleteRecentSearch] = useDeleteRecentSearchMutation();

  if (error) {
    return (
      <View style={styles.error}>
        <Text>Error fetching recent searches.</Text>
      </View>
    );
  }

  // Sort the data by timestamp (latest first)
  const sortedData =
    data &&
    [...data].sort(
      (a, b) =>
        new Date(b?.timestamp).getTime() - new Date(a?.timestamp).getTime()
    );

  const handlePress = (query: string) => {
    if (query) {
      onPress?.(query);
    }
  };

  const handleDelete = async (id: string) => {
    await deleteRecentSearch({ userId, id })?.unwrap();
  };
  console.log("juio");

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.item}
      onPress={() => handlePress(item.query)}
    >
      <View style={styles.itemContent}>
        <Entypo name="back-in-time" size={20} color={Colors.light.mediumGrey} />
        <Text style={styles.itemText}>{item.query}</Text>
      </View>
      <Entypo
        name="cross"
        size={20}
        color={Colors.light.mediumGrey}
        style={styles.deleteIcon}
        onPress={() => handleDelete(item._id)}
      />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Recent Searches</Text>
      {isLoading ? (
        <RecentSearchPlaceholder />
      ) : (
        <FlatList
          keyboardShouldPersistTaps="always"
          showsVerticalScrollIndicator={false}
          data={sortedData}
          keyExtractor={(item) => item?._id}
          renderItem={renderItem}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text>No recent searches.</Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    marginBottom: 10,
    marginTop: 20,
    fontFamily: "Raleway_700Bold",
    color: Colors.light.darkGreen,
  },
  item: {
    padding: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#F1F4F3",
    marginBottom: 15,
    borderRadius: 18,
    paddingVertical: 15,
  },
  itemContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  itemText: {
    marginHorizontal: 16,
  },
  deleteIcon: {
    paddingLeft: 15,
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  error: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  empty: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default memo(RecentSearch);
