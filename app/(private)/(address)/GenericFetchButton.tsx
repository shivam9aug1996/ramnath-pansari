import React, { memo } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  View,
} from "react-native";
import { Colors } from "@/constants/Colors";
import { Ionicons } from "@expo/vector-icons";

interface GenericFetchButtonProps {
  onPress: () => void;
  loading?: boolean;
  wrapperStyle?: object;
  title?: string;
  iconName?: keyof typeof Ionicons.glyphMap;
  layout?: "left-loading" | "right-loading";
  iconSize?: number;
}

const GenericFetchButton: React.FC<GenericFetchButtonProps> = ({
  title = "Get info",
  onPress,
  loading = false,
  wrapperStyle,
  iconName = undefined,
  layout = "right-loading",
  iconSize = 16,
}) => {
  const renderLeftLoading = () => (
    <>
      <View>
        {loading && (
          <ActivityIndicator
            size="small"
            color={Colors.light.mediumGreen}
            style={{ marginRight: 5 }}
          />
        )}
      </View>
      <Text style={[
          styles.buttonText,
          {
            marginRight: iconName ? 6 : 0,
          },
        ]}>{title}</Text>
      {iconName && (
        <Ionicons
          name={iconName}
          size={iconSize}
          color={Colors.light.mediumGreen}
        />
      )}
    </>
  );

  const renderRightLoading = () => (
    <>
      <Text
        style={[
          styles.buttonText,
          {
            marginRight: iconName || loading ? 6 : 0,
          },
        ]}
      >
        {title}
      </Text>
      {loading ? (
        <ActivityIndicator size="small" color={Colors.light.mediumGreen} />
      ) : (
        iconName && (
          <Ionicons
            name={iconName}
            size={iconSize}
            color={Colors.light.mediumGreen}
          />
        )
      )}
    </>
  );

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.button, wrapperStyle]}
      disabled={loading}
    >
      {layout === "left-loading" ? renderLeftLoading() : renderRightLoading()}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    alignSelf: "flex-end",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: Colors.light.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.light.mediumGreen,
  },
  buttonText: {
    color: Colors.light.mediumGreen,
    fontSize: 14,
    fontFamily: "Raleway_600SemiBold",
    marginRight: 6,
  },
});

export default memo(GenericFetchButton);
