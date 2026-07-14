import {
  buildUpdatedClientVersions,
  shouldFetchByVersion,
} from "@/utils/appSyncCache";

describe("shouldFetchByVersion", () => {
  it("returns true when client version is missing", () => {
    expect(shouldFetchByVersion(undefined, 3)).toBe(true);
  });

  it("returns true when client version is behind server", () => {
    expect(shouldFetchByVersion(2, 3)).toBe(true);
  });

  it("returns false when client version matches server", () => {
    expect(shouldFetchByVersion(3, 3)).toBe(false);
  });

  it("returns false when client version is ahead of server", () => {
    expect(shouldFetchByVersion(4, 3)).toBe(false);
  });
});

describe("buildUpdatedClientVersions", () => {
  it("copies global server versions", () => {
    expect(
      buildUpdatedClientVersions({
        carousel: 2,
        offers: 5,
        deliverySettings: 1,
        storeConfig: 3,
        category: 4,
        product: 6,
      }),
    ).toEqual({
      carousel: 2,
      offers: 5,
      deliverySettings: 1,
      storeConfig: 3,
      category: 4,
      product: 6,
    });
  });
});
