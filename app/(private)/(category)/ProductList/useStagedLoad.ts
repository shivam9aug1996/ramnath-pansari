
import { useEffect, useState } from "react";
import { InteractionManager } from "react-native";



export function useStagedLoad() {
    const [show, setShow] = useState({
      showWrapper: false,
      showCategories: false,
      showProducts: false,
      showGoToCart: false,
    });
  
    useEffect(() => {
      const stages = [
        () => setShow((prevShow) => ({ ...prevShow, showWrapper: true })),
        () => setShow((prevShow) => ({ ...prevShow, showCategories: true })),
        () => setShow((prevShow) => ({ ...prevShow, showProducts: true })),
        () => setShow((prevShow) => ({ ...prevShow, showGoToCart: true })),
      ];
  
      let currentStage = 0;
  
      InteractionManager.runAfterInteractions(() => {
        const animate = () => {
          if (currentStage < stages.length) {
            stages[currentStage]();
            currentStage++;
            requestAnimationFrame(animate);
          }
        };
  
        requestAnimationFrame(animate);
      });
  
      return () => {
        // cleanup
      };
    }, []);
  
    return show;
  };

