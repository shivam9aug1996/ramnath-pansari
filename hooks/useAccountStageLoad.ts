import { useEffect, useState } from "react";
import { InteractionManager } from "react-native";

const useAccountStageLoad = () => {
  const [show, setShow] = useState({
    showWrapper: false,
    showProfileContainer: false,
    showBottomContainer: false,
  });

  useEffect(() => {
    const stages = [
      () => setShow((prevShow) => ({ ...prevShow, showWrapper: true })),
      () => setShow((prevShow) => ({ ...prevShow, showProfileContainer: true })),
      () => setShow((prevShow) => ({ ...prevShow, showBottomContainer: true })),
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

export default useAccountStageLoad;
