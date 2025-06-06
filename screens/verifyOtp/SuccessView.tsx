import { Dimensions, StyleSheet } from "react-native";
import React from "react";
import { ThemedView } from "@/components/ThemedView";
import { Colors } from "@/constants/Colors";
import { ThemedText } from "@/components/ThemedText";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import { fonts } from "@/constants/Fonts";
import { useSelector } from "react-redux";
import { RootState } from "@/types/global";

const width = Dimensions.get("screen").width;
const SuccessView = () => {
  const userName = useSelector(
    (state: RootState) => state?.auth?.userData?.name
  );
  const truncatedUserName = userName ? userName.substring(0, 15) : "";

  return (
    <ThemedView style={{ justifyContent: "center", alignItems: "center" }}>
      <ThemedView style={{ justifyContent: "center", alignItems: "center" }}>
        <ThemedView
          style={{
            width: 122,
            height: 122,
            borderRadius: 62,
            backgroundColor: Colors.light.lightGreen,
            opacity: 0.1,
          }}
        ></ThemedView>

        <ThemedView
          style={{
            width: 92,
            height: 92,
            borderRadius: 46,
            backgroundColor: Colors.light.lightGreen,
            opacity: 0.2,
            position: "absolute",
          }}
        ></ThemedView>
        <ThemedView
          style={{ position: "absolute", backgroundColor: "transparent" }}
        >
          <FontAwesome5
            name="check"
            size={40}
            color={Colors.light.lightGreen}
          />
        </ThemedView>
      </ThemedView>
      <ThemedText
        style={{
          ...fonts.defaultBold,
          fontSize: 18,
          color: Colors.light.darkGrey,
          marginTop: 20,
        }}
      >
        {"Success!"}
      </ThemedText>
      <ThemedText
        style={{
          ...fonts.defaultMedium,
          fontSize: 14,
          color: Colors.light.mediumLightGrey,
          marginTop: 15,
          textAlign: "center",
        }}
      >
        {`Hi, ${
          truncatedUserName ? `${truncatedUserName}! ` : ""
        }Your account has been\n successfully created.`}
      </ThemedText>
    </ThemedView>
  );
};

export default SuccessView;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: "absolute",
    width: "100%",
    height: "100%",
    backgroundColor: "rgb(140, 165, 157,1)",
  },
  imageContainer: {
    flex: 1.2,
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "stretch",
  },
  ellipseContainer: {
    position: "absolute",
    top: "50%",
    left: 0,
    right: 0,
    alignItems: "center",
    backgroundColor: "transparent",
    overflow: "hidden",
  },
  ellipse: {
    width: width / 2,
    height: 200,
    borderRadius: 100,
    transform: [{ scaleX: 4 }],
  },
  textContainer: {
    flex: 1,
    alignItems: "center",
  },
  title: {
    textAlign: "center",
  },
  text: {
    textAlign: "center",
    marginTop: 19,
    lineHeight: 19,
    color: Colors.light.mediumLightGrey,
  },
  content: {
    flex: 1,
    alignItems: "center",
    marginHorizontal: 52,
    justifyContent: "flex-start",
    marginTop: 35,
  },
  button: {
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 61,
    paddingVertical: 25,
  },
  outerButtonBorder: {
    backgroundColor: "transparent",
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: "rgba(43, 175, 111, 0.3)",
  },
});
