import { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';

export default function Heavy() {
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    requestAnimationFrame(() => {
      // Allow time for loading indicator to appear
      setTimeout(() => {
        for (let i = 0; i < 100000; i++) {
          console.log("i", i);
          // heavy work
        }
        setIsProcessing(false); // done
      }, 0); // Defer loop one frame further
    });
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      {isProcessing ? (
        <>
          <ActivityIndicator size="large" color="blue" />
          <Text>Loading...</Text>
        </>
      ) : (
        <Text>Heavy work done ✅</Text>
      )}
    </View>
  );
}
