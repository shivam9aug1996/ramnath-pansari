import {
  StyleSheet,
  Text,
  TextInput,
  View,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Button,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import React, { useCallback, useState } from "react";
import { useFetchProductsBySearchQuery } from "@/redux/features/searchSlice";
import ScreenSafeWrapper from "@/components/ScreenSafeWrapper";
import { debounce } from "@/utils/utils";

const Search = () => {
  const [queryState, setQueryState] = useState({
    query: "",
    state: false,
    debouncedQuery: "",
  });

  const { data, isFetching, error } = useFetchProductsBySearchQuery(
    { query: queryState.debouncedQuery, type: "autocomplete" },
    { skip: queryState?.debouncedQuery.length == 0 }
  );

  const debouncedSearch = useCallback(
    debounce(
      (text) => {
        setQueryState({
          query: text,
          debouncedQuery: text,
          state: true,
        });
      },
      1000,
      false
    ),
    []
  );
  console.log("asdi8765456789", queryState);

  const handleInputChange = (text: string) => {
    setQueryState({
      ...queryState,
      query: text,
      debouncedQuery: "",
    });

    debouncedSearch(text);
  };

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.itemContainer}>
      <Text style={styles.itemText}>{item.name}</Text>
    </TouchableOpacity>
  );
  console.log("i87654efghj", data);

  return (
    <ScreenSafeWrapper useKeyboardAvoidingView>
      <Text style={styles.header}>Search</Text>
      <TextInput
        style={styles.input}
        placeholder="Search for products"
        onChangeText={handleInputChange}
        value={queryState.query}
      />
      {isFetching && <ActivityIndicator size="large" color="#0000ff" />}
      {error && (
        <Text style={styles.errorText}>
          Something went wrong. Please try again.
        </Text>
      )}
      <FlatList
        keyboardShouldPersistTaps={"always"}
        data={
          queryState.debouncedQuery.length > 0 && !isFetching
            ? data?.results
            : []
        }
        keyExtractor={(item) => item?._id?.toString()}
        renderItem={renderItem}
      />
    </ScreenSafeWrapper>
  );
};

export default Search;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
  },
  input: {
    height: 40,
    borderColor: "gray",
    borderWidth: 1,
    paddingHorizontal: 8,
    borderRadius: 5,
    marginBottom: 20,
  },
  itemContainer: {
    paddingVertical: 10,
    borderBottomColor: "#ccc",
    borderBottomWidth: 1,
  },
  itemText: {
    fontSize: 18,
  },
  errorText: {
    color: "red",
    textAlign: "center",
    marginTop: 20,
  },
  paginationContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 20,
  },
  pageNumber: {
    fontSize: 16,
  },
});
