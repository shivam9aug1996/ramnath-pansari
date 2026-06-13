import { CartItem } from "@/types/global";
import { FREE_DELIVERY_MIN, SHIPPING_FEE } from "@/constants/Delivery";
import { calculateTotalAmount } from "@/components/cart/utils";

export function getCartSubtotal(items: CartItem[] = []): number {
  return calculateTotalAmount(items);
}

export function getDeliveryFee(subtotal: number): number {
  if (!subtotal || subtotal <= 0) return 0;
  return subtotal >= FREE_DELIVERY_MIN ? 0 : SHIPPING_FEE;
}

export function getPayableTotal(subtotal: number): number {
  return parseFloat((subtotal + getDeliveryFee(subtotal)).toFixed(2));
}

export function getPayableTotalFromItems(items: CartItem[] = []): number {
  return getPayableTotal(getCartSubtotal(items));
}

export function getFreeDeliveryRemaining(subtotal: number): number {
  return Math.max(FREE_DELIVERY_MIN - subtotal, 0);
}

export function hasFreeDelivery(subtotal: number): boolean {
  return subtotal >= FREE_DELIVERY_MIN;
}
