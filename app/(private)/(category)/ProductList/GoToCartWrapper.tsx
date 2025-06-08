import { Animated, StyleSheet, View } from 'react-native'
import React, { memo, useEffect, useRef, useState } from 'react'
import FadeSlideIn from '@/app/components/FadeSlideIn'
import GoToCart from './GoToCart'
import { useSelector } from 'react-redux'
import { RootState } from '@/types/global'

const GoToCartWrapper = ({ showGoToCart,isCart }) => {
  const [visible, setVisible] = useState(true)

  const scrollParams = useSelector((state: RootState) => state.product?.productListScrollParams)
  const translateY = useRef(new Animated.Value(0)).current
  const scaleY = useRef(new Animated.Value(1)).current // Initially scaled to full size
  const opacity = useRef(new Animated.Value(1)).current // Initially fully opaque
  useEffect(() => {
    if (!scrollParams) return
    if (scrollParams.direction === "down" && scrollParams.isBeyondThreshold) {
      // Fade and shrink before setting to false
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start()

      Animated.timing(scaleY, {
        toValue: 0, // Shrink the component
        duration: 300,
        useNativeDriver: true,
      }).start()

      setTimeout(() => setVisible(false), 100) // Delay setting visible to false
    } else if (scrollParams.direction === "up") {
      // Animate back to visible state
      setVisible(true)

      Animated.timing(opacity, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }).start()

      Animated.timing(scaleY, {
        toValue: 1, // Reset scaling
        duration: 300,
        useNativeDriver: true,
      }).start()
    }
  }, [scrollParams])

  if (!showGoToCart || !visible) return null // Ensure the component is not rendered when not visible

  return (
    <Animated.View
      style={[
        {
          transform: [
            { translateY },
            { scaleY }, // Animate scaling on the Y axis
          ],
          opacity, // Add opacity animation for smooth transition
        }
      ]}
    >
      <FadeSlideIn slide="none" fade={true} duration={500}>
        <GoToCart isCart={isCart} />
      </FadeSlideIn>
    </Animated.View>
  )
}

export default memo(GoToCartWrapper)

const styles = StyleSheet.create({
})
