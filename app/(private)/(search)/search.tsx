import React, { useCallback, useRef, useState } from "react";
import {
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
import RecentSearch from "./RecentSearch";
import QueryData from "./QueryData";
import { Colors } from "@/constants/Colors";

const Search = () => {
  const [query, setQuery] = useState("");
  const [isInputBoxFocused, setInputBoxFocused] = useState(true);
  const textInputRef = useRef<TextInput>(null);
  useFocusEffect(
    useCallback(() => {
      textInputRef.current?.focus();
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
    setTimeout(() => {
      setQuery(query);
    }, 500);
    router.push(`/(result)/${query}`);
  }, []);

  return (
    <ScreenSafeWrapper
      useKeyboardAvoidingView
      title="Search for products"
      showCartIcon
    >
      <View style={styles.searchContainer}>
        <CustomTextInput
          value={query}
          onChangeText={handleInputChange}
          textInputRef={textInputRef}
          type="search"
          onSubmitEditing={onSubmitEditing}
          variant={3}
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
      {query ? (
        <QueryData onPress={onPress} query={query} />
      ) : (
        <RecentSearch onPress={onPress} />
      )}
    </ScreenSafeWrapper>
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
