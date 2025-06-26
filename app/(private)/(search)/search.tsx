import React, { lazy, Suspense, useCallback, useRef, useState } from "react";
import {
  Button,
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import ScreenSafeWrapper from "@/components/ScreenSafeWrapper";
import CustomTextInput from "@/components/CustomTextInput";
// import RecentSearch from "./RecentSearch";
// import QueryData from "./QueryData";
import { Colors } from "@/constants/Colors";
import CustomSuspense from "@/components/CustomSuspense";
import QueryData from "./QueryData";
import RecentSearch from "./RecentSearch";
import useSearchStageLioad from "@/hooks/useSearchStageLioad";
import DeferredFadeIn from "@/components/DeferredFadeIn";
import { showToast } from "@/utils/utils";
// const QueryData = lazy(() => import("./QueryData"));
// const RecentSearch = lazy(() => import("./RecentSearch"));

const Search = () => {
  const { showQueryData, showRecentSearch, showWrapper } =
    useSearchStageLioad();
  const [query, setQuery] = useState("");
  const [isInputBoxFocused, setInputBoxFocused] = useState(true);
  const textInputRef = useRef<TextInput>(null);
  useFocusEffect(
    useCallback(() => {
      setInputBoxFocused(true);
      let timeoutId = setTimeout(() => {
        textInputRef.current?.focus();
      }, 500);

      return () => {
        clearTimeout(timeoutId); // Clear the timeout on cleanup
      };
    }, [])
  );

  const handleInputChange = (text: string) => setQuery(text);

  const onSubmitEditing = () => {
    if (query) {
      router.push(`/(result)/${query}`);
    }
  };

  const handleClear = () => setQuery("");

  const handleCancel = () => {
    Keyboard.dismiss();
    handleClear();
  };

  const onPress = useCallback((query: string) => {
    let timeoutId = setTimeout(() => {
      setQuery(query);
    }, 500);
   // console.log("ytdfghjkjhgfd", query);
    router.push(`/(result)/${encodeURIComponent(query)}`);

    return () => {
      clearTimeout(timeoutId); // Clear the timeout if the component unmounts or the function is re-triggered
    };
  }, []);
  return (
    <>
      <ScreenSafeWrapper
        useKeyboardAvoidingView
        title="Search for products"
        showCartIcon
      >
        
        <DeferredFadeIn delay={100} style={{flex:1}}>
          <View style={styles.searchContainer}>
            <CustomTextInput
              value={query}
              onChangeText={handleInputChange}
              textInputRef={textInputRef}
              type="search"
              onSubmitEditing={onSubmitEditing}
              variant={3}
              numberOfLines={1}
              wrapperStyle={[
                styles.inputWrapper,
                isInputBoxFocused && styles.inputWrapperFocused,
              ]}
              onClear={handleClear}
              onFocus={() => setInputBoxFocused(true)}
              onBlur={() => setInputBoxFocused(false)}
            />
            {isInputBoxFocused && (
              <Pressable style={styles.cancelButton} onPress={handleCancel}>
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
            )}
          </View>
        
        {query
          ? showQueryData && <QueryData onPress={onPress} query={query} />
          : showRecentSearch && <RecentSearch onPress={onPress} />}
          </DeferredFadeIn>
      </ScreenSafeWrapper>
    </>
  );
};

export default Search;

const styles = StyleSheet.create({
  searchContainer: {
    flexDirection: "row",
    marginTop: 25,
  },
  inputWrapper: {
    flex: 1,
  },
  inputWrapperFocused: {
    marginRight: 15,
    paddingRight: 30,
  },
  cancelButton: {
    justifyContent: "center",
  },
  cancelText: {
    color: Colors.light.gradientGreen_1,
  },
});
