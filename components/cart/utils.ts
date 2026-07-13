import { CartItem, Product, ProductDetails } from "@/types/global";
import { devError, devLog, devWarn } from "@/utils/devLog";
import { getCatalogBillItems } from "@/utils/cartOfferUtils";

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

/** MRP for normal catalog lines only — excludes offer freebies. */
export const calculateCatalogMrp = (products: CartItem[] = []): number =>
  calculateTotalAmountMrp(getCatalogBillItems(products));

/** Selling total for normal catalog lines only — excludes offer freebies. */
export const calculateCatalogSubtotal = (products: CartItem[] = []): number =>
  calculateTotalAmount(getCatalogBillItems(products));

const normalizeCartProductId = (productId: unknown) =>
  productId != null ? String(productId) : "";

export const findCartChanges = (prevCart, nextCart) => {
  const priceChanges = [];
  const removedItems = [];
 // devLog("jio87", prevCart);
  // Create a map for fast lookup of previous items
  const prevItemsMap = new Map(
    prevCart?.cart?.items?.map((item) => {
     // devLog("87654efghjk", item);
      return [normalizeCartProductId(item.productId), item];
    })
  );
//  devLog("567567890890-", prevItemsMap);

  // Iterate over nextCart items to check for price changes
  nextCart?.cart?.items.forEach((nextItem) => {
    const prevItem = prevItemsMap.get(normalizeCartProductId(nextItem.productId));

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
      prevItemsMap.delete(normalizeCartProductId(nextItem.productId));
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


// ... existing code ...

// ... existing code ...

export const findMaxQuantityChanges = (prevCart, nextCart) => {
  const maxQuantityChanges = [];
  const itemsToRemove = [];

  // Create a map for fast lookup of previous items
  const prevItemsMap = new Map(
    prevCart?.cart?.items?.map((item) => {
      return [normalizeCartProductId(item.productId), item];
    })
  );

  // Iterate over nextCart items to check for maxQuantity changes
  nextCart?.cart?.items.forEach((nextItem) => {
    const prevItem = prevItemsMap.get(normalizeCartProductId(nextItem.productId));

    if (prevItem) {
      const prevMaxQuantity = prevItem.productDetails?.maxQuantity ?? 5;
      const nextMaxQuantity = nextItem.productDetails?.maxQuantity ?? 5;

      // Check if maxQuantity has changed
      if (prevMaxQuantity !== nextMaxQuantity) {
        const prevQty = prevItem.quantity ?? 0;
        const nextQty = nextItem.quantity ?? 0;
        const qtyWasCapped = nextQty < prevQty;

        // If new maxQuantity is 0, mark for removal
        if (nextMaxQuantity === 0) {
          itemsToRemove.push({
            productId: nextItem.productId,
            productName: nextItem.productDetails.name,
            oldMaxQuantity: prevMaxQuantity,
            newMaxQuantity: nextMaxQuantity,
          });
        } else if (
          nextMaxQuantity < prevMaxQuantity &&
          (prevQty > nextMaxQuantity || qtyWasCapped)
        ) {
          devLog("[cart-sync] maxQuantity:block checkout", {
            productId: nextItem.productId,
            productName: nextItem.productDetails.name,
            prevMaxQuantity,
            nextMaxQuantity,
            prevQty,
            nextQty,
            qtyWasCapped,
          });
          maxQuantityChanges.push({
            productId: nextItem.productId,
            productName: nextItem.productDetails.name,
            oldMaxQuantity: prevMaxQuantity,
            newMaxQuantity: nextMaxQuantity,
          });
        } else if (nextMaxQuantity < prevMaxQuantity) {
          devLog("[cart-sync] maxQuantity:ignored (no user impact)", {
            productId: nextItem.productId,
            productName: nextItem.productDetails.name,
            prevMaxQuantity,
            nextMaxQuantity,
            prevQty,
            nextQty,
          });
        }
      }

      // Remove the item from the map to track remaining items
      prevItemsMap.delete(normalizeCartProductId(nextItem.productId));
    }
  });

  return { maxQuantityChanges, itemsToRemove };
};