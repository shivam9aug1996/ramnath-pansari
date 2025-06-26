import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { useLocalSearchParams } from 'expo-router';
import ProductDetail from './ProductDetail';

const Product = () => {
  const { id, extraData } = useLocalSearchParams<{ id: string, extraData: any }>();
  return <ProductDetail id={id} extraData={extraData}/>
}

export default Product

const styles = StyleSheet.create({})