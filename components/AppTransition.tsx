import { View, StyleSheet } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

const AppTransition = ({ children }: { children: React.ReactNode }) => {
  return (
    <Animated.View style={StyleSheet.absoluteFill} entering={FadeIn.duration(1000)}>
      {children}
    </Animated.View>
  );
};

export default AppTransition;
