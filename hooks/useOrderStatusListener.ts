import { useEffect, useRef } from "react";
import { onValue, ref } from "firebase/database";
import { useDispatch, useSelector } from "react-redux";
import { database } from "@/firebase";
import { orderApi } from "@/redux/features/orderSlice";
import { RootState } from "@/types/global";
import { showToast } from "@/utils/utils";

type ActiveOrderSnapshot = Record<
  string,
  {
    status?: string;
    _id?: string;
    orderId?: string;
  }
>;

function showStatusToast(status?: string) {
  switch (status?.toLowerCase()) {
    case "confirmed":
      showToast({ type: "info", text2: "Your order is confirmed!" });
      break;
    case "out_for_delivery":
      showToast({ type: "info", text2: "Your order is out for delivery!" });
      break;
    case "delivered":
      showToast({ type: "success", text2: "Your order is delivered!" });
      break;
    case "canceled":
      showToast({ type: "error", text2: "Your order is canceled!" });
      break;
  }
}

export function useOrderStatusListener() {
  const userId = useSelector((state: RootState) => state?.auth?.userData?._id);
  const dispatch = useDispatch();
  const prevOrdersRef = useRef<ActiveOrderSnapshot>({});
  const isInitialSnapshotRef = useRef(true);

  useEffect(() => {
    if (!userId) return;

    prevOrdersRef.current = {};
    isInitialSnapshotRef.current = true;

    const activeRef = ref(database, `orders/${userId}/active`);

    const unsubscribe = onValue(activeRef, (snapshot) => {
      const data = (snapshot.val() ?? {}) as ActiveOrderSnapshot;
      const prev = prevOrdersRef.current;
      let shouldInvalidate = false;

      // Firebase onValue always fires once with the current data on subscribe.
      // Skip toasts on that first snapshot so reopening the app doesn't replay alerts.
      if (isInitialSnapshotRef.current) {
        isInitialSnapshotRef.current = false;
        prevOrdersRef.current = data;
        dispatch(
          orderApi.util.invalidateTags([
            { type: "activeDeliveries", id: `${userId}` },
            { type: "orderList", id: `${userId}` },
          ]),
        );
        return;
      }

      Object.entries(data).forEach(([mongoId, order]) => {
        const prevOrder = prev[mongoId];
        if (!prevOrder) {
          showStatusToast(order?.status);
          shouldInvalidate = true;
          return;
        }

        if (prevOrder.status !== order?.status) {
          showStatusToast(order?.status);
          shouldInvalidate = true;
        }
      });

      Object.keys(prev).forEach((mongoId) => {
        if (!data[mongoId]) {
          shouldInvalidate = true;
        }
      });

      prevOrdersRef.current = data;

      if (shouldInvalidate) {
        dispatch(
          orderApi.util.invalidateTags([
            { type: "activeDeliveries", id: `${userId}` },
            { type: "orderList", id: `${userId}` },
          ]),
        );

        const detailTags = Object.values(data)
          .filter((order) => order?._id)
          .map((order) => ({
            type: "detailOrder" as const,
            id: `${order._id}-${userId}`,
          }));

        if (detailTags.length) {
          dispatch(orderApi.util.invalidateTags(detailTags));
        }
      }
    });

    return () => unsubscribe();
  }, [dispatch, userId]);
}
