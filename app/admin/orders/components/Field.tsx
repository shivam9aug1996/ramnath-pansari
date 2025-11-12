import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

const Field = ({ label, path, children }: { label: string; path?: string; children: React.ReactNode }) => (
  <View style={{ marginBottom: 12 }}>
    <Text style={styles.label}>
      {label}
      {path ? <Text style={styles.keyPath}>  ({path})</Text> : null}
    </Text>
    {children}
  </View>
);

export default Field;

const styles = StyleSheet.create({
  label: { fontSize: 12, color: '#666', marginBottom: 6 },
  keyPath: { fontFamily: 'Menlo', fontSize: 11, color: '#999' },
});


