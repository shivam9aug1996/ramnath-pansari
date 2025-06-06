import { useEffect, useState } from "react";
import { InteractionManager } from "react-native";

const useCartStageLoad = () => {
  const [show, setShow] = useState({
    showWrapper: false,
    showGoToCart: false,
    showCartList: false,
    showContinue: false,
  });

  useEffect(() => {
    const stages = [
      () => setShow((prevShow) => ({ ...prevShow, showWrapper: true })),
      () => setShow((prevShow) => ({ ...prevShow, showGoToCart: true })),
      () => setShow((prevShow) => ({ ...prevShow, showContinue: true })),
      () => setShow((prevShow) => ({ ...prevShow, showCartList: true })),
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

export default useCartStageLoad;
