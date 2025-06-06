// DriverTrackingWebView.tsx
import React, { useState } from 'react';
import { WebView } from 'react-native-webview';
import { ActivityIndicator, View, StyleSheet } from 'react-native';

interface DriverTrackingWebViewProps {
  orderId: string;
  customerLocation: {
    lat: number;
    lng: number;
  };
}

const DriverTrackingWebView: React.FC<DriverTrackingWebViewProps> = ({
  orderId,
  customerLocation,
}) => {
  const [isLoading, setIsLoading] = useState(true);

  // Create the URL with query parameters
  const url = `http://192.168.1.19:3000/liveMap?orderId=${orderId}&lat=${customerLocation.lat}&lng=${customerLocation.lng}`;
  console.log("jytr34567890-",url);
  return (
    <View style={styles.container}>
      <WebView
        source={{ uri: url }}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        onError={(error) => {
          console.log(error);
          setIsLoading(false);
        }}
        onLoadEnd={() => {
          console.log('onLoadEnd');
          setIsLoading(false);
        }}
      />
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0000ff" />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
});

export default DriverTrackingWebView;