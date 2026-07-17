import { OrderStatus, OrderStatusValue } from "@/constants/Order";

export const ACTIVE_FLOAT_STATUSES: OrderStatusValue[] = [
  OrderStatus.CONFIRMED,
  OrderStatus.OUT_FOR_DELIVERY,
];

export const ACTIVE_FLOAT_STATUS_QUERY = ACTIVE_FLOAT_STATUSES.join(",");

export type ActiveFloatOrder = {
  _id: string;
  orderId?: string;
  orderStatus?: string;
  amountPaid?: number;
  imgArr?: string[];
  totalProductCount?: number;
  /** Present when /order/post returns productNames from cart items. */
  productNames?: string[];
};

export function getOrderStatusLabel(status?: string): string {
  switch (status?.toLowerCase()) {
    case OrderStatus.OUT_FOR_DELIVERY:
      return "Out for delivery";
    case OrderStatus.CONFIRMED:
      return "Order confirmed";
    default:
      return "Active order";
  }
}

export function getFloatCopy(orders: ActiveFloatOrder[]) {
  const delivering = orders.filter(
    (order) => order.orderStatus?.toLowerCase() === OrderStatus.OUT_FOR_DELIVERY,
  ).length;
  const confirmed = orders.filter(
    (order) => order.orderStatus?.toLowerCase() === OrderStatus.CONFIRMED,
  ).length;

  if (orders.length === 1) {
    const status = orders[0]?.orderStatus?.toLowerCase();
    if (status === OrderStatus.OUT_FOR_DELIVERY) {
      return { label: "Delivery in progress", action: "Track order" };
    }
    return { label: "Order confirmed", action: "View order" };
  }

  if (delivering > 0 && confirmed > 0) {
    return {
      label: `${orders.length} active orders`,
      action: "View",
    };
  }

  if (delivering > 0) {
    return {
      label: `${delivering} deliveries in progress`,
      action: "View",
    };
  }

  return {
    label: `${confirmed} orders confirmed`,
    action: "View",
  };
}

export function shouldOpenSheet(orders: ActiveFloatOrder[]) {
  return orders.length > 1;
}
