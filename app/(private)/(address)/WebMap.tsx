import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { useLocalSearchParams } from 'expo-router'
import WebMapComp from './WebMapComp';

const webMap = () => {
  const { latitude, longitude } = useLocalSearchParams();

  return (
    <WebMapComp latitude={latitude} longitude={longitude} />
  )
}

export default webMap

const styles = StyleSheet.create({})