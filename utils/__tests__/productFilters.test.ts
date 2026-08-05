import {
  DEFAULT_PRODUCT_FILTERS,
  countActiveProductFilters,
  getProductCacheKey,
  getProductFilterKey,
  hasActiveProductFilters,
  productFiltersToApiParams,
} from "@/utils/productFilters";

describe("getProductFilterKey", () => {
  it("returns default for empty / null / default filters", () => {
    expect(getProductFilterKey(null)).toBe("default");
    expect(getProductFilterKey(undefined)).toBe("default");
    expect(getProductFilterKey(DEFAULT_PRODUCT_FILTERS)).toBe("default");
    expect(
      getProductFilterKey({
        brands: [],
        sort: "relevance",
        inStockOnly: false,
        priceMin: "",
        priceMax: "  ",
      }),
    ).toBe("default");
  });

  it("normalizes brand case and order for a stable key", () => {
    const a = getProductFilterKey({
      ...DEFAULT_PRODUCT_FILTERS,
      brands: ["Tata", "Amul"],
    });
    const b = getProductFilterKey({
      ...DEFAULT_PRODUCT_FILTERS,
      brands: ["amul", "TATA"],
    });
    expect(a).toBe("b:amul,tata");
    expect(b).toBe(a);
  });

  it("drops blank brand tokens", () => {
    expect(
      getProductFilterKey({
        ...DEFAULT_PRODUCT_FILTERS,
        brands: ["  ", "Fortune", ""],
      }),
    ).toBe("b:fortune");
  });

  it("includes sort, stock, and price range", () => {
    expect(
      getProductFilterKey({
        ...DEFAULT_PRODUCT_FILTERS,
        sort: "price_asc",
      }),
    ).toBe("s:price_asc");

    expect(
      getProductFilterKey({
        ...DEFAULT_PRODUCT_FILTERS,
        inStockOnly: true,
      }),
    ).toBe("stock:1");

    expect(
      getProductFilterKey({
        ...DEFAULT_PRODUCT_FILTERS,
        priceMin: "50",
        priceMax: "200",
      }),
    ).toBe("p:50-200");

    expect(
      getProductFilterKey({
        brands: ["Good Life"],
        sort: "price_desc",
        inStockOnly: true,
        priceMin: "10",
        priceMax: "",
      }),
    ).toBe("b:good life|s:price_desc|stock:1|p:10-");
  });

  it("does not treat relevance as an active sort", () => {
    expect(
      getProductFilterKey({
        ...DEFAULT_PRODUCT_FILTERS,
        sort: "relevance",
        brands: ["Amul"],
      }),
    ).toBe("b:amul");
  });
});

describe("hasActiveProductFilters / countActiveProductFilters", () => {
  it("reports inactive for defaults", () => {
    expect(hasActiveProductFilters(DEFAULT_PRODUCT_FILTERS)).toBe(false);
    expect(countActiveProductFilters(DEFAULT_PRODUCT_FILTERS)).toBe(0);
    expect(countActiveProductFilters(null)).toBe(0);
  });

  it("counts each filter dimension once", () => {
    expect(
      countActiveProductFilters({
        brands: ["A", "B"],
        sort: "name_asc",
        inStockOnly: true,
        priceMin: "1",
        priceMax: "99",
      }),
    ).toBe(4);

    expect(
      hasActiveProductFilters({
        ...DEFAULT_PRODUCT_FILTERS,
        brands: ["X"],
      }),
    ).toBe(true);
  });
});

describe("productFiltersToApiParams", () => {
  it("returns empty object for defaults", () => {
    expect(productFiltersToApiParams(DEFAULT_PRODUCT_FILTERS)).toEqual({});
    expect(productFiltersToApiParams(null)).toEqual({});
  });

  it("maps brands, sort, stock, and numeric prices", () => {
    expect(
      productFiltersToApiParams({
        brands: [" Tata ", "Amul"],
        sort: "price_asc",
        inStockOnly: true,
        priceMin: "20",
        priceMax: "100.5",
      }),
    ).toEqual({
      brand: "Tata,Amul",
      sort: "price_asc",
      inStock: true,
      priceMin: 20,
      priceMax: 100.5,
    });
  });

  it("omits relevance sort and non-numeric prices", () => {
    expect(
      productFiltersToApiParams({
        ...DEFAULT_PRODUCT_FILTERS,
        sort: "relevance",
        priceMin: "abc",
        priceMax: "",
      }),
    ).toEqual({});
  });

  it("allows open-ended price ranges", () => {
    expect(
      productFiltersToApiParams({
        ...DEFAULT_PRODUCT_FILTERS,
        priceMin: "50",
      }),
    ).toEqual({ priceMin: 50 });

    expect(
      productFiltersToApiParams({
        ...DEFAULT_PRODUCT_FILTERS,
        priceMax: "80",
      }),
    ).toEqual({ priceMax: 80 });
  });
});

describe("getProductCacheKey", () => {
  it("keeps legacy unfiltered keys without a filter suffix", () => {
    expect(getProductCacheKey("cat1", 1)).toBe("products-cat1-1");
    expect(getProductCacheKey("cat1", 1, "default")).toBe("products-cat1-1");
    expect(getProductCacheKey("cat1", 2, "")).toBe("products-cat1-2");
  });

  it("namespaces filtered pages so they do not overwrite unfiltered cache", () => {
    const unfiltered = getProductCacheKey("cat1", 1, "default");
    const filtered = getProductCacheKey("cat1", 1, "b:tata|s:price_asc");
    expect(unfiltered).toBe("products-cat1-1");
    expect(filtered).toBe("products-cat1-1-b:tata|s:price_asc");
    expect(filtered).not.toBe(unfiltered);
  });

  it("uses distinct keys per page for the same filter", () => {
    const key = "b:amul";
    expect(getProductCacheKey("cat1", 1, key)).toBe("products-cat1-1-b:amul");
    expect(getProductCacheKey("cat1", 2, key)).toBe("products-cat1-2-b:amul");
  });
});
