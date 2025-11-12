import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';

const HeaderBar = ({ title, right }: { title?: string; right?: React.ReactNode }) => {
  const router = useRouter();
  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} accessibilityLabel="Back">
        <Ionicons name="chevron-back" size={24} color="#000" />
      </TouchableOpacity>
      <Text style={styles.title}>{title ?? ''}</Text>
      <View style={styles.right}>{right}</View>
    </View>
  );
};

export default HeaderBar;

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingTop: 8, paddingBottom: 6, borderBottomWidth: 1, borderBottomColor: '#eee' },
  backBtn: { width: 60, paddingVertical: 6, alignItems: 'flex-start' },
  title: { flex: 1, textAlign: 'center', fontWeight: '800' },
  right: { width: 60, alignItems: 'flex-end' },
});


