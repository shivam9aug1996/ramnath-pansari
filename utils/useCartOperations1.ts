import { ItemTaskQueue } from "./ItemTaskQueueManager";
import { devError, devLog, devWarn } from "@/utils/devLog";

export const useCartOperations1 = () => {
  const updateItem = (itemId: string, newQty: number) => {
    ItemTaskQueue.addTask(itemId, async () => {
      devLog(`⏳ Start ${itemId} → ${newQty}`);
      await new Promise((res) => setTimeout(res, 2000)); // Simulate API call
      devLog(`✅ Done ${itemId} → ${newQty}`);
    });
  };

  return { updateItem };
};
