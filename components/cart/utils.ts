import { CartItem, Product, ProductDetails } from "@/types/global";

export const calculateTotalAmount = (products: CartItem[] = []): number => {
  return products?.reduce((total, product) => {
    const productTotal = product?.productDetails?.discountedPrice
      ? parseFloat(
          (
            product?.productDetails?.discountedPrice * product?.quantity
          )?.toFixed(2)
        )
      : 0;

    return parseFloat(total?.toFixed(2)) + productTotal;
  }, 0);
};

export const calculateTotalAmountMrp = (products: CartItem[] = []): number => {
  return products?.reduce((total, product) => {
    const productTotal = product?.productDetails?.price
      ? parseFloat(
          (
            product?.productDetails?.price * product?.quantity
          )?.toFixed(2)
        )
      : 0;

    return parseFloat(total?.toFixed(2)) + productTotal;
  }, 0);
};

export const findCartChanges = (prevCart, nextCart) => {
  const priceChanges = [];
  const removedItems = [];
  console.log("jio87", prevCart);
  // Create a map for fast lookup of previous items
  const prevItemsMap = new Map(
    prevCart?.cart?.items?.map((item) => {
      console.log("87654efghjk", item);
      return [item.productId, item];
    })
  );
  console.log("567567890890-", prevItemsMap);

  // Iterate over nextCart items to check for price changes
  nextCart?.cart?.items.forEach((nextItem) => {
    const prevItem = prevItemsMap.get(nextItem.productId);

    if (prevItem) {
      // Check if the discounted price has changed
      if (
        prevItem.productDetails.discountedPrice !==
        nextItem.productDetails.discountedPrice
      ) {
        priceChanges.push({
          productId: nextItem.productId,
          productName: nextItem.productDetails.name,
          oldPrice: prevItem.productDetails.discountedPrice,
          newPrice: nextItem.productDetails.discountedPrice,
        });
      }

      // Remove the item from the map to track remaining items
      prevItemsMap.delete(nextItem.productId);
    }
  });

  // Any items left in the map were removed in the nextCart
  for (const [productId, removedItem] of prevItemsMap.entries()) {
    removedItems.push({
      productId,
      productName: removedItem.productDetails.name,
      oldPrice: removedItem.productDetails.discountedPrice,
    });
  }
  return { priceChanges, removedItems };
};

export const findProductChanges = (prevCart: Product, nextCart: Product) => {
  return prevCart?.price !== nextCart?.price || prevCart?.image!== nextCart?.image || prevCart?.name!== nextCart?.name || prevCart?.discountedPrice!== nextCart?.discountedPrice
};
