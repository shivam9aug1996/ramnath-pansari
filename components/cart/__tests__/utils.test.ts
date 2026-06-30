import { findCartChanges, findMaxQuantityChanges } from "@/components/cart/utils";
import type { CartItem } from "@/types/global";

function item(
  id: string,
  name: string,
  price: number,
  qty = 1,
  maxQuantity = 5,
): CartItem {
  return {
    productId: id,
    quantity: qty,
    productDetails: {
      _id: id,
      name,
      discountedPrice: price,
      maxQuantity,
    } as CartItem["productDetails"],
  } as CartItem;
}

describe("cart checkout utils", () => {
  describe("findCartChanges", () => {
    it("detects price changes", () => {
      const prev = { cart: { items: [item("p1", "Ghee", 100)] } };
      const next = { cart: { items: [item("p1", "Ghee", 120)] } };

      const result = findCartChanges(prev, next);

      expect(result.priceChanges).toHaveLength(1);
      expect(result.priceChanges[0]).toMatchObject({
        productId: "p1",
        oldPrice: 100,
        newPrice: 120,
      });
      expect(result.removedItems).toHaveLength(0);
    });

    it("detects removed items", () => {
      const prev = { cart: { items: [item("p1", "Ghee", 100)] } };
      const next = { cart: { items: [] } };

      const result = findCartChanges(prev, next);

      expect(result.removedItems).toHaveLength(1);
      expect(result.removedItems[0].productName).toBe("Ghee");
    });
  });

  describe("findMaxQuantityChanges", () => {
    it("flags lowered limits that affect quantity", () => {
      const prev = {
        cart: { items: [item("p1", "Ghee", 100, 3, 5)] },
      };
      const next = {
        cart: { items: [item("p1", "Ghee", 100, 2, 2)] },
      };

      const result = findMaxQuantityChanges(prev, next);

      expect(result.maxQuantityChanges).toHaveLength(1);
      expect(result.maxQuantityChanges[0]).toMatchObject({
        newMaxQuantity: 2,
      });
    });

    it("marks items for removal when maxQuantity becomes 0", () => {
      const prev = {
        cart: { items: [item("p1", "Ghee", 100, 1, 5)] },
      };
      const next = {
        cart: { items: [item("p1", "Ghee", 100, 1, 0)] },
      };

      const result = findMaxQuantityChanges(prev, next);

      expect(result.itemsToRemove).toHaveLength(1);
    });
  });
});
