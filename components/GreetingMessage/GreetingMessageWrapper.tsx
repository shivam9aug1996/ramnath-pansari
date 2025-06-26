import { StyleSheet } from 'react-native'
import React, { memo } from 'react'
import { useGreetingMessage } from './useGreetingMessage';
import GreetingMessage from './GreetingMessage';

const GreetingMessageWrapper = () => {
    // The useGreetingMessage hook is where the main logic resides.
    // Destructuring values here is fine.
    
    const { message, loading } = useGreetingMessage();
    

    // GreetingMessage is already memoized, so it will only re-render if
    // 'message' or 'loading' props change. This is efficient.
    return (
        <GreetingMessage message={message} loading={loading} />
    )
}

// Memoizing the wrapper itself is generally a good practice if
// it doesn't have internal state or complex logic that would
// benefit from re-rendering frequently. In this case, it's simple
// and passing props from a hook, so memoizing is harmless and potentially beneficial.
export default memo(GreetingMessageWrapper)

const styles = StyleSheet.create({})