import React from 'react';
import { Text, StyleSheet, SafeAreaView, View } from 'react-native';
import { useWeatherInfo } from './WeatherSection/useWeatherInfo';
import Animated, { FadeIn, SlideInDown, SlideInUp } from 'react-native-reanimated';

type DayPhase = 'day' | 'night';

/** Utility: decide if the given hour is "night" (20 – 5) or "day" (otherwise). */
const getDayPhase = (hour: number): DayPhase =>
  hour >= 20 || hour <= 5 ? 'night' : 'day';

/** 🎯 Map: weather ➜ { day | night } emoji  */
const emojiMap: Record<string, Record<DayPhase, string>> = {
  Clear:       { day: '☀️', night: '🌙' },
  Clouds:      { day: '☁️', night: '☁️' },
  Rain:        { day: '🌧️', night: '🌧️' },
  Drizzle:     { day: '🌦️', night: '🌦️' },
  Thunderstorm:{ day: '⛈️', night: '⛈️' },
  Snow:        { day: '❄️', night: '❄️' },
  Mist:        { day: '🌫️', night: '🌫️' },
  Smoke:       { day: '💨', night: '💨' },
  Haze:        { day: '🌁', night: '🌁' },
  Dust:        { day: '🏜️', night: '🏜️' },
  Fog:         { day: '🌫️', night: '🌫️' },
  Sand:        { day: '🏖️', night: '🏖️' },
  Ash:         { day: '🌋', night: '🌋' },
  Squall:      { day: '🌬️', night: '🌬️' },
  Tornado:     { day: '🌪️', night: '🌪️' },
};

const WeatherEmojiOverlay = () => {
  const { weather, hour } = useWeatherInfo();

  const phase = getDayPhase(hour ?? 12);
  const main  = weather?.main ?? 'Clear';

  const emoji =
    emojiMap[main]?.[phase] ??
    emojiMap['Clear'][phase];        // safe fallback

  return (
    <Animated.View entering={SlideInUp.duration(2000)} style={styles.container}>
      <Text style={styles.emoji}>{emoji}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: -15,
    right: 60,
    bottom: 0,
  },
  emoji: {
    alignSelf: 'center',
    fontSize: 40,
    opacity: 0.7,
  },
});

export default WeatherEmojiOverlay;
