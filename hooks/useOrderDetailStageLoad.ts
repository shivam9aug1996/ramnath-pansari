import { useEffect, useState } from "react";
import { InteractionManager } from "react-native";

const useOrderDetailStageLoad = () => {
  const [show, setShow] = useState({
    showWrapper: false,
    showOrderDetail: false,
    showPaymentDetail: false,
    showAddressDetail: false,
    showTrackingDetail: false,
    showOrderedItems: false,
   
  });

  useEffect(() => {
    const stages = [
      () => setShow((prevShow) => ({ ...prevShow, showWrapper: true })),
      () => setShow((prevShow) => ({ ...prevShow, showOrderDetail: true })),
      () => setShow((prevShow) => ({ ...prevShow, showPaymentDetail: true })),
      () => setShow((prevShow) => ({ ...prevShow, showAddressDetail: true })),
      () => setShow((prevShow) => ({ ...prevShow, showTrackingDetail: true })),
      () => setShow((prevShow) => ({ ...prevShow, showOrderedItems: true })),
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

export default useOrderDetailStageLoad;
