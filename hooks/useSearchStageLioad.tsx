import { useEffect, useState } from "react";
import { InteractionManager } from "react-native";

const useSearchStageLioad = () => {
  const [show, setShow] = useState({
    showWrapper: false,
    showQueryData: false,
    showRecentSearch: false,
  });

  useEffect(() => {
    const stages = [
      () => setShow((prevShow) => ({ ...prevShow, showWrapper: true })),
      () => setShow((prevShow) => ({ ...prevShow, showQueryData: true })),
      () => setShow((prevShow) => ({ ...prevShow, showRecentSearch: true })),
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

export default useSearchStageLioad;
