import { useEffect, useRef, useState } from "react";

/**
 * A custom React hook that simulates a typing effect for a given text.
 *
 * @param text The string of text to display with the typing effect.
 * @param speed The speed of typing in milliseconds per character. Defaults to 20ms.
 * @returns The portion of the text currently being displayed.
 */
export const useTypingEffect = (text: string, speed: number = 20): string => {
  const [displayedText, setDisplayedText] = useState("");
  const currentIndexRef = useRef(0);
  const frameIdRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const isTypingCompleteCountRef = useRef(0);

  useEffect(() => {
    if (!text || typeof text !== "string") {
      setDisplayedText("");
      return;
    }

    // Reset typing state
    currentIndexRef.current = 0;
    setDisplayedText("");
    lastTimeRef.current = performance.now();

    const type = (now: number) => {
      if (now - lastTimeRef.current >= speed) {
        const nextIndex = currentIndexRef.current + 1;
        if (nextIndex <= text.length) {
          setDisplayedText(text.slice(0, nextIndex));
          currentIndexRef.current = nextIndex;
          lastTimeRef.current = now;
        } else {
          isTypingCompleteCountRef.current++;
          if(isTypingCompleteCountRef.current === 2){
            console.log("Typing complete", text);
            
          }
          return; // Typing complete 
        }
      }
      frameIdRef.current = requestAnimationFrame(type);
    };

    frameIdRef.current = requestAnimationFrame(type);

    return () => {
      if (frameIdRef.current) {
        cancelAnimationFrame(frameIdRef.current);
      }
    };
  }, [text, speed]);

  return displayedText;
};
