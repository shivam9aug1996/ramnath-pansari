import {
    ActivityIndicator,
    StyleSheet,
    TouchableOpacity,
    View,
  } from "react-native";
  import React, { useEffect, useRef, useState } from "react";
  import { WebView } from "react-native-webview";
  import { Colors } from "@/constants/Colors";
  import { Ionicons } from "@expo/vector-icons";
  import { fetchLocation } from "./utils";
  
  const MapView = () => {
    const webViewRef = useRef(null);
    const [webViewLoad, setWebViewLoad] = useState(true);
    const [canGoBack, setCanGoBack] = useState(false);
    const [coordinates, setCoordinates] = useState(null);
    const [delayedInjection, setDelayedInjection] = useState(false);
  
    useEffect(() => {
      fetchLocationData();
    }, []);
  
    // Add new useEffect for delayed injection
    useEffect(() => {
      if (!webViewLoad) {
        setTimeout(() => {
          setDelayedInjection(true);
        }, 2000);
      }
    }, [webViewLoad]);
  
    const fetchLocationData = async () => {
      const loc = await fetchLocation();
     // console.log('Native location data:', loc);
      if (loc?.latitude && loc?.longitude) {
        const coords = { lat: loc.latitude, lng: loc.longitude };
       // console.log('Setting coordinates:', coords);
        setCoordinates(coords);
      }
    };
  
    const handleGoBack = () => {
      if (webViewRef.current && canGoBack) {
        webViewRef.current?.goBack();
      }
    };
  
    // Handle any JavaScript errors or communication with the web page
    const onError = (syntheticEvent) => {
      const { nativeEvent } = syntheticEvent;
      console.warn('WebView error: ', nativeEvent);
    };
  
    // Modified injectedJavaScript to use delayed injection
    const injectedJavaScript = delayedInjection ? `
      console.log('Injecting coordinates:', ${JSON.stringify(coordinates)});
      window.initialCoordinates = ${coordinates ? JSON.stringify(coordinates) : 'null'};
      if (window.initialCoordinates) {
        console.log('Dispatching event with coordinates:', window.initialCoordinates);
        window.dispatchEvent(new CustomEvent('nativeCoordinatesReady', { 
          detail: window.initialCoordinates 
        }));
      }
      true;
    ` : '';
  
    return (
      <View style={styles.container}>
        {webViewLoad && (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={Colors.light.lightGreen} />
          </View>
        )}
        {canGoBack && (
          <TouchableOpacity
            onPress={handleGoBack}
            style={styles.backButton}
          >
            <Ionicons name="close" size={24} color="black" />
          </TouchableOpacity>
        )}
        <WebView
        cacheEnabled={false}
          ref={webViewRef}
          source={{ uri: 'http://192.168.1.10:3000/map' }}
          onLoadStart={() => setWebViewLoad(true)}
          onLoadEnd={() => setWebViewLoad(false)}
          onError={(syntheticEvent) => {
            const { nativeEvent } = syntheticEvent;
            console.warn('WebView error:', nativeEvent);
          }}
          injectedJavaScript={injectedJavaScript}
          javaScriptEnabled={true}
          onMessage={(event) => {
            console.log('WebView message:', event.nativeEvent.data);
          }}
          onNavigationStateChange={(navState) => {
            setCanGoBack(navState.canGoBack);
          }}
          style={styles.webview}
          // Enable these props for better user experience
          pullToRefreshEnabled
          bounces
          decelerationRate={1}
          allowsBackForwardNavigationGestures
          // Enable geolocation if needed
          geolocationEnabled
          // Enable this if you need to handle form inputs
          keyboardDisplayRequiresUserAction={false}
        />
      </View>
    );
  };
  
  export default MapView;
  
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#fff',
    },
    webview: {
      flex: 1,
    },
    loaderContainer: {
      position: "absolute",
      width: "100%",
      height: "100%",
      zIndex: 100,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: "rgba(255, 255, 255, 0.7)",
    },
    backButton: {
      position: 'absolute',
      top: 10,
      right: 10,
      zIndex: 101,
      padding: 10,
      backgroundColor: 'rgba(255, 255, 255, 0.8)',
      borderRadius: 20,
    },
  });