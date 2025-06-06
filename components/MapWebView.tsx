import { Platform, View } from 'react-native';

let MapWebView;

if (Platform.OS === 'web') {
  // For web, dynamically import the web version to avoid native dependencies
  MapWebView = <View/>
} else {
  // For native platforms, dynamically import react-native-maps
  MapWebView = require('react-native-maps').default;
}

// Prevent the import from being hoisted
export default MapWebView; 