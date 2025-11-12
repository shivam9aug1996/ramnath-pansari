import React, { Fragment, memo, useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { FlashList } from "@shopify/flash-list";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/constants/Colors";
import { useFetchProductsBySearchQueryDataQuery } from "@/redux/features/searchSlice";
import NotFound from "../(result)/NotFound";
import _ from "lodash";
import { Product } from "@/types/global";

interface QueryDataProps {
  query: string;
  onPress: (name: string) => void;
}

const QueryData: React.FC<QueryDataProps> = ({ query, onPress }) => {
  const [debouncedQuery, setDebouncedQuery] = useState("");

  const debounceQuery = useCallback(
    _.debounce((value: string) => {
      setDebouncedQuery(value);
    }, 0),
    []
  );

  useEffect(() => {
    debounceQuery(query);
    return () => {
      debounceQuery.cancel();
    };
  }, [query, debounceQuery]);

  const { data, isFetching } = useFetchProductsBySearchQueryDataQuery(
    { query: debouncedQuery, type: "autocomplete", page: 1, limit: 10 },
    { skip: debouncedQuery.length === 0 }
  );

  const renderEmptyComponent = useCallback(() => {
    return data?.results?.length == 0 ? (
      <NotFound
        title="Item not Found"
        subtitle="Try search with a different keyword"
      />
    ) : null;
  }, [data]);

  const renderProductItem = useCallback(
    ({ item, index }: { item: Product; index: number }) => {
      return (
        <Fragment key={item?._id || index}>
          <TouchableOpacity
            onPress={() => onPress(item?.name)}
            style={styles.productItem}
          >
            <Ionicons name="search" style={styles.icon} />
            <Text style={styles.productText}>{item?.name}</Text>
          </TouchableOpacity>
          <View style={styles.separator} />
        </Fragment>
      );
    },
    [onPress]
  );

  return (
    <View style={[styles.container, isFetching && styles.disabledContainer]}>
      {isFetching && (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={Colors.light.lightGreen} />
        </View>
      )}
      <FlatList
      bounces={Platform.OS === "android" ? false : true}
        //  disableAutoLayout
        //estimatedItemSize={197}
        data={data?.results || []}
        renderItem={renderProductItem}
        keyExtractor={(item, index) => `${item?._id || index}`}
        onScrollBeginDrag={Keyboard.dismiss}
        keyboardShouldPersistTaps="always"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={renderEmptyComponent}
      />
    </View>
  );
};

export default memo(QueryData);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  disabledContainer: {
    opacity: 0.5,
    pointerEvents: "none",
  },
  loader: {
    position: "absolute",
    alignSelf: "center",
    top: "30%",
    zIndex: 12,
  },
  listContainer: {
    paddingTop: 15,
  },
  productItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  icon: {
    color: Colors.light.mediumGrey,
    fontSize: 20,
  },
  productText: {
    paddingVertical: 15,
    paddingHorizontal: 10,
    color: Colors.light.mediumGrey,
  },
  separator: {
    height: 1,
    backgroundColor: Colors.light.mediumGrey,
    width: "100%",
  },
});
