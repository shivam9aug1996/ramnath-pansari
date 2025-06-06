import { ActivityIndicator, StyleSheet, Text, View } from 'react-native'
import React, { Suspense } from 'react'
import { Colors } from '@/constants/Colors'

const LazyLoadWrapper = ({children}:{children:React.ReactNode}) => {
  return (
    <Suspense fallback={<View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={Colors.light.tintColorLight} />
      </View>}>
      {children}
    </Suspense>
  )
}

export default LazyLoadWrapper

const styles = StyleSheet.create({})