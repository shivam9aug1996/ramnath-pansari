export function getOrderStatusTitle(order) {
  if (!order || !order.orderHistory || order.orderHistory.length === 0) {
    return "No status available";
  }

  // Get the last item from orderHistory (latest status)
  const latestStatus = order.orderHistory[0];

  // Extract the status and timestamp
  const status = latestStatus.status;
  const timestamp = new Date(latestStatus.timestamp);

  // Format the date as 'dd MMM yyyy'
  const formattedDate = timestamp.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  // Capitalize the first letter of the status
  const capitalizedStatus = status.charAt(0).toUpperCase() + status.slice(1);
  if (capitalizedStatus === "Out_for_delivery") {
    return `Out for delivery on ${formattedDate}`;
  }
  return `${capitalizedStatus} on ${formattedDate}`;
}

export const convertDate = (timestamp: any) => {
  const fTimestamp = new Date(timestamp);

  // Format the date as 'dd MMM yyyy'
  const formattedDate = fTimestamp.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const formattedTime = fTimestamp.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
  return `${formattedDate}, ${formattedTime}`;
};

export function getOrderStatusTitle1(status) {
  // Capitalize the first letter of the status
  const capitalizedStatus = status?.charAt(0)?.toUpperCase() + status?.slice(1);
  if (capitalizedStatus === "Out_for_delivery") {
    return `Out for delivery`;
  }
  return `${capitalizedStatus}`;
}
