import { useState } from "react";
import { Animated } from "react-native";

const useHideOnScroll = () => {
  const [showComponent, setShowComponent] = useState(true);
  const scrollY = new Animated.Value(0);
  let lastOffset = 0;

  const onScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    {
      useNativeDriver: false,
      listener: (event) => {
        const currentOffset = event.nativeEvent.contentOffset.y;

        // Check if the user is scrolling down or up
        if (currentOffset > lastOffset && showComponent) {
          setShowComponent(false); // Scrolling down
        } else if (currentOffset < lastOffset && !showComponent) {
          setShowComponent(true); // Scrolling up
        }

        lastOffset = currentOffset;
      },
    }
  );

  return { showComponent, scrollY, onScroll };
};

export default useHideOnScroll;
