'use client';

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  StyleSheet,
  Dimensions,
  Easing,
} from 'react-native';
import Svg, { Path, G, Text as SvgText } from 'react-native-svg';

const WHEEL_SIZE = Dimensions.get('window').width * 0.8;
const WHEEL_CENTER = WHEEL_SIZE / 2;
const SECTIONS = [
  { label: '₹100', color: '#EE4040' },
  { label: '₹200', color: '#F0CF50' },
  { label: '₹300', color: '#815CD1' },
  { label: '₹400', color: '#3DA5E0' },
  { label: '₹500', color: '#34A24F' },
  { label: '₹600', color: '#F9AA1F' },
];
const ANGLE = 360 / SECTIONS.length;

const SpinWheel = () => {
  const [isSpinning, setIsSpinning] = useState(false);
  const spinValue = useRef(new Animated.Value(0)).current;

  const createWheelPath = (index: number) => {
    const startAngle = (index * ANGLE * Math.PI) / 180;
    const endAngle = ((index + 1) * ANGLE * Math.PI) / 180;
    const x1 = WHEEL_CENTER + WHEEL_CENTER * Math.cos(startAngle);
    const y1 = WHEEL_CENTER + WHEEL_CENTER * Math.sin(startAngle);
    const x2 = WHEEL_CENTER + WHEEL_CENTER * Math.cos(endAngle);
    const y2 = WHEEL_CENTER + WHEEL_CENTER * Math.sin(endAngle);

    return `M${WHEEL_CENTER} ${WHEEL_CENTER} L${x1} ${y1} A${WHEEL_CENTER} ${WHEEL_CENTER} 0 0 1 ${x2} ${y2}Z`;
  };

  const renderWheelSections = () => {
    return SECTIONS.map((section, index) => {
      const angle = index * ANGLE + ANGLE / 2;
      const labelRadius = WHEEL_CENTER * 0.7;
      const labelX = WHEEL_CENTER + labelRadius * Math.cos((angle * Math.PI) / 180);
      const labelY = WHEEL_CENTER + labelRadius * Math.sin((angle * Math.PI) / 180);

      return (
        <G key={index}>
          <Path
            d={createWheelPath(index)}
            fill={section.color}
            stroke="#ffffff"
            strokeWidth="2"
          />
          <SvgText
            x={labelX}
            y={labelY}
            fill="#ffffff"
            fontSize="16"
            fontWeight="bold"
            textAnchor="middle"
            alignmentBaseline="middle"
            transform={`rotate(${angle}, ${labelX}, ${labelY})`}
          >
            {section.label}
          </SvgText>
        </G>
      );
    });
  };

  const spin = () => {
    if (isSpinning) return;

    setIsSpinning(true);
    spinValue.setValue(0);

    // First, decide which section we want to land on
    const targetSectionIndex = Math.floor(Math.random() * SECTIONS.length);
    // Calculate the target degree to land at the center of the chosen section
    const targetDegree = targetSectionIndex * ANGLE;
    
    // Add complete rotations (5-10 spins)
    const numberOfSpins = Math.floor(Math.random() * 5) + 5;
    const totalDegrees = (numberOfSpins * 360) + targetDegree;

    Animated.timing(spinValue, {
      toValue: totalDegrees,
      duration: 5000,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start(() => {
      setIsSpinning(false);
      
      const prize = SECTIONS[targetSectionIndex].label;
     

      alert(`Congratulations! You won ${prize}!`);
    });
  };

  const interpolatedSpin = spinValue.interpolate({
    inputRange: [0, 360],
    outputRange: ['0deg', '-360deg'], // Note the negative value for correct direction
    extrapolate: 'extend'
  });

  return (
    <View style={styles.container}>
      <View style={styles.wheelContainer}>
        {/* Pointer */}
        <View style={styles.pointer}>
          <View style={styles.pointerTriangle} />
        </View>

        {/* Wheel */}
        <Animated.View
          style={[
            styles.wheel,
            {
              transform: [{ rotate: interpolatedSpin }],
            },
          ]}
        >
          <Svg width={WHEEL_SIZE} height={WHEEL_SIZE} viewBox={`0 0 ${WHEEL_SIZE} ${WHEEL_SIZE}`}>
            {renderWheelSections()}
          </Svg>
        </Animated.View>

        {/* Center Button */}
        <TouchableOpacity
          style={[
            styles.centerButton,
            isSpinning && styles.centerButtonDisabled
          ]}
          onPress={spin}
          disabled={isSpinning}
        >
          <Text style={styles.centerButtonText}>
            {isSpinning ? 'Spinning...' : 'SPIN'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f0f0',
  },
  wheelContainer: {
    width: WHEEL_SIZE,
    height: WHEEL_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wheel: {
    width: WHEEL_SIZE,
    height: WHEEL_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: WHEEL_SIZE / 2,
    borderWidth: 2,
    borderColor: '#fff',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    backgroundColor: '#fff',
  },
  pointer: {
    position: 'absolute',
    top: -20,
    zIndex: 1,
    alignItems: 'center',
  },
  pointerTriangle: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 15,
    borderRightWidth: 15,
    borderBottomWidth: 30,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#333',
  },
  centerButton: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
    borderWidth: 3,
    borderColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  centerButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  centerButtonDisabled: {
    opacity: 0.7,
  },
});

export default SpinWheel; 