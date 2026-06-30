import { CartItem } from "@/types/global";
import { DEFAULT_DELIVERY_SETTINGS } from "@/constants/Delivery";
import { calculateTotalAmount } from "@/components/cart/utils";
import { getPaidCartItems } from "@/utils/cartOfferUtils";

export type DeliverySettings = {
  freeDeliveryMin: number;
  shippingFee: number;
};

export function resolveDeliverySettings(
  settings?: Partial<DeliverySettings> | null,
): DeliverySettings {
  return {
    freeDeliveryMin:
      settings?.freeDeliveryMin ?? DEFAULT_DELIVERY_SETTINGS.freeDeliveryMin,
    shippingFee: settings?.shippingFee ?? DEFAULT_DELIVERY_SETTINGS.shippingFee,
  };
}

export function getCartSubtotal(items: CartItem[] = []): number {
  return calculateTotalAmount(items);
}

export function getPaidCartSubtotal(items: CartItem[] = []): number {
  return calculateTotalAmount(getPaidCartItems(items));
}

export function getDeliveryFee(
  subtotal: number,
  settings?: Partial<DeliverySettings> | null,
): number {
  const resolved = resolveDeliverySettings(settings);
  if (!subtotal || subtotal <= 0) return 0;
  return subtotal >= resolved.freeDeliveryMin ? 0 : resolved.shippingFee;
}

export function getPayableTotal(
  subtotal: number,
  settings?: Partial<DeliverySettings> | null,
): number {
  return parseFloat((subtotal + getDeliveryFee(subtotal, settings)).toFixed(2));
}

export function getPayableTotalFromItems(
  items: CartItem[] = [],
  settings?: Partial<DeliverySettings> | null,
): number {
  return getPayableTotal(getCartSubtotal(items), settings);
}

export function getFreeDeliveryRemaining(
  subtotal: number,
  settings?: Partial<DeliverySettings> | null,
): number {
  const resolved = resolveDeliverySettings(settings);
  return Math.max(resolved.freeDeliveryMin - subtotal, 0);
}

export function hasFreeDelivery(
  subtotal: number,
  settings?: Partial<DeliverySettings> | null,
): boolean {
  const resolved = resolveDeliverySettings(settings);
  return subtotal >= resolved.freeDeliveryMin;
}

export function hasDeliverySettingsChanged(
  previous?: Partial<DeliverySettings> | null,
  next?: Partial<DeliverySettings> | null,
): boolean {
  const prev = resolveDeliverySettings(previous);
  const latest = resolveDeliverySettings(next);
  return (
    prev.freeDeliveryMin !== latest.freeDeliveryMin ||
    prev.shippingFee !== latest.shippingFee
  );
}
