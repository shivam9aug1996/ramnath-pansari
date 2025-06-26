import { useLocalSearchParams } from 'expo-router';
import React from 'react'
import QueryResult from './QueryResult';

const Result = () => {
  const { query } = useLocalSearchParams<{ query: string }>();
  return (
    <QueryResult query={query} />
  )
}

export default Result