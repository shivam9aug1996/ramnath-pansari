import { useEffect, useState } from "react";
import { InteractionManager } from "react-native";

const useProfileStageLoad = () => {
  const [show, setShow] = useState({
    showWrapper: false,
   
  });

  useEffect(() => {
    const stages = [
      () => setShow((prevShow) => ({ ...prevShow, showWrapper: true })),
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

export default useProfileStageLoad;
