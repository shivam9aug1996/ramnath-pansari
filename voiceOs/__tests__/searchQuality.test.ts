import {
  rankSearchProducts,
  rewriteSearchKeyword,
  sizeMatchesProduct,
} from "@/voiceOs/searchQuality";
import type { SessionProduct } from "@/voiceOs/types";

const base = (
  partial: Partial<SessionProduct> & Pick<SessionProduct, "_id" | "name">,
): SessionProduct => ({
  size: null,
  price: 100,
  discountedPrice: 100,
  isOutOfStock: false,
  maxQuantity: 5,
  image: null,
  ...partial,
});

describe("searchQuality", () => {
  describe("rewriteSearchKeyword", () => {
    it("preserves brand on mustard rewrite", () => {
      expect(rewriteSearchKeyword("patanjali sarso tel")).toBe(
        "patanjali mustard oil",
      );
      expect(rewriteSearchKeyword("fortune sarson ka tel")).toMatch(
        /fortune mustard oil/i,
      );
    });

    it("rewrites bare sarso to mustard oil", () => {
      expect(rewriteSearchKeyword("sarso")).toBe("mustard oil");
      expect(rewriteSearchKeyword("sarson")).toBe("mustard oil");
    });

    it("rewrites loose chini → loose sugar", () => {
      expect(rewriteSearchKeyword("loose chini")).toBe("loose sugar");
    });

    it("rewrites exact chai → tea but not chahiye leftovers", () => {
      expect(rewriteSearchKeyword("chai")).toBe("tea");
      // chahiye is stripped before keyword; if it leaked, synonym map must not rewrite mid-word
      expect(rewriteSearchKeyword("chahiye")).toBe("chahiye");
    });

    it.each([
      ["namak", "salt"],
      ["haldi", "turmeric"],
      ["jeera", "cumin"],
      ["dahi", "curd"],
      ["anda", "eggs"],
      ["makhan", "butter"],
      ["doodh", "milk"],
      ["chini", "sugar"],
      ["chawal", "rice"],
    ])("%s → %s", (from, to) => {
      expect(rewriteSearchKeyword(from)).toBe(to);
    });

    it("leaves english brand queries intact", () => {
      expect(rewriteSearchKeyword("fortune oil")).toBe("fortune oil");
    });
  });

  describe("rankSearchProducts", () => {
    it("boosts size match when preferSize set", () => {
      const products = [
        base({ _id: "5", name: "Fortune Oil", size: "5 L" }),
        base({ _id: "1", name: "Fortune Oil", size: "1 L" }),
      ];
      const ranked = rankSearchProducts(products, "fortune oil", {
        preferSize: "1l",
      });
      expect(ranked[0]._id).toBe("1");
      expect(sizeMatchesProduct(ranked[0], "1l")).toBe(true);
    });

    it("boosts brand token matches", () => {
      const products = [
        base({ _id: "generic", name: "Mustard Oil 1 L", size: "1 L" }),
        base({
          _id: "brand",
          name: "Patanjali Kachi Ghani Mustard Oil",
          size: "1 L",
        }),
      ];
      const ranked = rankSearchProducts(products, "patanjali mustard oil");
      expect(ranked[0]._id).toBe("brand");
    });

    it("penalizes sugar-free / stevia for plain sugar query", () => {
      const products = [
        base({ _id: "diet", name: "Zero Sugar Cola", size: "750 ml" }),
        base({ _id: "free", name: "Sugar Free Sweetener", size: "100 g" }),
        base({ _id: "real", name: "Independence Crystal Sugar", size: "1 Kg" }),
      ];
      const ranked = rankSearchProducts(products, "sugar");
      expect(ranked[0]._id).toBe("real");
    });

    it("does not penalize when user asked for sugar free", () => {
      const products = [
        base({ _id: "free", name: "Sugar Free Sweetener", size: "100 g" }),
        base({ _id: "real", name: "Crystal Sugar", size: "1 Kg" }),
      ];
      const ranked = rankSearchProducts(products, "sugar free");
      // no plain-sugar penalty applied
      expect(ranked.map((p) => p._id)).toContain("free");
    });

    it("prefers in-stock first", () => {
      const products = [
        base({
          _id: "oos",
          name: "Fortune Mustard Oil",
          size: "1 L",
          isOutOfStock: true,
        }),
        base({
          _id: "ok",
          name: "Fortune Mustard Oil",
          size: "1 L",
          isOutOfStock: false,
        }),
      ];
      expect(rankSearchProducts(products, "fortune oil")[0]._id).toBe("ok");
    });

    it("ranks Fortune brand above Ready To Eat when query is fortune", () => {
      const products = [
        base({
          _id: "rte1",
          name: "Mtr Ready To Eat Mutter Paneer 300 G",
          size: "300 g",
        }),
        base({
          _id: "rte2",
          name: "Act Ii Ready To Eat Salted Caramel Popcorn",
          size: "72 g",
        }),
        base({
          _id: "fb",
          name: "Fortune Besan 1 Kg",
          size: "1 kg",
        }),
        base({
          _id: "fo",
          name: "Fortune Mustard Oil 1 L",
          size: "1 L",
        }),
      ];
      const ranked = rankSearchProducts(products, "fortune");
      expect(ranked[0]._id).toMatch(/^f/);
      expect(ranked.map((p) => p._id).slice(0, 2).sort()).toEqual(["fb", "fo"]);
    });

    it("ignores stopword to so Ready To Eat does not beat brand", () => {
      const products = [
        base({
          _id: "rte",
          name: "Mtr Ready To Eat Paneer Butter Masala",
          size: "300 g",
        }),
        base({
          _id: "fb",
          name: "Fortune Besan 1 Kg",
          size: "1 kg",
        }),
      ];
      // Even if a bad extractor left "to" in the query, ranking should not prefer RTE
      const ranked = rankSearchProducts(products, "i to fortune");
      expect(ranked[0]._id).toBe("fb");
    });

    it("ranks brand + size together above wrong-size brand", () => {
      const products = [
        base({
          _id: "f5",
          name: "Fortune Sunflower Oil",
          size: "5 L",
        }),
        base({
          _id: "f1",
          name: "Fortune Mustard Oil",
          size: "1 L",
        }),
        base({
          _id: "other",
          name: "Generic Mustard Oil",
          size: "1 L",
        }),
      ];
      const ranked = rankSearchProducts(products, "fortune mustard oil", {
        preferSize: "1l",
      });
      expect(ranked[0]._id).toBe("f1");
    });

    it("penalizes no sugar and stevia for chini query", () => {
      const products = [
        base({ _id: "stevia", name: "Stevia Sweet Drops", size: "10 ml" }),
        base({ _id: "nosugar", name: "No Sugar Cookies", size: "200 g" }),
        base({ _id: "chini", name: "Madhur Pure Sugar", size: "1 Kg" }),
      ];
      expect(rankSearchProducts(products, "chini")[0]._id).toBe("chini");
    });
  });

  describe("sizeMatchesProduct", () => {
    it.each([
      ["1 L", "1l", true],
      ["1 Litre", "1l", true],
      ["500 ml", "500ml", true],
      ["5 Kg", "5kg", true],
      ["5 L", "1l", false],
      ["1 Kg", "1l", false],
    ] as const)("size %s vs hint %s → %s", (size, hint, ok) => {
      expect(
        sizeMatchesProduct(base({ _id: "x", name: "Item", size }), hint),
      ).toBe(ok);
    });

    it("matches size embedded in product name", () => {
      expect(
        sizeMatchesProduct(
          base({ _id: "x", name: "Fortune Oil 1 Litre Pack", size: null }),
          "1l",
        ),
      ).toBe(true);
    });
  });

  describe("rewriteSearchKeyword — more vernacular", () => {
    it("fixes tek typo to tel then mustard", () => {
      expect(rewriteSearchKeyword("sarso tek")).toBe("mustard oil");
    });

    it.each([
      ["cheeni", "sugar"],
      ["chaawal", "rice"],
      ["aata", "atta"],
      ["daal", "dal"],
    ])("%s → %s", (from, to) => {
      expect(rewriteSearchKeyword(from)).toBe(to);
    });

    it("rewrites tokens inside multi-word Hindi queries", () => {
      expect(rewriteSearchKeyword("organic doodh")).toBe("organic milk");
      expect(rewriteSearchKeyword("tata namak")).toBe("tata salt");
      expect(rewriteSearchKeyword("everest haldi")).toBe("everest turmeric");
    });

    it("does not wipe unrelated brands when rewriting mustard phrase", () => {
      expect(rewriteSearchKeyword("dhara sarso oil")).toBe("dhara mustard oil");
    });

    it("trims whitespace and collapses spaces", () => {
      expect(rewriteSearchKeyword("  fortune   oil  ")).toBe("fortune oil");
    });

    it("returns empty for empty input", () => {
      expect(rewriteSearchKeyword("")).toBe("");
      expect(rewriteSearchKeyword("   ")).toBe("");
    });

    it("rewrites bare sarso ka tel phrase", () => {
      expect(rewriteSearchKeyword("sarso ka tel")).toBe("mustard oil");
      expect(rewriteSearchKeyword("sarson ka tel")).toBe("mustard oil");
    });

    it("preserves brand with tek typo", () => {
      expect(rewriteSearchKeyword("patanjali sarso tek")).toBe(
        "patanjali mustard oil",
      );
    });
  });

  describe("ranking edge cases", () => {
    it("demotes OOS and wrong size below in-stock size match", () => {
      const products = [
        base({
          _id: "oos1l",
          name: "Fortune Mustard Oil",
          size: "1 L",
          isOutOfStock: true,
        }),
        base({
          _id: "ok5l",
          name: "Fortune Mustard Oil",
          size: "5 L",
          isOutOfStock: false,
        }),
        base({
          _id: "ok1l",
          name: "Fortune Mustard Oil",
          size: "1 L",
          isOutOfStock: false,
        }),
      ];
      const ranked = rankSearchProducts(products, "fortune oil", {
        preferSize: "1l",
      });
      expect(ranked[0]._id).toBe("ok1l");
      expect(ranked.map((p) => p._id)).toEqual(["ok1l", "ok5l", "oos1l"]);
    });

    it("does not penalize zero-sugar SKU when user asked zero sugar", () => {
      const products = [
        base({ _id: "zs", name: "Zero Sugar Cola", size: "750 ml" }),
        base({ _id: "sugar", name: "Crystal Sugar", size: "1 Kg" }),
      ];
      const ranked = rankSearchProducts(products, "zero sugar");
      expect(ranked[0]._id).toBe("zs");
    });

    it("category-only query does not over-boost random brand prefix", () => {
      const products = [
        base({ _id: "oil", name: "Mustard Oil", size: "1 L" }),
        base({ _id: "brand", name: "Fortune Biscuits", size: "100 g" }),
      ];
      const ranked = rankSearchProducts(products, "mustard oil");
      expect(ranked[0]._id).toBe("oil");
    });
  });
});
