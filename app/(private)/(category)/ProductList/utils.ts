import { staticImage } from "../CategoryList/utils";

export const productPlaceholderData = [
  {
    _id: "1",
    name: "Product1",
    categoryPath: [],
    image: staticImage,
    discountedPrice: 2,
    price: 5,
  },
  {
    _id: "2",
    name: "Product2",
    categoryPath: [],
    image: staticImage,
    discountedPrice: 2,
    price: 5,
  },
  {
    _id: "3",
    name: "Product3",
    categoryPath: [],
    image: staticImage,
    discountedPrice: 2,
    price: 5,
  },
  {
    _id: "4",
    name: "Product4",
    categoryPath: [],
    image: staticImage,
    discountedPrice: 2,
    price: 5,
  },
  {
    _id: "4",
    name: "Product4",
    categoryPath: [],
    image: staticImage,
    discountedPrice: 2,
    price: 5,
  },
  {
    _id: "5",
    name: "Product5",
    categoryPath: [],
    image: staticImage,
    discountedPrice: 2,
    price: 5,
  },
];

export const scrollToTop = (ref: any, animated = false) => {
  const list = ref?.current;
  if (!list) return;

  // Prefer offset 0 — more reliable than scrollToIndex(0) after data swaps
  if (typeof list.scrollToOffset === "function") {
    list.scrollToOffset({ animated, offset: 0 });
    return;
  }

  list.scrollToIndex?.({ index: 0, animated, viewPosition: 0 });
};

export const scrollToIndex = (
  ref: any,
  index: number,
  viewPosition: number = 0.3
) => {
  if (!Number.isFinite(index) || index < 0) return;

  // Index 0 = start of list — use offset for consistency across platforms
  if (index === 0) {
    scrollToTop(ref, true);
    return;
  }

  ref?.current?.scrollToIndex?.({
    index,
    animated: true,
    viewPosition,
  });
};
