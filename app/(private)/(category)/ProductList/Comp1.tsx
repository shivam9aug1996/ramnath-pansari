import { Button, StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { router } from 'expo-router'

const Comp1 = () => {
    console.log("uytrewer6765434567890")
  return (
    <View>
      <Text>Comp1</Text>
      <Button title='test' onPress={()=>{
        router.push("/(search)/search");
      }} />
    </View>
  )
}

export default Comp1

const styles = StyleSheet.create({})