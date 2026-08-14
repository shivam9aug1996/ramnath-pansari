import React, { memo } from "react";
import ProductItem from "./ProductItem";
import { Product } from "@/types/global";

type ProductItemWrapperProps = {
  item: Product;
  index: number;
  quantity: number;
};

const ProductItemWrapper = ({
  item,
  index,
  quantity,
}: ProductItemWrapperProps) => {
  return (
    <ProductItem
      item={item}
      index={index}
      quantity={quantity}
    />
  );
};

export default memo(ProductItemWrapper);