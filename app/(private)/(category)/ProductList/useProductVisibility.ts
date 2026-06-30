import { useSyncExternalStore } from "react";
import {
  getProductVisibilitySnapshot,
  subscribeProductVisibility,
} from "./productVisibilityStore";

export function useProductVisibility(productId: string): boolean {
  return useSyncExternalStore(
    (onStoreChange) => subscribeProductVisibility(productId, onStoreChange),
    () => getProductVisibilitySnapshot(productId),
  );
}