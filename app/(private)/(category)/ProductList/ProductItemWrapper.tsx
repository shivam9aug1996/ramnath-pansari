import React, { memo } from "react";
import ProductItem from "./ProductItem";
import { Product } from "@/types/global";

type ProductItemWrapperProps = {
  item: Product;
  index: number;
  quantity: number;
  isCartLoading: boolean;
};

const ProductItemWrapper = ({
  item,
  index,
  quantity,
  isCartLoading,
}: ProductItemWrapperProps) => {
  return (
    <ProductItem
      item={item}
      index={index}
      quantity={quantity}
      isCartLoading={isCartLoading}
    />
  );
};

export default memo(ProductItemWrapper);