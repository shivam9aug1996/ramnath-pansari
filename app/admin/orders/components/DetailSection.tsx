import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

const DetailSection = ({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) => (
  <View style={styles.card}>
    <View style={styles.header}>
      <Text style={styles.section}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
    {children}
  </View>
);

export default DetailSection;

const styles = StyleSheet.create({
  card: {
    marginTop: 12,
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  header: {
    marginBottom: 12,
  },
  section: {
    fontWeight: '800',
    fontSize: 15,
    color: '#111827',
  },
  subtitle: {
    marginTop: 2,
    fontSize: 12,
    color: '#64748B',
  },
});
