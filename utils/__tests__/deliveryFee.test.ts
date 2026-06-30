import {
  getDeliveryFee,
  getPayableTotalFromItems,
  hasDeliverySettingsChanged,
  resolveDeliverySettings,
} from "@/utils/deliveryFee";
import { makePaidItem } from "@/utils/checkoutFlowTestHelpers";

describe("deliveryFee", () => {
  it("resolves defaults when settings are partial", () => {
    expect(resolveDeliverySettings(null)).toEqual({
      freeDeliveryMin: 200,
      shippingFee: 50,
    });
  });

  it("waives delivery fee above minimum", () => {
    expect(getDeliveryFee(250, { freeDeliveryMin: 200, shippingFee: 50 })).toBe(
      0,
    );
  });

  it("charges shipping fee below minimum", () => {
    expect(getDeliveryFee(100, { freeDeliveryMin: 200, shippingFee: 50 })).toBe(
      50,
    );
  });

  it("detects delivery settings drift", () => {
    expect(
      hasDeliverySettingsChanged(
        { freeDeliveryMin: 200, shippingFee: 50 },
        { freeDeliveryMin: 300, shippingFee: 50 },
      ),
    ).toBe(true);
  });

  it("computes payable total from cart items", () => {
    const items = [makePaidItem("p1", "Ghee", 250, 2)];
    expect(
      getPayableTotalFromItems(items, { freeDeliveryMin: 200, shippingFee: 50 }),
    ).toBe(500);
  });
});
