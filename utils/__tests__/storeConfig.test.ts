import { DEFAULT_STORE_CONFIG } from "@/constants/StoreConfig";
import {
  canAcceptOrders,
  getHomeStoreStatus,
  getNextOpenLabel,
  getStoreClosedCacheHint,
  hasStoreConfigChanged,
  isStoreOpen,
  resolveStoreConfig,
} from "@/utils/storeConfig";

const OPEN_NOW = new Date("2026-06-17T06:30:00.000Z");
const CLOSED_NOW = new Date("2026-06-17T02:00:00.000Z");
const AFTER_CLOSE_NOW = new Date("2026-06-17T16:00:00.000Z");

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

  it("labels next open before hours and after close", () => {
    expect(getNextOpenLabel(DEFAULT_STORE_CONFIG.storeHours, CLOSED_NOW)).toBe(
      "Opens at 09:00",
    );
    expect(
      getNextOpenLabel(DEFAULT_STORE_CONFIG.storeHours, AFTER_CLOSE_NOW),
    ).toBe("Opens tomorrow at 09:00");
    expect(getNextOpenLabel(DEFAULT_STORE_CONFIG.storeHours, OPEN_NOW)).toBeNull();
  });

  it("maps progress to the full open window (open→close)", () => {
    // Default hours 09:00–21:00 IST. OPEN_NOW is 12:00 IST → 3h / 12h = 0.25
    const openStatus = getHomeStoreStatus(DEFAULT_STORE_CONFIG, OPEN_NOW);
    expect(openStatus.progress).toBeCloseTo(0.25, 5);
    expect(openStatus.remainingLabel).toMatch(/^Closes in /);

    // CLOSED_NOW is 07:30 IST → before open
    const beforeOpen = getHomeStoreStatus(DEFAULT_STORE_CONFIG, CLOSED_NOW);
    expect(beforeOpen.progress).toBe(0);
    expect(beforeOpen.remainingLabel).toMatch(/^Opens in /);

    // AFTER_CLOSE_NOW is 21:30 IST → after close
    const afterClose = getHomeStoreStatus(DEFAULT_STORE_CONFIG, AFTER_CLOSE_NOW);
    expect(afterClose.progress).toBe(1);
    expect(afterClose.remainingLabel).toMatch(/^Opens in /);
  });

  it("builds home store status for open, closed, and paused", () => {
    expect(getHomeStoreStatus(DEFAULT_STORE_CONFIG, OPEN_NOW)).toMatchObject({
      kind: "open",
      title: "Store open",
      remainingLabel: expect.stringMatching(/^Closes in /),
      progress: expect.any(Number),
    });
    expect(getHomeStoreStatus(DEFAULT_STORE_CONFIG, CLOSED_NOW)).toMatchObject({
      kind: "closed",
      title: "Store closed",
      remainingLabel: expect.stringMatching(/^Opens in /),
      progress: 0,
    });
    expect(
      getHomeStoreStatus({ acceptingOrders: false }, OPEN_NOW),
    ).toMatchObject({
      kind: "paused",
      title: "Not accepting orders right now",
      progress: null,
      remainingLabel: null,
    });
  });
});
