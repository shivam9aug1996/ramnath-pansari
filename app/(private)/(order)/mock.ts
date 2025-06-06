export const OrderStatus = {
  CONFIRMED: "confirmed",
  OUT_FOR_DELIVERY: "out_for_delivery",
  CANCELED: "canceled",
  DELIVERED: "delivered",
};

export const mockOrders = [
  {
    _id: "66ef94a9b4d27012bb54c1ce",
    orderStatus: OrderStatus.CONFIRMED,
    createdAt: "2024-09-14T07:54:41.214Z",
    updatedAt: "2024-09-14T07:54:41.214Z",
    imgArr: [
      "https://rukminim2.flixcart.com/image/280/280/xif0q/washing-powder/o/u/i/-original-imagueee9envgxsz.jpeg?q=70",
      "https://rukminim2.flixcart.com/image/280/280/kzpw2vk0/fabric-stiffener/y/f/5/-original-imagbz6sfz38zwva.jpeg?q=70",
      "https://rukminim2.flixcart.com/image/280/280/xif0q/cereal-flake/v/c/j/-original-imagvscyatk9pcck.jpeg?q=70",
    ],
    productCount: 3,
    totalProductCount: 12,
    orderHistory: [
      {
        status: OrderStatus.CONFIRMED,
        timestamp: "2024-09-14T07:36:37.604Z",
      },
    ],
    amountPaid: 1567.56,
  },
  {
    _id: "77ef94a9b4d27012bb54c1df",
    orderStatus: OrderStatus.OUT_FOR_DELIVERY,
    createdAt: "2024-09-15T10:20:35.924Z",
    updatedAt: "2024-09-15T10:30:45.214Z",
    imgArr: [
      "https://rukminim2.flixcart.com/image/280/280/xif0q/washing-powder/o/u/i/-original-imagueee9envgxsz.jpeg?q=70",
      "https://rukminim2.flixcart.com/image/280/280/kzpw2vk0/fabric-stiffener/y/f/5/-original-imagbz6sfz38zwva.jpeg?q=70",
      "https://rukminim2.flixcart.com/image/280/280/xif0q/cereal-flake/v/c/j/-original-imagvscyatk9pcck.jpeg?q=70",
    ],
    productCount: 2,
    totalProductCount: 8,
    orderHistory: [
      {
        status: OrderStatus.CONFIRMED,
        timestamp: "2024-09-15T10:15:37.604Z",
      },
      {
        status: OrderStatus.OUT_FOR_DELIVERY,
        timestamp: "2024-09-15T10:25:45.604Z",
      },
    ],
    amountPaid: 500.0,
  },
  {
    _id: "88ef94a9b4d27012bb54c1ef",
    orderStatus: OrderStatus.CANCELED,
    createdAt: "2024-09-12T09:10:12.414Z",
    updatedAt: "2024-09-12T09:40:23.524Z",
    imgArr: [
      "https://rukminim2.flixcart.com/image/280/280/xif0q/washing-powder/o/u/i/-original-imagueee9envgxsz.jpeg?q=70",
    ],
    productCount: 1,
    totalProductCount: 1,
    orderHistory: [
      {
        status: OrderStatus.CONFIRMED,
        timestamp: "2024-09-12T09:12:05.604Z",
      },
      {
        status: OrderStatus.CANCELED,
        timestamp: "2024-09-12T09:20:10.604Z",
      },
    ],
    amountPaid: 97.0,
  },
  {
    _id: "99ef94a9b4d27012bb54c1ff",
    orderStatus: OrderStatus.DELIVERED,
    createdAt: "2024-09-13T11:34:41.214Z",
    updatedAt: "2024-09-14T07:54:41.214Z",
    imgArr: [
      "https://rukminim2.flixcart.com/image/280/280/xif0q/washing-powder/o/u/i/-original-imagueee9envgxsz.jpeg?q=70",
      "https://rukminim2.flixcart.com/image/280/280/kzpw2vk0/fabric-stiffener/y/f/5/-original-imagbz6sfz38zwva.jpeg?q=70",
      "https://rukminim2.flixcart.com/image/280/280/xif0q/cereal-flake/v/c/j/-original-imagvscyatk9pcck.jpeg?q=70",
    ],
    productCount: 2,
    totalProductCount: 6,
    orderHistory: [
      {
        status: OrderStatus.CONFIRMED,
        timestamp: "2024-09-13T11:36:37.604Z",
      },
      {
        status: OrderStatus.OUT_FOR_DELIVERY,
        timestamp: "2024-09-13T15:10:45.604Z",
      },
      {
        status: OrderStatus.DELIVERED,
        timestamp: "2024-09-14T07:30:41.604Z",
      },
    ],
    amountPaid: 157.06,
  },
];
