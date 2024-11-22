import { CartItem } from "@/types/global";

export const calculateTotalAmount = (products: CartItem[] = []): number => {
  return products.reduce((total, product) => {
    const productTotal = parseFloat(
      (product.productDetails.discountedPrice * product.quantity).toFixed(2)
    );

    return parseFloat(total.toFixed(2)) + productTotal;
  }, 0);
};
