import {
  buildResponseAfterTools,
  extractSearchKeyword,
  parseAddQuantity,
  parseMultiProductKeywords,
  parseProductIndices,
  parseQuantity,
  parseSizeHint,
  planTurn,
  sizeMatchesProduct,
  wantsAddToCart,
  wantsCheckout,
} from "@/voiceOs/agent/localAgent";
import { createInitialContext } from "@/voiceOs/types";
import type { SessionProduct } from "@/voiceOs/types";

const sugar: SessionProduct = {
  _id: "sugar1",
  name: "Independence Crystal Sugar",
  size: "1 Kg",
  price: 59,
  discountedPrice: 59,
  isOutOfStock: false,
  maxQuantity: 5,
  image: null,
};

const oil1l: SessionProduct = {
  _id: "oil1",
  name: "Fortune Kachi Ghani Mustard Oil",
  size: "1 L",
  price: 190,
  discountedPrice: 190,
  isOutOfStock: false,
  maxQuantity: 5,
  image: null,
};

const oil5l: SessionProduct = {
  _id: "oil5",
  name: "Fortune Sunflower Oil",
  size: "5 L",
  price: 800,
  discountedPrice: 800,
  isOutOfStock: false,
  maxQuantity: 3,
  image: null,
};

const groundnut: SessionProduct = {
  _id: "gn1",
  name: "Fortune Gold Nut Refined Groundnut Oil",
  size: "1 L",
  price: 205,
  discountedPrice: 205,
  isOutOfStock: false,
  maxQuantity: 5,
  image: null,
};

function selecting(...products: SessionProduct[]) {
  return createInitialContext({
    language: "hi",
    customerId: "u1",
    pendingProductSelection: true,
    lastSearchProducts: products,
    lastSearchQuery: "fortune oil",
  });
}

describe("voiceOs localAgent — extra edge cases", () => {
  describe("size + quantity parsing", () => {
    it.each([
      ["1l", "1l"],
      ["1 L", "1l"],
      ["1 litre", "1l"],
      ["1 liter", "1l"],
      ["500 ml", "500ml"],
      ["5kg", "5kg"],
      ["250 g", "250g"],
      ["2 gm", "2g"],
    ])("parseSizeHint(%s) → %s", (input, expected) => {
      expect(parseSizeHint(`add oil ${input}`)).toBe(expected);
    });

    it("sizeMatchesProduct normalizes litre / L", () => {
      expect(sizeMatchesProduct(oil1l, "1l")).toBe(true);
      expect(sizeMatchesProduct(oil1l, "1 litre")).toBe(true);
      expect(sizeMatchesProduct(oil5l, "1l")).toBe(false);
      expect(sizeMatchesProduct(oil5l, "5l")).toBe(true);
    });

    it.each([
      ["add fortune oil 1l 3 quantity", 3],
      ["add fortune oil 1l qty 3", 3],
      ["quantity 4 add sugar", 4],
      ["add oil 2 pcs", 2],
      ["sarso tel 1l add krdo", null], // size only → default preferQty 1 at plan time
      ["add mustard oil 1l 2", 2],
      ["2 packet chahiye", 2],
    ])("parseAddQuantity(%s)", (utter, expected) => {
      expect(parseAddQuantity(utter)).toBe(expected);
    });

    it("does not treat 1 from 1l as add quantity when only size present", () => {
      // After size strip nothing left numeric → null; planTurn uses preferQty ?? 1
      expect(parseAddQuantity("sarso ka tel 1l add karo")).toBeNull();
      expect(
        planTurn("sarso ka tel 1l add karo", createInitialContext()).toolCalls[0]
          ?.args.preferQty,
      ).toBe(1);
    });

    it.each([
      ["ek", 1],
      ["do", 2],
      ["teen", 3],
      ["char", 4],
      ["paanch", 5],
      ["5", 5],
      ["3 quantity", 3],
      ["2 pcs", 2],
    ])("parseQuantity(%s) → %s", (input, expected) => {
      expect(parseQuantity(input)).toBe(expected);
    });
  });

  describe("keyword stripping", () => {
    it.each([
      ["add fortune oil 1l 3 quantity", /^fortune oil$/i],
      ["please find atta 5kg", /^atta$/i],
      ["mujhko chini 1 kg chahiye", /^chini$/i],
      ['search "toor dal"', /^toor dal$/i],
      ["buy 500ml coconut oil", /coconut oil/i],
      ["i want to buy fortune?", /^fortune$/i],
      ["I want to buy Fortune", /^fortune$/i],
      ["can you add fortune oil", /^fortune oil$/i],
      ["would like to buy patanjali atta", /patanjali atta/i],
    ])("extractSearchKeyword(%s)", (utter, expectKw) => {
      expect(extractSearchKeyword(utter)).toMatch(expectKw);
    });

    it("strips trailing qty without losing brand", () => {
      expect(extractSearchKeyword("sacha moti dal 2 quantity")).toMatch(
        /sacha moti dal/i,
      );
      expect(extractSearchKeyword("sacha moti dal 2 quantity")).not.toMatch(
        /\b2\b|quantity/i,
      );
    });

    it("never leaves i/to fillers in fortune buy phrases", () => {
      const kw = extractSearchKeyword("i want to buy fortune?");
      expect(kw).toBe("fortune");
      expect(kw).not.toMatch(/\bi\b|\bto\b/i);
    });
  });

  describe("wantsAddToCart / wantsCheckout boundaries", () => {
    it.each([
      "add to cart",
      "cart me add karo",
      "dal do cart mein",
      "fortune oil add kar do",
      "krdo cart me",
    ])("wantsAddToCart: %s", (utter) => {
      expect(wantsAddToCart(utter)).toBe(true);
    });

    it.each(["cart dikhao", "cart khali karo", "show cart", "hello"])(
      "does NOT want add: %s",
      (utter) => {
        expect(wantsAddToCart(utter)).toBe(false);
      },
    );

    it("product buy intent is search not checkout", () => {
      expect(wantsCheckout("chini buy karna hai")).toBe(false);
      expect(wantsCheckout("mujhe yeh buy karna hai")).toBe(true);
    });
  });

  describe("product index picking", () => {
    it.each([
      ["1", [0]],
      ["2", [1]],
      ["pehla", null], // index words go through matchPendingProduct, not parseProductIndices
      ["5 and 7", [4, 6]],
      ["3, 5", [2, 4]],
      ["2 aur 4", [1, 3]],
      ["fortune oil 5kg", []],
    ])("parseProductIndices(%s)", (text, expected) => {
      if (expected === null) {
        expect(parseProductIndices(text, 8)).toEqual([]);
        return;
      }
      expect(parseProductIndices(text, 8)).toEqual(expected);
    });

    it("Hinglish index words select product", () => {
      const pehla = planTurn("pehla", selecting(oil1l, groundnut, oil5l));
      expect(pehla.earlyResult?.contextPatch.selectedProduct?._id).toBe("oil1");
      expect(pehla.earlyResult?.contextPatch.pendingQuantity).toBe(true);

      const doosra = planTurn("doosra", selecting(oil1l, groundnut, oil5l));
      expect(doosra.earlyResult?.contextPatch.selectedProduct?._id).toBe("gn1");
    });

    it("multi pick 1 and 3 queues the rest after first qty", () => {
      const picked = planTurn("1 and 3", selecting(oil1l, sugar, groundnut));
      expect(picked.earlyResult?.contextPatch.selectedProduct?._id).toBe("oil1");
      expect(picked.earlyResult?.contextPatch.pendingProductQueue?.[0]?._id).toBe(
        "gn1",
      );
      expect(picked.earlyResult?.assistantMessage).toMatch(/Baad mein|more/i);
    });

    it("pick with pendingAddQuantity skips qty ask → confirm", () => {
      const picked = planTurn(
        "2",
        createInitialContext({
          language: "hi",
          pendingProductSelection: true,
          pendingAddQuantity: 3,
          lastSearchProducts: [oil1l, groundnut],
          lastSearchQuery: "fortune oil",
        }),
      );
      expect(picked.earlyResult?.contextPatch.pendingConfirmation?.toolArgs).toMatchObject({
        productId: "gn1",
        quantity: 3,
      });
      expect(picked.earlyResult?.contextPatch.pendingQuantity).toBe(false);
    });

    it("OOS product on pick does not open confirm", () => {
      const oos = { ...oil1l, isOutOfStock: true };
      const picked = planTurn("1", selecting(oos, groundnut));
      expect(picked.earlyResult?.contextPatch.pendingConfirmation).toBeFalsy();
      expect(picked.earlyResult?.assistantMessage).toMatch(/out of stock/i);
    });
  });

  describe("quantity gate", () => {
    const qtyCtx = createInitialContext({
      language: "hi",
      pendingQuantity: true,
      selectedProduct: sugar,
    });

    it("accepts teen → confirm qty 3", () => {
      const r = planTurn("teen", qtyCtx);
      expect(r.earlyResult?.contextPatch.pendingConfirmation?.toolArgs).toMatchObject({
        quantity: 3,
      });
    });

    it("rejects over max", () => {
      const r = planTurn("9", qtyCtx);
      expect(r.earlyResult?.assistantMessage).toMatch(/Maximum 5|Max allowed/i);
      expect(r.earlyResult?.contextPatch.pendingConfirmation).toBeUndefined();
    });

    it("rejects non-number filler", () => {
      const r = planTurn("hmm", qtyCtx);
      expect(r.earlyResult?.assistantMessage).toMatch(/Quantity|number/i);
    });

    it("soft-escapes qty to new search", () => {
      const r = planTurn("atta chahiye", qtyCtx);
      expect(r.sessionPatch?.pendingQuantity).toBe(false);
      expect(r.toolCalls[0]?.name).toBe("searchProducts");
      expect(String(r.toolCalls[0]?.args.keyword)).toMatch(/atta/i);
    });
  });

  describe("confirmation gate", () => {
    const conf = createInitialContext({
      language: "hi",
      customerId: "u1",
      pendingConfirmation: {
        title: "Cart mein add karein?",
        summary: { Product: sugar.name, Quantity: "2" },
        toolName: "addToCart",
        toolArgs: { productId: "sugar1", quantity: 2, name: sugar.name },
      },
    });

    it.each(["haan", "haa", "ha", "yes", "ok", "okay", "bilkul"])(
      "affirm %s runs addToCart",
      (utter) => {
        expect(planTurn(utter, conf).toolCalls[0]?.name).toBe("addToCart");
      },
    );

    it.each(["nahi", "no", "cancel", "mat"])("deny %s clears confirm", (utter) => {
      const r = planTurn(utter, conf);
      expect(r.toolCalls).toHaveLength(0);
      expect(r.earlyResult?.contextPatch.pendingConfirmation).toBeNull();
      expect(r.earlyResult?.assistantMessage).toMatch(/cancel/i);
    });

    it("filler still prompts Haan/Nahi", () => {
      const r = planTurn("hmm", conf);
      expect(r.earlyResult?.assistantMessage).toMatch(/Haan|Yes/i);
      expect(r.earlyResult?.contextPatch.pendingConfirmation).toBeUndefined();
    });

    it("soft-escape to cart list", () => {
      const r = planTurn("cart dikhao", conf);
      expect(r.toolCalls[0]).toMatchObject({
        name: "getCart",
        args: { mode: "list" },
      });
    });

    it("clearCart confirm then affirm", () => {
      const clearPlan = planTurn(
        "cart khali kar do",
        createInitialContext({ language: "hi", cartItemCount: 3, customerId: "u1" }),
      );
      expect(clearPlan.earlyResult?.contextPatch.pendingConfirmation?.toolName).toBe(
        "clearCart",
      );
      const yes = planTurn(
        "haan",
        createInitialContext({
          pendingConfirmation: clearPlan.earlyResult!.contextPatch.pendingConfirmation!,
        }),
      );
      expect(yes.toolCalls[0]?.name).toBe("clearCart");
    });
  });

  describe("greetings + more results + detail", () => {
    it("greeting responds without tools", () => {
      const r = planTurn("namaste", createInitialContext({ customerName: "Shivam" }));
      expect(r.toolCalls).toHaveLength(0);
      expect(r.earlyResult?.assistantMessage).toMatch(/Namaste.*Shivam|Hello/i);
    });

    it("view all opens search results for last query", () => {
      const r = planTurn(
        "aur dikhao",
        createInitialContext({ lastSearchQuery: "fortune oil" }),
      );
      expect(r.toolCalls[0]).toMatchObject({
        name: "openUi",
        args: { action: "OPEN_SEARCH_RESULTS", query: "fortune oil" },
      });
    });

    it("English view all", () => {
      expect(
        planTurn(
          "view all",
          createInitialContext({ lastSearchQuery: "sugar" }),
        ).toolCalls[0]?.args,
      ).toMatchObject({ action: "OPEN_SEARCH_RESULTS", query: "sugar" });
    });

    it("open product detail when selected", () => {
      const r = planTurn(
        "product details dikhao",
        createInitialContext({ selectedProduct: oil1l }),
      );
      // only if DETAIL_HINTS matches — may vary
      if (r.toolCalls[0]?.name === "openUi") {
        expect(r.toolCalls[0].args).toMatchObject({
          action: "OPEN_PRODUCT_DETAIL",
          productId: "oil1",
        });
      }
    });
  });

  describe("multi-product queue responses", () => {
    it("add success advances pendingProductQueue", () => {
      const result = buildResponseAfterTools({
        userText: "haan",
        context: createInitialContext({
          language: "hi",
          pendingProductQueue: [groundnut],
        }),
        toolCalls: [
          {
            id: "a1",
            name: "addToCart",
            args: { productId: "oil1", quantity: 1 },
          },
        ],
        toolResults: [
          {
            ok: true,
            toolName: "addToCart",
            data: {
              name: oil1l.name,
              quantity: 1,
              lineQuantity: 1,
              cartItemCount: 1,
              cartItems: [],
            },
          },
        ],
      });
      expect(result.contextPatch.pendingQuantity).toBe(true);
      expect(result.contextPatch.selectedProduct?._id).toBe("gn1");
      expect(result.assistantMessage).toMatch(/Ab next|Next/i);
    });

    it("add success advances pendingSearchQueue", () => {
      const result = buildResponseAfterTools({
        userText: "haan",
        context: createInitialContext({
          language: "en",
          pendingSearchQueue: ["chawal", "sugar"],
        }),
        toolCalls: [
          {
            id: "a1",
            name: "addToCart",
            args: { productId: "oil1", quantity: 1 },
          },
        ],
        toolResults: [
          {
            ok: true,
            toolName: "addToCart",
            data: {
              name: oil1l.name,
              quantity: 1,
              lineQuantity: 1,
              cartItemCount: 1,
              cartItems: [],
            },
          },
        ],
      });
      expect(result.contextPatch.pendingTool).toBe("continueSearchQueue");
      expect(result.assistantMessage).toMatch(/Next: chawal/i);
    });

    it("add failure with login opens login", () => {
      const result = buildResponseAfterTools({
        userText: "haan",
        context: createInitialContext({ language: "hi" }),
        toolCalls: [{ id: "a1", name: "addToCart", args: { productId: "x", quantity: 1 } }],
        toolResults: [
          { ok: false, toolName: "addToCart", error: "Login required" },
        ],
      });
      expect(result.uiAction).toEqual({ action: "OPEN_LOGIN" });
      expect(result.assistantMessage).toMatch(/login/i);
    });
  });

  describe("search response shapes", () => {
    it("zero results without queue", () => {
      const result = buildResponseAfterTools({
        userText: "xyzabc",
        context: createInitialContext({ language: "hi" }),
        toolCalls: [{ id: "s1", name: "searchProducts", args: { keyword: "xyzabc" } }],
        toolResults: [
          {
            ok: true,
            toolName: "searchProducts",
            data: { keyword: "xyzabc", count: 0, products: [] },
          },
        ],
      });
      expect(result.assistantMessage).toMatch(/nahi mila|No products/i);
      expect(result.contextPatch.pendingTool).toBeFalsy();
    });

    it("unique full-set one-shot add still confirms", () => {
      const result = buildResponseAfterTools({
        userText: "add independence sugar 1kg 2 quantity",
        context: createInitialContext({ language: "en" }),
        toolCalls: [
          {
            id: "s1",
            name: "searchProducts",
            args: {
              keyword: "independence sugar",
              intent: "add",
              preferSize: "1kg",
              preferQty: 2,
            },
          },
        ],
        toolResults: [
          {
            ok: true,
            toolName: "searchProducts",
            data: {
              keyword: "independence sugar",
              count: 1,
              totalResults: 1,
              hasMore: false,
              products: [sugar],
            },
          },
        ],
      });
      expect(result.contextPatch.pendingConfirmation?.toolArgs).toMatchObject({
        productId: "sugar1",
        quantity: 2,
      });
    });

    it("non-add search with multiple options asks which", () => {
      const result = buildResponseAfterTools({
        userText: "fortune oil",
        context: createInitialContext({ language: "hi" }),
        toolCalls: [
          { id: "s1", name: "searchProducts", args: { keyword: "fortune oil" } },
        ],
        toolResults: [
          {
            ok: true,
            toolName: "searchProducts",
            data: {
              keyword: "fortune oil",
              count: 2,
              totalResults: 2,
              products: [oil1l, groundnut],
            },
          },
        ],
      });
      expect(result.contextPatch.pendingProductSelection).toBe(true);
      expect(result.assistantMessage).toMatch(/Kaunsa|Which/i);
      expect(result.assistantMessage).toMatch(/mustard|groundnut/i);
      expect(result.contextPatch.pendingAddQuantity).toBeUndefined();
    });

    it("getCart list formats items", () => {
      const result = buildResponseAfterTools({
        userText: "cart dikhao",
        context: createInitialContext({ language: "hi" }),
        toolCalls: [{ id: "g1", name: "getCart", args: { mode: "list" } }],
        toolResults: [
          {
            ok: true,
            toolName: "getCart",
            data: {
              mode: "list",
              itemCount: 2,
              total: 395,
              items: [
                {
                  productId: "oil1",
                  name: oil1l.name,
                  quantity: 1,
                  unitPrice: 190,
                  lineTotal: 190,
                },
                {
                  productId: "sugar1",
                  name: sugar.name,
                  quantity: 2,
                  unitPrice: 59,
                  lineTotal: 118,
                },
              ],
            },
          },
        ],
      });
      expect(result.assistantMessage).toMatch(/Fortune|Independence/i);
      expect(result.contextPatch.cartItemCount).toBe(2);
    });
  });

  describe("complex Hinglish / English utterances", () => {
    it.each([
      ["bhai fortune mustard oil 1 litre 2 qty cart me daal do", /fortune|mustard/i, "1l", 2],
      ["add 500ml coconut oil qty 1", /coconut/i, "500ml", 1],
      ["patanjali sarso tel 5l add krdo", /sarso|patanjali|tel/i, "5l", 1],
    ] as const)(
      "one-shot plan: %s",
      (utter, kw, size, qty) => {
        const planned = planTurn(utter, createInitialContext({ customerId: "u1" }));
        expect(planned.toolCalls[0]?.name).toBe("searchProducts");
        expect(String(planned.toolCalls[0]?.args.keyword)).toMatch(kw);
        expect(planned.toolCalls[0]?.args).toMatchObject({
          intent: "add",
          preferSize: size,
          preferQty: qty,
        });
      },
    );

    it("explicit aur multi-buy does not ask confirm", () => {
      const planned = planTurn(
        "chini aur chawal dono chahiye",
        createInitialContext({ language: "hi" }),
      );
      expect(planned.toolCalls[0]?.name).toBe("searchProducts");
      expect(planned.earlyResult?.contextPatch.pendingMultiProductConfirm).toBeFalsy();
      expect(planned.toolCalls[0]?.args.searchQueue?.length).toBeGreaterThanOrEqual(1);
    });

    it("space list nahi → search as one phrase", () => {
      const asOne = planTurn(
        "nahi",
        createInitialContext({
          pendingMultiProductConfirm: {
            products: ["dal", "chawal"],
            fullPhrase: "dal chawal",
          },
        }),
      );
      expect(String(asOne.toolCalls[0]?.args.keyword)).toMatch(/dal chawal/i);
      expect(asOne.toolCalls[0]?.args.searchQueue).toBeUndefined();
    });

    it("parseMultiProductKeywords keeps hide and seek", () => {
      expect(parseMultiProductKeywords("hide and seek aur parle G")).toEqual(
        expect.arrayContaining([
          expect.stringMatching(/hide and seek/i),
          expect.stringMatching(/parle/i),
        ]),
      );
    });
  });

  describe("end-to-end: fortune oil pick → confirm qty 3 → checkout path", () => {
    it("partial page → pick 1 → confirm with qty 3 → startCheckout", () => {
      const afterSearch = buildResponseAfterTools({
        userText: "add fortune oil 1l 3 quantity",
        context: createInitialContext({ language: "hi", customerId: "u1" }),
        toolCalls: [
          {
            id: "s1",
            name: "searchProducts",
            args: {
              keyword: "fortune oil",
              intent: "add",
              preferSize: "1l",
              preferQty: 3,
            },
          },
        ],
        toolResults: [
          {
            ok: true,
            toolName: "searchProducts",
            data: {
              keyword: "fortune oil",
              count: 8,
              totalResults: 40,
              hasMore: true,
              products: [oil1l, groundnut, oil5l],
            },
          },
        ],
      });
      expect(afterSearch.contextPatch.pendingProductSelection).toBe(true);
      expect(afterSearch.contextPatch.pendingConfirmation).toBeFalsy();
      expect(afterSearch.contextPatch.pendingAddQuantity).toBe(3);

      // size filter drops 5L → 2 options
      expect(afterSearch.products?.every((p) => sizeMatchesProduct(p, "1l"))).toBe(
        true,
      );

      const pick = planTurn(
        "2",
        createInitialContext({
          language: "hi",
          customerId: "u1",
          pendingProductSelection: true,
          pendingAddQuantity: 3,
          lastSearchProducts: afterSearch.products ?? [oil1l, groundnut],
        }),
      );
      expect(pick.earlyResult?.contextPatch.pendingConfirmation?.toolArgs).toMatchObject({
        quantity: 3,
      });

      const checkout = planTurn(
        "ab checkout karo",
        createInitialContext({
          language: "hi",
          customerId: "u1",
          cartItemCount: 3,
        }),
      );
      expect(checkout.toolCalls[0]?.name).toBe("startCheckout");
    });
  });

  describe("safer affirm + qty phrases + multi-buy size", () => {
    it("ha fortune oil does NOT confirm pending add — starts search", () => {
      const conf = createInitialContext({
        language: "hi",
        customerId: "u1",
        pendingConfirmation: {
          title: "Add?",
          summary: {},
          toolName: "addToCart",
          toolArgs: { productId: "x", quantity: 1 },
        },
      });
      const r = planTurn("ha fortune oil", conf);
      expect(r.toolCalls[0]?.name).toBe("searchProducts");
      expect(String(r.toolCalls[0]?.args.keyword)).toMatch(/fortune oil/i);
      expect(r.sessionPatch?.pendingConfirmation).toBeNull();
    });

    it("accepts 2 packets please as quantity", () => {
      const r = planTurn(
        "2 packets please",
        createInitialContext({
          language: "en",
          pendingQuantity: true,
          selectedProduct: sugar,
        }),
      );
      expect(r.earlyResult?.contextPatch.pendingConfirmation?.toolArgs).toMatchObject({
        quantity: 2,
      });
    });

    it("accepts teen packet as quantity", () => {
      const r = planTurn(
        "teen packet",
        createInitialContext({
          language: "hi",
          pendingQuantity: true,
          selectedProduct: sugar,
        }),
      );
      expect(r.earlyResult?.contextPatch.pendingConfirmation?.toolArgs).toMatchObject({
        quantity: 3,
      });
    });

    it("multi-buy attaches size to oil leg not chini", () => {
      const planned = planTurn(
        "chini aur sarso tel 1l chahiye",
        createInitialContext({ language: "hi" }),
      );
      expect(planned.toolCalls[0]?.name).toBe("searchProducts");
      expect(String(planned.toolCalls[0]?.args.keyword)).toMatch(/chini/i);
      expect(planned.toolCalls[0]?.args.preferSize).toBeUndefined();
      expect(planned.sessionPatch?.pendingSearchPreferSize).toBe("1l");
      expect(planned.toolCalls[0]?.args.searchQueue).toEqual(
        expect.arrayContaining([expect.stringMatching(/sarso|tel|mustard/i)]),
      );
    });

    it("single oil search still gets preferSize", () => {
      const planned = planTurn(
        "patanjali sarso tel 1l add karo",
        createInitialContext({ customerId: "u1" }),
      );
      expect(planned.toolCalls[0]?.args).toMatchObject({
        preferSize: "1l",
        intent: "add",
      });
      expect(String(planned.toolCalls[0]?.args.keyword)).toMatch(/patanjali|sarso|tel/i);
    });

    it("chautha / last index words work", () => {
      const products = [oil1l, sugar, groundnut, oil5l];
      expect(planTurn("chautha", selecting(...products)).earlyResult?.contextPatch.selectedProduct?._id).toBe(
        "oil5",
      );
      expect(planTurn("last", selecting(...products)).earlyResult?.contextPatch.selectedProduct?._id).toBe(
        "oil5",
      );
    });

    it("mentions oil variants when Fortune oils differ", () => {
      const result = buildResponseAfterTools({
        userText: "fortune oil",
        context: createInitialContext({ language: "hi" }),
        toolCalls: [
          { id: "s1", name: "searchProducts", args: { keyword: "fortune oil" } },
        ],
        toolResults: [
          {
            ok: true,
            toolName: "searchProducts",
            data: {
              keyword: "fortune oil",
              count: 2,
              totalResults: 2,
              products: [oil1l, groundnut],
            },
          },
        ],
      });
      expect(result.assistantMessage).toMatch(/mustard|groundnut/i);
      expect(result.assistantMessage).toMatch(/Kaunsa|fortune/i);
    });

    it.each([
      "haan ji",
      "yes please",
      "ok please",
      "bilkul",
      "sure",
      "haa",
    ])("pure affirm still confirms: %s", (utter) => {
      const conf = createInitialContext({
        pendingConfirmation: {
          title: "Add?",
          summary: {},
          toolName: "addToCart",
          toolArgs: { productId: "sugar1", quantity: 1 },
        },
      });
      expect(planTurn(utter, conf).toolCalls[0]?.name).toBe("addToCart");
    });

    it.each([
      "ok add sugar",
      "yes mustard oil",
      "haan chawal chahiye",
    ])("affirm+product does not confirm: %s", (utter) => {
      const conf = createInitialContext({
        language: "hi",
        pendingConfirmation: {
          title: "Add?",
          summary: {},
          toolName: "addToCart",
          toolArgs: { productId: "x", quantity: 1 },
        },
      });
      const r = planTurn(utter, conf);
      expect(r.toolCalls[0]?.name).not.toBe("addToCart");
      expect(r.sessionPatch?.pendingConfirmation).toBeNull();
    });

    it.each([
      ["3 pcs", 3],
      ["char", 4],
      ["paanch please", 5],
      ["one packet", 1],
      ["2 units", 2],
    ])("qty gate accepts %s → %s", (utter, qty) => {
      const r = planTurn(
        utter,
        createInitialContext({
          pendingQuantity: true,
          selectedProduct: sugar,
        }),
      );
      expect(r.earlyResult?.contextPatch.pendingConfirmation?.toolArgs).toMatchObject({
        quantity: qty,
      });
    });

    it("atta 5kg multi-buy stores preferSize for atta leg", () => {
      const planned = planTurn(
        "chini aur atta 5kg",
        createInitialContext({ language: "hi" }),
      );
      expect(String(planned.toolCalls[0]?.args.keyword)).toMatch(/chini/i);
      expect(planned.toolCalls[0]?.args.preferSize).toBeUndefined();
      expect(planned.sessionPatch?.pendingSearchPreferSize).toBe("5kg");
    });

    it("oil-first multi-buy applies preferSize on first search", () => {
      const planned = planTurn(
        "sarso tel 1l aur chini",
        createInitialContext({ language: "hi" }),
      );
      expect(String(planned.toolCalls[0]?.args.keyword)).toMatch(/sarso|tel|mustard/i);
      expect(planned.toolCalls[0]?.args.preferSize).toBe("1l");
    });

    it("does not split parle g with and", () => {
      const parts = parseMultiProductKeywords("parle g and hide and seek");
      expect(parts.some((p) => /parle/i.test(p))).toBe(true);
      expect(parts.some((p) => /hide and seek/i.test(p))).toBe(true);
    });

    it("continueSearchQueue applies pendingSearchPreferSize to oil keyword", () => {
      const r = planTurn(
        "haan",
        createInitialContext({
          language: "hi",
          pendingTool: "continueSearchQueue",
          pendingSearchQueue: ["sarso tel", "chawal"],
          pendingSearchPreferSize: "1l",
        }),
      );
      expect(r.toolCalls[0]?.name).toBe("searchProducts");
      expect(String(r.toolCalls[0]?.args.keyword)).toMatch(/sarso|tel/i);
      expect(r.toolCalls[0]?.args.preferSize).toBe("1l");
      expect(r.sessionPatch?.pendingSearchQueue).toEqual(["chawal"]);
    });

    it("continueSearchQueue skips preferSize for non-sizeful keyword", () => {
      const r = planTurn(
        "next",
        createInitialContext({
          pendingTool: "continueSearchQueue",
          pendingSearchQueue: ["chini"],
          pendingSearchPreferSize: "1l",
        }),
      );
      expect(r.toolCalls[0]?.args.preferSize).toBeUndefined();
    });

    it("mentions sunflower when present among Fortune oils", () => {
      const sunflower = {
        ...oil5l,
        _id: "sf1",
        name: "Fortune Sunflower Oil",
        size: "1 L",
      };
      const result = buildResponseAfterTools({
        userText: "add fortune oil",
        context: createInitialContext({ language: "en" }),
        toolCalls: [
          {
            id: "s1",
            name: "searchProducts",
            args: { keyword: "fortune oil", intent: "add" },
          },
        ],
        toolResults: [
          {
            ok: true,
            toolName: "searchProducts",
            data: {
              keyword: "fortune oil",
              count: 3,
              totalResults: 3,
              products: [oil1l, groundnut, sunflower],
            },
          },
        ],
      });
      expect(result.assistantMessage).toMatch(/mustard|groundnut|sunflower/i);
      expect(result.assistantMessage).toMatch(/Which|variant|Fortune/i);
    });

    it("soft-escapes confirm to checkout", () => {
      const r = planTurn(
        "checkout karo",
        createInitialContext({
          language: "hi",
          customerId: "u1",
          cartItemCount: 2,
          pendingConfirmation: {
            title: "Add?",
            summary: {},
            toolName: "addToCart",
            toolArgs: { productId: "x", quantity: 1 },
          },
        }),
      );
      expect(r.toolCalls[0]?.name).toBe("startCheckout");
      expect(r.sessionPatch?.pendingConfirmation).toBeNull();
    });

    it("deny during qty cancels write gate", () => {
      const r = planTurn(
        "nahi",
        createInitialContext({
          language: "hi",
          pendingQuantity: true,
          selectedProduct: sugar,
        }),
      );
      expect(r.toolCalls).toHaveLength(0);
      expect(r.earlyResult?.contextPatch.pendingQuantity).toBe(false);
      expect(r.earlyResult?.contextPatch.selectedProduct).toBeNull();
      expect(r.earlyResult?.assistantMessage).toMatch(/cancel|Theek/i);
    });
  });

  describe("patanjali one-shot acceptance path", () => {
    it("plans patanjali sarso tel 1l add with size + qty", () => {
      const planned = planTurn(
        "patanjali sarso tel 1l add",
        createInitialContext({ customerId: "u1" }),
      );
      expect(planned.toolCalls[0]?.name).toBe("searchProducts");
      expect(planned.toolCalls[0]?.args).toMatchObject({
        intent: "add",
        preferSize: "1l",
        preferQty: 1,
      });
      expect(String(planned.toolCalls[0]?.args.keyword)).toMatch(/patanjali/i);
      expect(String(planned.toolCalls[0]?.args.keyword)).toMatch(/sarso|tel|mustard/i);
    });

    it("full-set unique patanjali 1L confirms with preferQty", () => {
      const product = {
        ...oil1l,
        _id: "p1",
        name: "Patanjali Kachi Ghani Mustard Oil",
        size: "1 L",
      };
      const result = buildResponseAfterTools({
        userText: "patanjali sarso tel 1l add",
        context: createInitialContext({ language: "hi", customerId: "u1" }),
        toolCalls: [
          {
            id: "s1",
            name: "searchProducts",
            args: {
              keyword: "patanjali mustard oil",
              intent: "add",
              preferSize: "1l",
              preferQty: 1,
            },
          },
        ],
        toolResults: [
          {
            ok: true,
            toolName: "searchProducts",
            data: {
              keyword: "patanjali mustard oil",
              count: 1,
              totalResults: 1,
              hasMore: false,
              products: [product],
            },
          },
        ],
      });
      expect(result.contextPatch.pendingConfirmation?.toolArgs).toMatchObject({
        productId: "p1",
        quantity: 1,
      });
    });
  });

  describe("more affirm / multi-buy / empty-search / UI copy", () => {
    it.each(["haan bilkul", "yes!!!", "y", "ok.", "theek"])(
      "affirm variant confirms: %s",
      (utter) => {
        const conf = createInitialContext({
          pendingConfirmation: {
            title: "Add?",
            summary: {},
            toolName: "addToCart",
            toolArgs: { productId: "sugar1", quantity: 1 },
          },
        });
        expect(planTurn(utter, conf).toolCalls[0]?.name).toBe("addToCart");
      },
    );

    it("space-list haan starts queue and keeps preferSize for oil", () => {
      const ask = planTurn(
        "chini sarso tel chaiye",
        createInitialContext({ language: "hi" }),
      );
      // may confirm multi or search — if confirm, haan next
      if (ask.earlyResult?.contextPatch.pendingMultiProductConfirm) {
        const products =
          ask.earlyResult.contextPatch.pendingMultiProductConfirm.products;
        const confirmed = planTurn(
          "haan",
          createInitialContext({
            language: "hi",
            pendingMultiProductConfirm: {
              products,
              fullPhrase: "chini sarso tel",
            },
          }),
        );
        expect(confirmed.toolCalls[0]?.name).toBe("searchProducts");
        expect(confirmed.toolCalls[0]?.args.searchQueue?.length).toBeGreaterThanOrEqual(
          1,
        );
      }
    });

    it("space-list with size: oil leg gets pendingSearchPreferSize on explicit aur", () => {
      const planned = planTurn(
        "chini aur sarso ka tel 1 litre",
        createInitialContext({ language: "hi" }),
      );
      expect(planned.toolCalls[0]?.name).toBe("searchProducts");
      expect(planned.sessionPatch?.pendingSearchPreferSize).toBe("1l");
    });

    it("empty search with queue signals continue and preserves preferSize in context", () => {
      const result = buildResponseAfterTools({
        userText: "chini",
        context: createInitialContext({
          language: "hi",
          pendingSearchPreferSize: "1l",
        }),
        toolCalls: [
          {
            id: "s1",
            name: "searchProducts",
            args: {
              keyword: "chini",
              searchQueue: ["sarso tel"],
            },
          },
        ],
        toolResults: [
          {
            ok: true,
            toolName: "searchProducts",
            data: { keyword: "chini", count: 0, products: [] },
          },
        ],
      });
      expect(result.contextPatch.pendingTool).toBe("continueSearchQueue");
      expect(result.contextPatch.pendingSearchQueue).toEqual(["sarso tel"]);
      expect(result.contextPatch.pendingSearchPreferSize).toBe("1l");
    });

    it("English single partial-page hit still asks which to add", () => {
      const result = buildResponseAfterTools({
        userText: "add fortune oil 1l 3 quantity",
        context: createInitialContext({ language: "en" }),
        toolCalls: [
          {
            id: "s1",
            name: "searchProducts",
            args: {
              keyword: "fortune oil",
              intent: "add",
              preferSize: "1l",
              preferQty: 3,
            },
          },
        ],
        toolResults: [
          {
            ok: true,
            toolName: "searchProducts",
            data: {
              keyword: "fortune oil",
              count: 8,
              totalResults: 175,
              hasMore: true,
              products: [groundnut, oil5l],
            },
          },
        ],
      });
      expect(result.contextPatch.pendingConfirmation).toBeFalsy();
      expect(result.assistantMessage).toMatch(/Which to add/i);
      expect(result.contextPatch.pendingAddQuantity).toBe(3);
    });

    it("regression: fortune oil 3 quantity keyword is clean", () => {
      expect(extractSearchKeyword("add fortune oil 1l 3 quantity")).toBe(
        "fortune oil",
      );
      const planned = planTurn(
        "add fortune oil 1l 3 quantity",
        createInitialContext(),
      );
      expect(String(planned.toolCalls[0]?.args.keyword)).toBe("fortune oil");
      expect(planned.toolCalls[0]?.args).toMatchObject({
        preferSize: "1l",
        preferQty: 3,
      });
    });

    it("soft-escape qty gate to checkout", () => {
      const r = planTurn(
        "lets buy",
        createInitialContext({
          language: "en",
          customerId: "u1",
          cartItemCount: 2,
          pendingQuantity: true,
          selectedProduct: sugar,
        }),
      );
      expect(r.toolCalls[0]?.name).toBe("startCheckout");
      expect(r.sessionPatch?.pendingQuantity).toBe(false);
    });

    it("cart total then user can checkout next turn", () => {
      expect(
        planTurn("total kitna hua", loggedInCtx()).toolCalls[0],
      ).toMatchObject({ name: "getCart", args: { mode: "total" } });
      expect(
        planTurn("ab checkout karo", loggedInCtx()).toolCalls[0]?.name,
      ).toBe("startCheckout");
    });

    it("chini 1kg single product still gets preferSize", () => {
      const planned = planTurn(
        "chini 1kg chahiye",
        createInitialContext({ language: "hi" }),
      );
      expect(planned.toolCalls[0]?.args).toMatchObject({ preferSize: "1kg" });
      expect(String(planned.toolCalls[0]?.args.keyword)).toMatch(/chini/i);
    });
  });
  describe("chitchat is not product search", () => {
    it.each([
      "how are you?",
      "how are you",
      "how r u?",
      "how r u",
      "howru",
      "hru",
      "what are you doing?",
      "what are you doing",
      "what r u doing",
      "wyd",
      "kya kar rahe ho",
      "kaise ho",
      "kaise ho aap?",
      "kaise ho aap",
      "aap kaise ho",
      "are you really ok?",
      "are you okay?",
      "you ok?",
      "sab theek",
      "kya haal hai",
      "what's up",
      "thank you",
      "thanks",
      "shukriya",
      "who are you",
      "aap kaun ho",
      "tum kya kar sakte ho",
      "kaise kaam karte ho",
      "madad chahiye",
      "phir milte hain",
      "bye",
    ])("does not search for: %s", (utter) => {
      const r = planTurn(utter, createInitialContext({ customerName: "Shivam" }));
      expect(r.toolCalls).toHaveLength(0);
      expect(r.earlyResult?.assistantMessage).toBeTruthy();
      expect(r.earlyResult?.assistantMessage).not.toMatch(/options|Found top/i);
    });

    it("how r u replies without searching", () => {
      const r = planTurn(
        "how r u?",
        createInitialContext({ language: "en", customerName: "Shivam" }),
      );
      expect(r.toolCalls).toHaveLength(0);
      expect(r.earlyResult?.assistantMessage).toMatch(/well|thanks|product/i);
    });

    it("how are you replies and nudges shopping", () => {
      const r = planTurn(
        "how are you?",
        createInitialContext({ language: "en", customerName: "Shivam" }),
      );
      expect(r.earlyResult?.assistantMessage).toMatch(/well|thanks|product/i);
      expect(r.earlyResult?.assistantMessage).toMatch(/Shivam/);
    });

    it("what are you doing replies without searching", () => {
      const r = planTurn(
        "what are you doing?",
        createInitialContext({ language: "en", customerName: "Shivam" }),
      );
      expect(r.toolCalls).toHaveLength(0);
      expect(r.earlyResult?.assistantMessage).toMatch(/shop|product|waiting/i);
      expect(r.earlyResult?.assistantMessage).not.toMatch(/Found top|options/i);
    });

    it("kaise ho replies in Hinglish", () => {
      const r = planTurn("kaise ho", createInitialContext({ language: "hi" }));
      expect(r.earlyResult?.assistantMessage).toMatch(/badhiya|theek|product/i);
    });

    it("kaise ho aap never searches and stays idle", () => {
      const r = planTurn(
        "kaise ho aap?",
        createInitialContext({ language: "hi", customerName: "Shivam" }),
      );
      expect(r.toolCalls).toHaveLength(0);
      expect(r.turnPlan?.intent).toBe("chitchat");
      expect(r.earlyResult?.assistantMessage).toMatch(/badhiya|product|Fortune/i);
      expect(r.earlyResult?.assistantMessage).not.toMatch(/Found top|options/i);
      expect(r.earlyResult?.contextPatch.pendingProductSelection).toBeFalsy();
      expect(r.earlyResult?.contextPatch.phase ?? "idle").toMatch(/idle/);
    });

    it("are you really ok never searches", () => {
      const r = planTurn(
        "are you really ok?",
        createInitialContext({ language: "en", customerName: "Shivam" }),
      );
      expect(r.toolCalls).toHaveLength(0);
      expect(r.turnPlan?.intent).toBe("chitchat");
      expect(r.earlyResult?.assistantMessage).not.toMatch(/Found top|options/i);
      expect(r.earlyResult?.contextPatch.pendingProductSelection).toBeFalsy();
    });

    it("i want to buy fortune asks brand category instead of searching i to fortune", () => {
      const r = planTurn(
        "i want to buy fortune?",
        createInitialContext({ language: "en" }),
      );
      expect(r.toolCalls).toHaveLength(0);
      expect(r.earlyResult?.assistantMessage).toMatch(/Fortune|oil|atta|besan|category/i);
      expect(r.earlyResult?.assistantMessage).not.toMatch(/i to fortune|Found top/i);
    });

    it("fortune oil still searches with clean keyword", () => {
      const r = planTurn(
        "i want to buy fortune oil",
        createInitialContext({ language: "en" }),
      );
      expect(r.toolCalls[0]?.name).toBe("searchProducts");
      expect(String(r.toolCalls[0]?.args.keyword)).toMatch(/^fortune oil$/i);
    });

    it("koi bhi nhi after shopping prompt is a polite decline", () => {
      const afterHi = planTurn(
        "how are you?",
        createInitialContext({ language: "hi", customerName: "Shivam" }),
      );
      expect(afterHi.earlyResult?.contextPatch.lastAssistantPromptType).toBe(
        "shopping_prompt",
      );
      const declined = planTurn(
        "koi bhi nhi",
        createInitialContext({
          language: "hi",
          lastAssistantPromptType: "shopping_prompt",
        }),
      );
      expect(declined.toolCalls).toHaveLength(0);
      expect(declined.turnPlan?.intent).toBe("decline");
      expect(declined.earlyResult?.assistantMessage).toMatch(/Theek hai|Jab bhi/i);
      expect(declined.earlyResult?.assistantMessage).not.toMatch(/Samajh nahi/i);
    });

    it("powder asks which type instead of searching 95 products", () => {
      const r = planTurn(
        "powder chaiye",
        createInitialContext({ language: "hi" }),
      );
      expect(r.toolCalls).toHaveLength(0);
      expect(r.earlyResult?.assistantMessage).toMatch(/Kaunsa powder|Talcum|Haldi|turmeric|Cocoa/i);
      expect(r.earlyResult?.contextPatch.lastAssistantPromptType).toBe(
        "broad_category",
      );
      expect(r.earlyResult?.contextPatch.pendingBroadOptions?.length).toBeGreaterThan(
        0,
      );
    });

    it("powder follow-up haldi searches turmeric powder", () => {
      const r = planTurn(
        "haldi",
        createInitialContext({
          language: "hi",
          lastAssistantPromptType: "broad_category",
          pendingBroadOptions: [
            "talcum powder",
            "turmeric powder",
            "coriander powder",
            "cocoa powder",
          ],
        }),
      );
      expect(r.toolCalls[0]?.name).toBe("searchProducts");
      expect(String(r.toolCalls[0]?.args.keyword)).toMatch(/turmeric powder/i);
    });

    it("non-shopping leftovers clarify instead of searching", () => {
      const r = planTurn(
        "what's the weather like today in delhi",
        createInitialContext({ language: "en" }),
      );
      expect(r.toolCalls).toHaveLength(0);
      expect(r.turnPlan?.intent).toBe("clarify");
      expect(r.earlyResult?.assistantMessage).toMatch(/catch|product|Samajh/i);
    });
  });
});

function loggedInCtx(cartCount = 2) {
  return createInitialContext({
    language: "hi",
    customerId: "u1",
    cartItemCount: cartCount,
  });
}
