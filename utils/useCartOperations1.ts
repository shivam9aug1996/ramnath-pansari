import { ItemTaskQueue } from "./ItemTaskQueueManager";

export const useCartOperations1 = () => {
  const updateItem = (itemId: string, newQty: number) => {
    ItemTaskQueue.addTask(itemId, async () => {
      console.log(`⏳ Start ${itemId} → ${newQty}`);
      await new Promise((res) => setTimeout(res, 2000)); // Simulate API call
      console.log(`✅ Done ${itemId} → ${newQty}`);
    });
  };

  return { updateItem };
};
