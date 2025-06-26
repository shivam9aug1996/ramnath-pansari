import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { useLocalSearchParams } from 'expo-router';
import OrderDetailComp from './OrderDetailComp';

const OrderDetail = () => {
  const { id, prevStatus } = useLocalSearchParams<{
    id: string;
    prevStatus: string;
  }>();
  return (
    <OrderDetailComp id={id} prevStatus={prevStatus} />
  )
}

export default OrderDetail

const styles = StyleSheet.create({})