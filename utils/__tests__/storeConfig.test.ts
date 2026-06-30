import { DEFAULT_STORE_CONFIG } from "@/constants/StoreConfig";
import {
  canAcceptOrders,
  getStoreClosedCacheHint,
  hasStoreConfigChanged,
  isStoreOpen,
  resolveStoreConfig,
} from "@/utils/storeConfig";

const OPEN_NOW = new Date("2026-06-17T06:30:00.000Z");
const CLOSED_NOW = new Date("2026-06-17T02:00:00.000Z");

describe("storeConfig", () => {
  it("resolves default store config", () => {
    expect(resolveStoreConfig(null)).toEqual(DEFAULT_STORE_CONFIG);
  });

  it("detects store open during business hours", () => {
    expect(isStoreOpen(DEFAULT_STORE_CONFIG.storeHours, OPEN_NOW)).toBe(true);
  });

  it("detects store closed outside business hours", () => {
    expect(isStoreOpen(DEFAULT_STORE_CONFIG.storeHours, CLOSED_NOW)).toBe(false);
    expect(canAcceptOrders(DEFAULT_STORE_CONFIG, CLOSED_NOW)).toBe(false);
  });

  it("blocks orders when manually closed", () => {
    const closed = resolveStoreConfig({ acceptingOrders: false });
    expect(canAcceptOrders(closed, OPEN_NOW)).toBe(false);
  });

  it("returns cache hint when store appears closed", () => {
    const closed = resolveStoreConfig({ acceptingOrders: false });
    expect(getStoreClosedCacheHint(closed)).toContain("Tap Checkout");
    expect(getStoreClosedCacheHint(DEFAULT_STORE_CONFIG, OPEN_NOW)).toBeNull();
  });

  it("detects store config drift", () => {
    const latest = resolveStoreConfig({
      storeHours: {
        openTime: "10:00",
        closeTime: "21:00",
        timezone: "Asia/Kolkata",
      },
    });

    expect(hasStoreConfigChanged(DEFAULT_STORE_CONFIG, latest)).toBe(true);
  });
});
