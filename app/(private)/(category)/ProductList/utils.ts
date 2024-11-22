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

export const scrollToTop = (ref: any) => {
  ref?.current?.scrollToOffset?.({ animated: false, offset: 0 });
};

export const scrollToIndex = (
  ref: any,
  index: number,
  viewPosition: number = 0.3
) => {
  ref?.current?.scrollToIndex?.({
    index: index,
    animated: true,
    viewPosition: viewPosition,
  });
};
