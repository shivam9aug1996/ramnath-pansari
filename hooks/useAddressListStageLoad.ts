import { useEffect, useState } from "react";
import { InteractionManager } from "react-native";

const useAddressListStageLoad = () => {
  const [show, setShow] = useState({
    showWrapper: false,
    showPayButton: false,
  });

  useEffect(() => {
    const stages = [
      () => setShow((prevShow) => ({ ...prevShow, showWrapper: true })),
      () => setShow((prevShow) => ({ ...prevShow, showPayButton: true })),
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

export default useAddressListStageLoad;
