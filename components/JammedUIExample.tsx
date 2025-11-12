import React from 'react';
import { View, Text, Button } from 'react-native';

export default function JammedUIExample() {
  const [count, setCount] = React.useState(0);
  const [isJamming, setIsJamming] = React.useState(false);

  const jamTheJS = () => {
    setIsJamming(true);
    const start = Date.now();
    // Block the JS thread for ~3 seconds
    while (Date.now() - start < 3000) {
      // Tight loop does nothing but "spin the CPU" (cool sci-fi term you should use).
      Math.random();
    }
    setCount((prev) => prev + 1);
    setIsJamming(false);
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: 24, marginBottom: 20 }}>JS Thread Jam Example</Text>
      <Button title="Jam the JS thread" onPress={jamTheJS} />
      <Text style={{ marginTop: 20, fontSize: 18 }}>
        {isJamming ? '⚠️ App is freezing...' : `✅ Pressed ${count} time(s)`}
      </Text>
    </View>
  );
}