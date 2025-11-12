export const OrderStatus = {
  CONFIRMED: "confirmed",
  OUT_FOR_DELIVERY: "out_for_delivery",
  CANCELED: "canceled",
  DELIVERED: "delivered",
} as const;

export type OrderStatusValue = typeof OrderStatus[keyof typeof OrderStatus];

export const ORDER_STATUS_VALUES: OrderStatusValue[] = Object.values(OrderStatus);

export const ORDER_STATUS_COLORS: Record<OrderStatusValue, string> = {
  confirmed: "#007AFF",
  out_for_delivery: "#F59E0B",
  canceled: "#EF4444",
  delivered: "#22C55E",
};


