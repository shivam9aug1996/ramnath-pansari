import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

const Field = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <View style={styles.wrap}>
    <Text style={styles.label}>{label}</Text>
    {children}
  </View>
);

export default Field;

const styles = StyleSheet.create({
  wrap: { marginBottom: 12 },
  label: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 6,
    fontWeight: '600',
  },
});
