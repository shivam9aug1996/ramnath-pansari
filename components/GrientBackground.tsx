import { StyleSheet } from 'react-native';
import React from 'react';
import { useWeatherInfo } from './WeatherSection/useWeatherInfo';
import { LinearGradient } from 'expo-linear-gradient';

const weatherGradients = {
  Default: ["rgba(179, 229, 252, 0.6)", "#ffffff"],
};

const getWeatherGradient = (main:any, hour:any) => {
  const isMorning = hour >= 6 && hour <= 10;
  const isMidday = hour >= 11 && hour <= 16;
  const isEvening = hour >= 17 && hour <= 19;
  const isNight = hour >= 20 || hour <= 5;

  const baseColors = {
    Clear: {
        morning: ["#B3E5FC", "#ffffff"],    
        midday:  ["#4FC3F7", "#ffffff"],    
        evening: ["#FFB74D", "#ffffff"],    
        night:   ["#1A237E", "#ffffff"],    
      },
      Clouds: {
        morning: ["#ECEFF1", "#ffffff"],
        midday: ["#CFD8DC", "#ffffff"],
        evening: ["#B0BEC5", "#ffffff"],
        night: ["#90A4AE", "#ffffff"],
      },
      Rain: {
        morning: ["#B3E5FC", "#ffffff"],
        midday: ["#81D4FA", "#ffffff"],
        evening: ["#4FC3F7", "#ffffff"],
        night: ["#0288D1", "#ffffff"],
      },
      Drizzle: {
        morning: ["#D1C4E9", "#ffffff"],
        midday: ["#B39DDB", "#ffffff"],
        evening: ["#9575CD", "#ffffff"],
        night: ["#673AB7", "#ffffff"],
      },
      Thunderstorm: {
        morning: ["#CE93D8", "#ffffff"],
        midday: ["#BA68C8", "#ffffff"],
        evening: ["#9C27B0", "#ffffff"],
        night: ["#6A1B9A", "#ffffff"],
      },
      Snow: {
        morning: ["#E1F5FE", "#ffffff"],
        midday: ["#B3E5FC", "#ffffff"],
        evening: ["#81D4FA", "#ffffff"],
        night: ["#4FC3F7", "#ffffff"],
      },
      Mist: {
        morning: ["#F5F5F5", "#ffffff"],
        midday: ["#EEEEEE", "#ffffff"],
        evening: ["#E0E0E0", "#ffffff"],
        night: ["#BDBDBD", "#ffffff"],
      },
      Smoke: {
        morning: ["#E0E0E0", "#ffffff"],
        midday: ["#BDBDBD", "#ffffff"],
        evening: ["#9E9E9E", "#ffffff"],
        night: ["#757575", "#ffffff"],
      },
      Haze: {
        morning: ["#F8BBD0", "#ffffff"],
        midday: ["#F48FB1", "#ffffff"],
        evening: ["#EC407A", "#ffffff"],
        night: ["#AD1457", "#ffffff"],
      },
      Dust: {
        morning: ["#FFE0B2", "#ffffff"],
        midday: ["#FFCC80", "#ffffff"],
        evening: ["#FFB74D", "#ffffff"],
        night: ["#FF8A65", "#ffffff"],
      },
      Fog: {
        morning: ["#CFD8DC", "#ffffff"],
        midday: ["#B0BEC5", "#ffffff"],
        evening: ["#90A4AE", "#ffffff"],
        night: ["#78909C", "#ffffff"],
      },
      Sand: {
        morning: ["#FFECB3", "#ffffff"],
        midday: ["#FFD54F", "#ffffff"],
        evening: ["#FFC107", "#ffffff"],
        night: ["#FFA000", "#ffffff"],
      },
      Ash: {
        morning: ["#D7CCC8", "#ffffff"],
        midday: ["#BCAAA4", "#ffffff"],
        evening: ["#A1887F", "#ffffff"],
        night: ["#8D6E63", "#ffffff"],
      },
      Squall: {
        morning: ["#B3E5FC", "#ffffff"],
        midday: ["#81D4FA", "#ffffff"],
        evening: ["#4FC3F7", "#ffffff"],
        night: ["#0288D1", "#ffffff"],
      },
      Tornado: {
        morning: ["#E57373", "#ffffff"],
        midday: ["#EF5350", "#ffffff"],
        evening: ["#F44336", "#ffffff"],
        night: ["#C62828", "#ffffff"],
      },
  };

  const timeOfDay = isMorning
    ? "morning"
    : isMidday
    ? "midday"
    : isEvening
    ? "evening"
    : "night";

  return baseColors[main]?.[timeOfDay] || weatherGradients.Default;
};

const GrientBackground = () => {
  // const { weather, hour } = useWeatherInfo();
  // console.log("weather",weather);

  // const gradientColors =
  //   weather && weather.main
  //   //    ? getWeatherGradient(weather.main || "Clear", hour || 11)
  //   // ? getWeatherGradient("Clear", 20)
  //   ? weatherGradients.Default
  //     : weatherGradients.Default;

  return (
    <LinearGradient
      colors={weatherGradients.Default}
      locations={[0, 0.6, 1]}
      style={StyleSheet.absoluteFill}
    />
  );
};

export default GrientBackground;


