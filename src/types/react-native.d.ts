declare module 'react-native/Libraries/ReactNative/ReactNativeFeatureFlags' {
  const ReactNativeFeatureFlags: {
    shouldEmitW3CPointerEvents: () => boolean;
    shouldPressibilityUseW3CPointerEventsForHover: () => boolean;
  };
  export default ReactNativeFeatureFlags;
}
