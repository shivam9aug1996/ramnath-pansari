import React, { useState, useEffect, memo } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";

const CustomSuspense = ({ delay = 100, fallback = null, children }) => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), delay);

    return () => clearTimeout(timer);
  }, [delay]);

  return isLoading ? fallback : children;
};

export default memo(CustomSuspense);
