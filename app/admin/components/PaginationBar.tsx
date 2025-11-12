import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type Props = {
  currentPage: number;
  totalPages?: number;
  loading?: boolean;
  onPrev: () => void;
  onNext: () => void;
};

const PaginationBar: React.FC<Props> = ({ currentPage, totalPages, loading, onPrev, onNext }) => {
  return (
    <View style={styles.paginationBar}>
      <TouchableOpacity onPress={onPrev} style={styles.pageButton}>
        <Text style={styles.pageButtonText}>Previous</Text>
      </TouchableOpacity>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        {loading ? <ActivityIndicator size="small" /> : null}
        <Text style={styles.pageIndicator}>Page {currentPage}{totalPages ? ` / ${totalPages}` : ''}</Text>
      </View>
      <TouchableOpacity onPress={onNext} style={styles.pageButton}>
        <Text style={styles.pageButtonText}>Next</Text>
      </TouchableOpacity>
    </View>
  );
};

export default PaginationBar;

const styles = StyleSheet.create({
  paginationBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  pageButton: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: '#222' },
  pageButtonText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  pageIndicator: { fontSize: 12 },
});


