import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

const DetailSection = ({ title, children }: { title: string; children: React.ReactNode }) => {
  return (
    <View style={styles.card}>
      <Text style={styles.section}>{title}</Text>
      {children}
    </View>
  );
};

export default DetailSection;

const styles = StyleSheet.create({
  card: { marginTop: 12, padding: 12, borderRadius: 8, backgroundColor: '#f8f8f8' },
  section: { fontWeight: '700', marginBottom: 8 },
});


