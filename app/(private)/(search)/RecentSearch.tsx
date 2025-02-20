import React, { memo, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  Keyboard,
  Platform,
} from "react-native";
import { useSelector } from "react-redux";
import { RootState } from "@/types/global";
import {
  useDeleteRecentSearchMutation,
  useFetchRecentSearchQuery,
} from "@/redux/features/recentSearchSlice";
import { Entypo } from "@expo/vector-icons";
import { Colors } from "@/constants/Colors";
import RecentSearchPlaceholder from "./RecentSearchPlaceholder";
import { truncateText } from "@/utils/utils";

interface RecentSearchProps {
  onPress: (query: string) => void;
}

const RecentSearch: React.FC<RecentSearchProps> = ({ onPress }) => {
  const userId = useSelector((state: RootState) => state.auth.userData?._id);
  const { data, isFetching, error, isLoading } = useFetchRecentSearchQuery({
    userId,
  });
  const [deleteRecentSearch] = useDeleteRecentSearchMutation();
  // Sort recent searches by timestamp
  const sortedData = data
    ? [...data].sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )
    : [];

  // Handlers
  const handlePress = useCallback(
    (query: string) => {
      if (query) onPress(query);
    },
    [onPress]
  );

  const handleDelete = useCallback(
    async (id: string) => {
      await deleteRecentSearch({ userId, id })?.unwrap();
    },
    [deleteRecentSearch, userId]
  );

  // Components
  const renderItem = useCallback(
    ({ item, index }: { item: any; index: number }) => (
      <View key={item?._id || index} style={styles.item}>
        <TouchableOpacity
          onPress={() => handlePress(item.query)}
          style={styles.itemContent}
        >
          <Entypo
            name="back-in-time"
            size={20}
            color={Colors.light.mediumGrey}
          />
          <Text style={styles.itemText}>{truncateText(item.query, 35)}</Text>
        </TouchableOpacity>
        <Entypo
          name="cross"
          size={20}
          color={Colors.light.mediumGrey}
          style={styles.deleteIcon}
          onPress={() => handleDelete(item._id)}
        />
      </View>
    ),
    [handlePress, handleDelete]
  );

  const renderListHeader = useCallback(() => {
    return <Text style={styles.title}>Recent Searches</Text>;
  }, []);

  const renderEmptyComponent = useCallback(() => {
    return (
      <View style={styles.empty}>
        <Text>No recent searches.</Text>
      </View>
    );
  }, []);

  const renderErrorComponent = useCallback(() => {
    return (
      <View style={styles.error}>
        <Text>Error fetching recent searches.</Text>
      </View>
    );
  }, []);

  // Conditional rendering
  if (error) {
    return renderErrorComponent();
  }

  return (
    <View style={styles.container}>
      {isLoading ? (
        <RecentSearchPlaceholder />
      ) : (
        <FlatList
        bounces={Platform.OS === "android" ? false : true}
          data={sortedData}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          ListHeaderComponent={renderListHeader}
          ListEmptyComponent={renderEmptyComponent}
          keyboardShouldPersistTaps="always"
          onScrollBeginDrag={Keyboard.dismiss}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

export default memo(RecentSearch);

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
    flex: 1,
  },
  itemContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  itemText: {
    marginHorizontal: 16,
  },
  deleteIcon: {
    paddingLeft: 15,
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
