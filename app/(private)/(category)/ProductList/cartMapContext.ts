// cartMapContext.ts
import { createContext, useContext } from "react";

export const CartMapContext = createContext<Record<string, number>>({});
export const useCartQuantity = (productId: string) => {
  const map = useContext(CartMapContext);
  return map[productId]?.quantity ?? 0;
};
