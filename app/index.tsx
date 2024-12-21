import { ActivityIndicator, View } from "react-native";
import ReactNativeFeatureFlags from "react-native/Libraries/ReactNative/ReactNativeFeatureFlags";
console.log("uytrdfghjkl;", ReactNativeFeatureFlags);
// enable the JS-side of the w3c PointerEvent implementation
ReactNativeFeatureFlags.shouldEmitW3CPointerEvents = () => true;
ReactNativeFeatureFlags.shouldPressibilityUseW3CPointerEventsForHover = () =>
  true;
const StartPage = () => {
  return (
    <View style={{ flex: 1, justifyContent: "center" }}>
      <ActivityIndicator size="large" color="#0000ff" />
    </View>
  );
};

export default StartPage;
