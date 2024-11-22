import { StyleSheet, Text, TextInput } from "react-native";
import React, {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import ScreenSafeWrapper from "@/components/ScreenSafeWrapper";
import CustomTextInput from "@/components/CustomTextInput";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useSelector } from "react-redux";
import { RootState } from "@/types/global";
import { useFetchRecentSearchQuery } from "@/redux/features/recentSearchSlice";
import DelayedVisibilityWrapper from "@/components/DelayedVisibilityWrapper";
import RecentSearch from "./RecentSearch";

// const RecentSearch = lazy(() => import("./RecentSearch"));

const Search = () => {
  const [query, setQuery] = useState("");
  const { queryParam } = useLocalSearchParams<{
    queryParam?: string;
  }>();

  console.log("8765redfghjk", queryParam);
  const textInputRef = useRef<TextInput>(null);

  useFocusEffect(
    useCallback(() => {
      setTimeout(() => {
        textInputRef.current?.focus();
      }, 200);
      return () => {};
    }, [])
  );

  const handleInputChange = (text: string) => {
    setQuery(text);
  };
  const onSubmitEditing = () => {
    if (query) {
      router.push(`/(result)/${query}`);
    }
  };
  const onPress = useCallback((query) => {
    console.log("hiu76545678o");
    setQuery(query);
    router.push(`/(result)/${query}`);
  }, []);
  return (
    <ScreenSafeWrapper
      useKeyboardAvoidingView
      title="Search for products"
      showCartIcon
    >
      <CustomTextInput
        value={query}
        onChangeText={handleInputChange}
        textInputRef={textInputRef}
        type={"search"}
        onSubmitEditing={onSubmitEditing}
        variant={1}
        wrapperStyle={{ marginTop: 11 }}
      />
      {/* <Suspense> */}
      {/* <DelayedVisibilityWrapper delay={200}> */}
      <RecentSearch onPress={onPress} />
      {/* </DelayedVisibilityWrapper> */}
      {/* </Suspense> */}
    </ScreenSafeWrapper>
  );
};

export default Search;

const styles = StyleSheet.create({
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
});
