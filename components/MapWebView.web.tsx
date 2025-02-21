import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

const MapWebView = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Maps Coming Soon on Web!</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  text: {
    fontSize: 20,
    fontWeight: '600',
    color: '#666',
  }
});

export default MapWebView; 