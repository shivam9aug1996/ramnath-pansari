import React, { memo, useCallback, useEffect, useRef, useState } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import WeatherIcon from "./WeatherIcon";
import { useWeatherInfo } from "./useWeatherInfo";
import { useWeatherGreetingMessage } from "./useWeatherGreetingMessage";
import { useGreetingMessage } from "../GreetingMessage/useGreetingMessage";
import { router, useFocusEffect, usePathname } from "expo-router";
import _ from "lodash";
import { useIsFocused } from "@react-navigation/native";
export const arrayColor = ["#F9FAFB", "#FAF9F6", "#FBFAFF"]


const WeatherSection = () => {
  const { weather, hour, fetchWeather } = useWeatherInfo();
  const { greeting: fetchedGreeting, fetchGreeting } = useWeatherGreetingMessage();
  const { message: fetchedMessage, fetchAndGenerateGreeting } = useGreetingMessage();


  const [currentMessage, setCurrentMessage] = useState<string | null>("🛒 Hello! Need groceries fast? We've got your staples and pulses covered — delivered in 30 minutes!");
  const messageIndexRef = useRef(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const pathname = usePathname();
  const isFocused = useIsFocused();

  const backgroundColor = arrayColor[messageIndexRef.current] || "#FFFFFF";




  // useFocusEffect(
  //   // Callback should be wrapped in `React.useCallback` to avoid running the effect too often.
  //   useCallback(() => {
  //     // Invoked whenever the route is focused.
  //     if(pathname==="/home"){
  //       debouncePress();
  //     }

  //     // Return function is invoked whenever the route gets out of focus.
  //     return () => {
  //       console.log('This route is now unfocused.');
  //       if(intervalRef.current){
  //         clearInterval(intervalRef.current);
  //       }
  //     };
  //   }, []));

  useEffect(() => {
    if(isFocused){
      if(intervalRef.current){
        clearInterval(intervalRef.current);
      }
      debouncePress();
    }
    return () => {
      if(intervalRef.current){
        clearInterval(intervalRef.current);
      }
    }
  }, [isFocused]);

  

  const start = async () => {
    console.log("start4567890")
    const weather = await fetchWeather();
    const greeting = await fetchGreeting(weather);
    const message = await fetchAndGenerateGreeting();

    const updatedMessages = {
      message1: "🛒 Hello! Need groceries fast? We've got your staples and pulses covered — delivered in 30 minutes!",
      message2: greeting,
      //give nice different static message
      message3: message,
    };


    startMessageRotation(updatedMessages);
  };

  const debouncePress = useCallback(_.debounce(start, 1000), [
    ,
  ]); 

  const startMessageRotation = (messages: any) => {
    const messageKeys = ["message1", "message2", "message3"];

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      messageIndexRef.current = (messageIndexRef.current + 1) % messageKeys.length;
      const nextMessage = messages[messageKeys[messageIndexRef.current] as keyof typeof messages];
      setCurrentMessage(nextMessage);
    }, 5000);
  };


  return (
    <View >
      <WeatherIcon backgroundColor={backgroundColor} weather={weather || {}} hour={hour} greeting={currentMessage} />
     
    </View>
  );
};

export default memo(WeatherSection);
