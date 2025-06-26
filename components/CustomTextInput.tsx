import React, { memo } from "react";
import {
  Pressable,
  StyleSheet,
  TextInput,
  Platform,
  ViewStyle,
} from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { Colors } from "@/constants/Colors";
import { fonts } from "@/constants/Fonts";
import { Ionicons } from "@expo/vector-icons";
import { TextStyle } from "react-native";

interface CustomTextInputProps {
  value: string;
  onChangeText: (value: string) => void;
  textInputRef?: React.RefObject<TextInput>;
  type?: any;
  onSubmitEditing?: any;
  autoFocus?: boolean;
  editable?: boolean;
  onPress?: any;
  variant?: number;
  wrapperStyle?: any;
  multiline?: boolean;
  textInputStyle?: TextStyle;
  onClear?: any;
  onBlur?: any;
  onFocus?: any;
  onLayout?: any;
  numberOfLines?: any;
}

const CustomTextInput: React.FC<CustomTextInputProps> = ({
  value,
  onChangeText,
  textInputRef,
  type = "name",
  onSubmitEditing = () => {},
  autoFocus = true,
  editable = true,
  onPress = () => {},
  variant = 1,
  wrapperStyle = {},
  multiline = false,
  textInputStyle = {},
  onClear = () => {},
  onBlur = () => {},
  onFocus = () => {},
  onLayout = () => {},
  numberOfLines = 2,
}) => {
  const focusTextInput = () => {
    if (textInputRef?.current) {
      textInputRef?.current?.focus();
    }
  };

  return (
    <Pressable
      onPress={() => {
        onPress?.();
        if (type === "search" && variant === 2) {
        } else {
          focusTextInput();
        }
      }}
      style={[styles.inputContainer, wrapperStyle]}
    >
      {type == "name" && (
        <>
          <Ionicons
            style={[styles.prefix, styles.iconStyle]}
            name="person-outline"
            size={20}
          />
          <TextInput
            autoFocus={true}
            value={value}
            onChangeText={onChangeText}
            ref={textInputRef}
            style={styles.textInput}
            maxLength={30}
            enterKeyHint={"enter"}
          />
        </>
      )}
      {type == "phone" && (
        <>
          <ThemedText style={styles.prefix}>+91</ThemedText>
          <TextInput
           enterKeyHint="done"
           maxLength={10}
           autoFocus={true}
           value={value}
           onChangeText={onChangeText}
           ref={textInputRef}
           keyboardType="phone-pad"
           style={styles.textInput}
           autoComplete="tel"
           textContentType="telephoneNumber"
           autoCorrect={false}
           autoCapitalize="none"
          />
        </>
      )}
      {type == "search" && variant == 1 && (
        <>
          <TextInput
            enterKeyHint={"search"}
            // autoFocus={true}
            value={value}
            ref={textInputRef}
            onChangeText={onChangeText}
            style={[
              styles.textInput,
              {
                left: 20,
                right: 0,
                fontFamily: "Raleway_600SemiBold",
                fontSize: 14,
                color: Colors.light.darkGreen,
              },
            ]}
            maxLength={50}
            placeholder={"Search"}
            onSubmitEditing={onSubmitEditing}
            autoCorrect={false}
            autoCapitalize={"none"}
          />
          <Ionicons
            onPress={onSubmitEditing}
            style={[
              styles.postfix,
              styles.iconStyle,
              { color: Colors.light.lightGreen },
            ]}
            name={"search"}
            size={20}
          />
        </>
      )}
      {type == "search" && variant == 2 && (
        <>
          <Ionicons
            onPress={onPress}
            style={[
              styles.prefix,
              styles.iconStyle,
              { color: Colors.light.lightGreen },
            ]}
            name={"search"}
            size={20}
          />
          <TextInput
            numberOfLines={numberOfLines}
            readOnly={true}
            selection={{ start: 0 }}
            editable={false}
            value={value}
            style={[
              styles.textInput,
              {
                fontFamily: "Raleway_600SemiBold",
                fontSize: 14,
                color: Colors.light.darkGreen,

                // backgroundColor: "red",
              },
              textInputStyle,
            ]}
            maxLength={50}
            onPress={(e) => {
              e.stopPropagation();
              onPress?.();
            }}
            multiline={multiline}
          />
        </>
      )}
      {type == "search" && variant == 3 && (
        <>
          <Ionicons
            onPress={onPress}
            style={[
              styles.prefix,
              styles.iconStyle,
              { color: Colors.light.lightGreen },
            ]}
            name={"search"}
            size={20}
          />
          <TextInput
            numberOfLines={numberOfLines}
            onLayout={onLayout}
            onFocus={onFocus}
            onBlur={onBlur}
            enterKeyHint={"search"}
            // autoFocus={true}
            value={value}
            ref={textInputRef}
            onChangeText={onChangeText}
            style={[
              styles.textInput,
              {
                fontFamily: "Raleway_600SemiBold",
                fontSize: 14,
                color: Colors.light.darkGreen,
                paddingRight: 20,

                // backgroundColor: "red",
              },
              textInputStyle,
            ]}
            maxLength={50}
            placeholder={"Search"}
            placeholderTextColor={Colors.light.mediumLightGrey}
            onSubmitEditing={onSubmitEditing}
            autoCorrect={false}
            autoCapitalize={"none"}
          />
          {value && (
            <Ionicons
              onPress={onClear}
              style={[
                styles.postfix,
                styles.iconStyle,
                { color: Colors.light.mediumGrey },
              ]}
              name={"close"}
              size={20}
            />
          )}
        </>
      )}
    </Pressable>
  );
};

export default memo(CustomTextInput);

const styles = StyleSheet.create({
  inputContainer: {
    width: "100%",
    borderRadius: 20,
    paddingVertical: Platform.OS === "android" ? 10 : 20,
    position: "relative",
    backgroundColor: "#f2f4f3",
  },
  prefix: {
    ...(fonts.defaultNumber as any),
    position: "absolute",
    fontSize: 16,
    paddingHorizontal: 20,
    top: 19,
  },
  textInput: {
    ...(fonts.defaultNumber as any),
    width: "75%",
    fontSize: 16,
    left: 60,
    color: Colors.light.darkGrey,
  },
  iconStyle: {
    top: Platform.OS === "android" ? 20 : 19,
    fontWeight: "900",
    fontSize: 20,
  },
  postfix: {
    ...(fonts.defaultNumber as any),
    position: "absolute",
    fontSize: 16,
    paddingHorizontal: 20,
    top: Platform.OS === "android" ? 23 : 19,
    right: 0,
  },
});
