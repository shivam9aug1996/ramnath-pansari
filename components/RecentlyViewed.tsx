import { clearRecentlyViewed } from '@/redux/features/recentlyViewedSlice';
import { Link, router } from 'expo-router';
import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';

function RecentlyViewed() {
  const { items } = useSelector(state => state.recentlyViewed);
  const dispatch = useDispatch();
  
  if (items.length === 0) {
    return null;
  }
  
  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };
  
  return null
}

const styles = StyleSheet.create({
  recentlyViewed: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  clearButton: {
    color: '#007AFF',
    fontSize: 14,
  },
  itemsList: {
    gap: 12,
  },
  item: {
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    padding: 12,
    marginBottom: 8,
  },
  itemCategory: {
    flexDirection: 'column',
  },
  itemSearch: {
    flexDirection: 'column',
  },
  itemProduct: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 4,
    marginRight: 12,
  },
  productDetails: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: '500',
  },
  productPrice: {
    fontSize: 14,
    color: '#333',
    marginTop: 4,
  },
  itemText: {
    fontSize: 14,
  },
  timestamp: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
});

export default RecentlyViewed;