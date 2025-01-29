import { Colors } from "@/constants/Colors";
import { View, StyleSheet } from "react-native";
import ReactNativeFeatureFlags from "react-native/Libraries/ReactNative/ReactNativeFeatureFlags";

// enable the JS-side of the w3c PointerEvent implementation
ReactNativeFeatureFlags.shouldEmitW3CPointerEvents = () => true;
ReactNativeFeatureFlags.shouldPressibilityUseW3CPointerEventsForHover = () => true;

/**
 * StartPage component that displays a loading indicator
 * centered on the screen
 */
const StartPage: React.FC = () => {
  return (
    <View style={styles.container} />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background
  },
});

export default StartPage;
