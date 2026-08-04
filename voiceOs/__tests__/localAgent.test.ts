import {
  buildResponseAfterTools,
  extractSearchKeyword,
  parseAddQuantity,
  parseMultiProductKeywords,
  parseProductIndices,
  parseQuantity,
  parseSizeHint,
  planTurn,
  wantsAddToCart,
  wantsCheckout,
} from "@/voiceOs/agent/localAgent";
import { createInitialContext } from "@/voiceOs/types";

describe("voiceOs localAgent", () => {
  it("extracts product keywords from Hindi/English phrases", () => {
    expect(extractSearchKeyword("Fortune mustard oil add kar do")).toMatch(
      /fortune mustard oil/i,
    );
    expect(extractSearchKeyword("mujhko chawal kharedne hai")).toBe("chawal");
    expect(extractSearchKeyword('search "sugar"')).toBe("sugar");
    expect(extractSearchKeyword("namaste")).toBeNull();
  });

  it("splits multi-product buy phrases", () => {
    const parts = parseMultiProductKeywords(
      "mujhe chini and sarso ka tel khareedna hai",
    );
    expect(parts.length).toBe(2);
    expect(parts[0]).toMatch(/chini/i);
    expect(parts[1]).toMatch(/sarso/i);
    expect(parts[1]).toMatch(/tel/i);
  });

  it("splits space-separated groceries without and/aur", () => {
    const parts = parseMultiProductKeywords("mujhko dal chawal sugar chaiye");
    expect(parts).toEqual(["dal", "chawal", "sugar"]);
    const planned = planTurn(
      "mujhko dal chawal sugar chaiye",
      createInitialContext(),
    );
    // Ambiguous without and/aur → confirm first
    expect(planned.toolCalls).toHaveLength(0);
    expect(
      planned.earlyResult?.contextPatch.pendingMultiProductConfirm?.products,
    ).toEqual(["dal", "chawal", "sugar"]);
    expect(planned.earlyResult?.assistantMessage).toMatch(/Haan/i);

    const confirmed = planTurn(
      "haan",
      createInitialContext({
        pendingMultiProductConfirm: {
          products: ["dal", "chawal", "sugar"],
          fullPhrase: "dal chawal sugar",
        },
      }),
    );
    expect(confirmed.toolCalls[0]?.name).toBe("searchProducts");
    expect(String(confirmed.toolCalls[0]?.args.keyword)).toMatch(/^dal$/i);
    expect(confirmed.toolCalls[0]?.args.searchQueue).toEqual([
      "chawal",
      "sugar",
    ]);
  });

  it("asks confirm for sacha moti dal chawal with brand attached", () => {
    const parts = parseMultiProductKeywords("sacha moti dal chawal chaiye");
    expect(parts[0]).toMatch(/sacha moti dal/i);
    expect(parts[1]).toMatch(/^chawal$/i);
    const planned = planTurn(
      "sacha moti dal chawal chaiye",
      createInitialContext({ language: "hi" }),
    );
    expect(
      planned.earlyResult?.contextPatch.pendingMultiProductConfirm?.products,
    ).toEqual(["sacha moti dal", "chawal"]);

    const asOne = planTurn(
      "nahi",
      createInitialContext({
        pendingMultiProductConfirm: {
          products: ["sacha moti dal", "chawal"],
          fullPhrase: "sacha moti dal chawal",
        },
      }),
    );
    expect(asOne.toolCalls[0]?.args.keyword).toMatch(/sacha moti dal chawal/i);
    expect(asOne.toolCalls[0]?.args.searchQueue).toBeUndefined();
  });

  it("keeps sarso ka tel as one product", () => {
    expect(parseMultiProductKeywords("sarso ka tel")).toEqual([
      expect.stringMatching(/sarso.*tel|tel/i),
    ]);
    const one = parseMultiProductKeywords("mujhko sarso ka tel chaiye");
    expect(one.length).toBe(1);
  });

  it("does not split hide and seek biscuit", () => {
    const parts = parseMultiProductKeywords("hide and seek biscuit");
    expect(parts.length).toBe(1);
    expect(parts[0]).toMatch(/hide/i);
    expect(parts[0]).toMatch(/seek/i);
    expect(parts[0]).toMatch(/biscuit/i);
  });

  it("plans first product search and queues the rest", () => {
    const planned = planTurn(
      "mujhe chini and sarso ka tel khareedna hai",
      createInitialContext(),
    );
    expect(planned.toolCalls[0]?.name).toBe("searchProducts");
    expect(String(planned.toolCalls[0]?.args.keyword)).toMatch(/chini/i);
    expect(planned.toolCalls[0]?.args.searchQueue).toEqual(
      expect.arrayContaining([expect.stringMatching(/sarso/i)]),
    );
  });

  it("mentions queue when search returns options", () => {
    const result = buildResponseAfterTools({
      userText: "chini and sarso tel",
      context: createInitialContext({ language: "hi" }),
      toolCalls: [
        {
          id: "t1",
          name: "searchProducts",
          args: { keyword: "chini", searchQueue: ["sarso tel"] },
        },
      ],
      toolResults: [
        {
          ok: true,
          toolName: "searchProducts",
          data: {
            keyword: "chini",
            count: 1,
            products: [
              {
                _id: "s1",
                name: "Loose Sugar",
                size: "1 Kg",
                price: 50,
              },
            ],
          },
        },
      ],
    });
    expect(result.assistantMessage).toMatch(/Pehle/i);
    expect(result.assistantMessage).toMatch(/sarso/i);
    expect(result.contextPatch.pendingSearchQueue).toEqual(["sarso tel"]);
  });

  it("parses multi product indices like 5 and 7", () => {
    expect(parseProductIndices("5 and 7", 8)).toEqual([4, 6]);
    expect(parseProductIndices("5 aur 7", 8)).toEqual([4, 6]);
    expect(parseProductIndices("5,7", 8)).toEqual([4, 6]);
    expect(parseProductIndices("fortune oil 5kg", 8)).toEqual([]);
  });

  it("plans searchProducts tool for product queries", () => {
    const planned = planTurn("Fortune oil", createInitialContext());
    expect(planned.toolCalls).toHaveLength(1);
    expect(planned.toolCalls[0].name).toBe("searchProducts");
    expect(planned.toolCalls[0].args.keyword).toMatch(/fortune oil/i);
  });

  it("one-shot add searches instead of listing cart", () => {
    const utterance = "sarso ka tel 1l add krdo cart me";
    expect(wantsAddToCart(utterance)).toBe(true);
    expect(parseSizeHint(utterance)).toBe("1l");
    const planned = planTurn(utterance, createInitialContext());
    expect(planned.toolCalls[0]?.name).toBe("searchProducts");
    expect(planned.toolCalls[0]?.args).toMatchObject({
      intent: "add",
      preferSize: "1l",
      preferQty: 1,
    });
    expect(String(planned.toolCalls[0]?.args.keyword)).toMatch(/sarso|tel/i);
  });

  it("strips size + quantity from keyword (not 'fortune oil 3 quantity')", () => {
    const utterance = "add fortune oil 1l 3 quantity";
    expect(extractSearchKeyword(utterance)).toMatch(/^fortune oil$/i);
    expect(parseSizeHint(utterance)).toBe("1l");
    expect(parseAddQuantity(utterance)).toBe(3);
    const planned = planTurn(utterance, createInitialContext());
    expect(planned.toolCalls[0]?.args).toMatchObject({
      intent: "add",
      preferSize: "1l",
      preferQty: 3,
    });
    expect(String(planned.toolCalls[0]?.args.keyword)).toBe("fortune oil");
    expect(String(planned.toolCalls[0]?.args.keyword)).not.toMatch(
      /quantity|\b3\b|1l/i,
    );
  });

  it("parses size + bare qty without the word quantity", () => {
    expect(extractSearchKeyword("add fortune oil 1l 3")).toMatch(/^fortune oil$/i);
    expect(parseAddQuantity("add fortune oil 1l 3")).toBe(3);
    expect(
      planTurn("fortune mustard oil 1 litre qty 2 add karo", createInitialContext())
        .toolCalls[0]?.args,
    ).toMatchObject({ preferSize: "1l", preferQty: 2 });
  });

  it("one-shot add confirms when a single size match is found", () => {
    const product = {
      _id: "oil1",
      name: "Patanjali Kachi Ghani Mustard Oil",
      size: "1 L",
      price: 215,
      discountedPrice: 215,
      image: null,
      isOutOfStock: false,
      maxQuantity: 5,
    };
    const toolCalls = [
      {
        id: "t1",
        name: "searchProducts" as const,
        args: {
          keyword: "sarso tel",
          intent: "add",
          preferSize: "1l",
          preferQty: 1,
        },
      },
    ];
    const result = buildResponseAfterTools({
      userText: "sarso ka tel 1l add krdo cart me",
      context: createInitialContext({ language: "hi" }),
      toolCalls,
      toolResults: [
        {
          ok: true,
          toolName: "searchProducts",
          data: {
            keyword: "mustard oil",
            count: 2,
            totalResults: 2,
            hasMore: false,
            products: [
              product,
              {
                ...product,
                _id: "oil5",
                name: "Fortune Mustard Oil",
                size: "5 L",
              },
            ],
          },
        },
      ],
    });
    expect(result.contextPatch.pendingConfirmation?.toolName).toBe("addToCart");
    expect(result.contextPatch.pendingConfirmation?.toolArgs).toMatchObject({
      productId: "oil1",
      quantity: 1,
    });
    expect(result.assistantMessage).toMatch(/Confirm/i);
  });

  it("does not auto-pick one Fortune oil when many results exist", () => {
    const groundnut = {
      _id: "f1",
      name: "Fortune Gold Nut Refined Groundnut Oil",
      size: "1 L",
      price: 205,
      discountedPrice: 205,
      image: null,
      isOutOfStock: false,
      maxQuantity: 5,
    };
    const mustard = {
      ...groundnut,
      _id: "f2",
      name: "Fortune Kachi Ghani Mustard Oil",
      size: "1 L",
      price: 190,
    };
    const result = buildResponseAfterTools({
      userText: "add fortune oil 1l 3 quantity",
      context: createInitialContext({ language: "hi" }),
      toolCalls: [
        {
          id: "t1",
          name: "searchProducts" as const,
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
            products: [groundnut, mustard],
          },
        },
      ],
    });
    expect(result.contextPatch.pendingConfirmation).toBeFalsy();
    expect(result.contextPatch.pendingProductSelection).toBe(true);
    expect(result.contextPatch.pendingAddQuantity).toBe(3);
    expect(result.assistantMessage).toMatch(/Kaunsa|Which/i);
    expect(result.products?.length).toBe(2);
  });

  it("asks which oil when only one 1L match is on a partial page", () => {
    const groundnut = {
      _id: "f1",
      name: "Fortune Gold Nut Refined Groundnut Oil",
      size: "1 L",
      price: 205,
      discountedPrice: 205,
      image: null,
      isOutOfStock: false,
      maxQuantity: 5,
    };
    const otherSize = {
      ...groundnut,
      _id: "f5",
      name: "Fortune Sunflower Oil",
      size: "5 L",
    };
    const result = buildResponseAfterTools({
      userText: "add fortune oil 1l 3 quantity",
      context: createInitialContext({ language: "en" }),
      toolCalls: [
        {
          id: "t1",
          name: "searchProducts" as const,
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
            products: [groundnut, otherSize],
          },
        },
      ],
    });
    expect(result.contextPatch.pendingConfirmation).toBeFalsy();
    expect(result.contextPatch.pendingProductSelection).toBe(true);
    expect(result.contextPatch.pendingAddQuantity).toBe(3);
    expect(result.assistantMessage).toMatch(/Which|Kaunsa/i);
  });

  it("blocks one-shot add confirm when the only match is out of stock", () => {
    const result = buildResponseAfterTools({
      userText: "sarso ka tel 1l add krdo",
      context: createInitialContext({ language: "hi" }),
      toolCalls: [
        {
          id: "t1",
          name: "searchProducts",
          args: {
            keyword: "mustard oil",
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
            keyword: "mustard oil",
            resolvedKeyword: "mustard oil",
            count: 1,
            totalResults: 1,
            products: [
              {
                _id: "oos1",
                name: "Patanjali Mustard Oil",
                size: "1 L",
                price: 215,
                isOutOfStock: true,
              },
            ],
          },
        },
      ],
    });
    expect(result.contextPatch.pendingConfirmation).toBeFalsy();
    expect(result.assistantMessage).toMatch(/out of stock/i);
  });

  it("lists cart vs opens cart vs total", () => {
    expect(
      planTurn("abhi cart me kya kya hai", createInitialContext()).toolCalls[0],
    ).toMatchObject({ name: "getCart", args: { mode: "list" } });
    expect(
      planTurn("cart dikhao", createInitialContext()).toolCalls[0],
    ).toMatchObject({ name: "getCart", args: { mode: "list" } });
    expect(
      planTurn("show cart", createInitialContext()).toolCalls[0],
    ).toMatchObject({ name: "getCart", args: { mode: "list" } });
    expect(
      planTurn("total amount kitn ahua?", createInitialContext()).toolCalls[0],
    ).toMatchObject({ name: "getCart", args: { mode: "total" } });
    expect(
      planTurn("cart page open karo", createInitialContext()).toolCalls[0],
    ).toMatchObject({
      name: "openUi",
      args: { action: "OPEN_CART" },
    });
    expect(
      planTurn("open cart page", createInitialContext()).toolCalls[0],
    ).toMatchObject({
      name: "openUi",
      args: { action: "OPEN_CART" },
    });
  });

  it("accepts haa as confirm", () => {
    const context = createInitialContext({
      pendingConfirmation: {
        title: "Add?",
        summary: {},
        toolName: "addToCart",
        toolArgs: { productId: "b", quantity: 2 },
      },
    });
    expect(planTurn("haa", context).toolCalls[0]?.name).toBe("addToCart");
  });

  it("soft-escapes confirm trap on new product search", () => {
    const context = createInitialContext({
      language: "hi",
      pendingConfirmation: {
        title: "Add?",
        summary: {},
        toolName: "addToCart",
        toolArgs: { productId: "b", quantity: 1 },
      },
      pendingSearchQueue: ["chawal"],
    });
    const trapped = planTurn("hmm", context);
    expect(trapped.toolCalls).toHaveLength(0);
    expect(trapped.earlyResult?.assistantMessage).toMatch(/Haan|Nahi|Yes|No/i);

    const escaped = planTurn("fortune oil", context);
    expect(escaped.sessionPatch?.pendingConfirmation).toBeNull();
    expect(escaped.toolCalls[0]?.name).toBe("searchProducts");
    expect(String(escaped.toolCalls[0]?.args.keyword)).toMatch(/fortune oil/i);
    expect(escaped.notePrefix).toMatch(/cancel/i);
  });

  it("soft-escapes confirm trap to cart list", () => {
    const escaped = planTurn(
      "cart dikhao",
      createInitialContext({
        pendingConfirmation: {
          title: "Add?",
          summary: {},
          toolName: "addToCart",
          toolArgs: { productId: "b", quantity: 1 },
        },
      }),
    );
    expect(escaped.toolCalls[0]).toMatchObject({
      name: "getCart",
      args: { mode: "list" },
    });
    expect(escaped.sessionPatch?.pendingConfirmation).toBeNull();
  });

  it("parses hindi quantity words", () => {
    expect(parseQuantity("do")).toBe(2);
    expect(parseQuantity("3")).toBe(3);
    expect(parseQuantity("paanch")).toBe(5);
  });

  it("offers more results when total exceeds shown list", () => {
    const result = buildResponseAfterTools({
      userText: "oil",
      context: createInitialContext({ language: "hi" }),
      toolCalls: [
        { id: "t1", name: "searchProducts", args: { keyword: "oil" } },
      ],
      toolResults: [
        {
          ok: true,
          toolName: "searchProducts",
          data: {
            keyword: "oil",
            resolvedKeyword: "oil",
            count: 2,
            totalResults: 78,
            hasMore: true,
            products: [
              { _id: "1", name: "Fortune Oil", size: "1 L", price: 100 },
              { _id: "2", name: "Saffola Oil", size: "1 L", price: 120 },
            ],
          },
        },
      ],
    });
    expect(result.uiAction).toMatchObject({
      action: "OPEN_SEARCH_RESULTS",
      query: "oil",
    });
    expect(result.assistantMessage).toMatch(/78/);
    expect(result.assistantMessage).toMatch(/aur dikhao/i);
  });

  it("opens full results on aur dikhao", () => {
    const planned = planTurn(
      "aur dikhao",
      createInitialContext({ lastSearchQuery: "oil" }),
    );
    expect(planned.toolCalls[0]).toMatchObject({
      name: "openUi",
      args: { action: "OPEN_SEARCH_RESULTS", query: "oil" },
    });
  });

  it("recognizes checkout / proceed phrases", () => {
    expect(wantsCheckout("checkout karo")).toBe(true);
    expect(wantsCheckout("aage badhna hai")).toBe(true);
    expect(wantsCheckout("mujhe yeh buy karna hai")).toBe(true);
    expect(wantsCheckout("place order")).toBe(true);
    expect(wantsCheckout("lets buy")).toBe(true);
    expect(wantsCheckout("let's buy")).toBe(true);
    expect(wantsCheckout("buy now")).toBe(true);
    expect(wantsCheckout("chini buy karna hai")).toBe(false);
    expect(wantsCheckout("sarso ka tel")).toBe(false);

    const planned = planTurn(
      "checkout karo",
      createInitialContext({ customerId: "u1", cartItemCount: 2 }),
    );
    expect(planned.toolCalls[0]?.name).toBe("startCheckout");

    expect(
      planTurn("lets buy", createInitialContext({ customerId: "u1", cartItemCount: 2 }))
        .toolCalls[0]?.name,
    ).toBe("startCheckout");

    // Stale cartItemCount=0 still plans startCheckout — tool refreshes cart
    expect(
      planTurn(
        "aage badho",
        createInitialContext({ customerId: "u1", cartItemCount: 0 }),
      ).toolCalls[0]?.name,
    ).toBe("startCheckout");
  });

  it("empty search with queue signals auto-continue", () => {
    const result = buildResponseAfterTools({
      userText: "dal",
      context: createInitialContext({ language: "hi" }),
      toolCalls: [
        {
          id: "t1",
          name: "searchProducts",
          args: { keyword: "dal", searchQueue: ["chawal"] },
        },
      ],
      toolResults: [
        {
          ok: true,
          toolName: "searchProducts",
          data: {
            keyword: "dal",
            resolvedKeyword: "dal",
            count: 0,
            totalResults: 0,
            products: [],
          },
        },
      ],
    });
    expect(result.contextPatch.pendingTool).toBe("continueSearchQueue");
    expect(result.contextPatch.pendingSearchQueue).toEqual(["chawal"]);
    expect(result.assistantMessage).toMatch(/Next try|Trying next/i);
  });

  it("lists in-stock products before out-of-stock", () => {
    const result = buildResponseAfterTools({
      userText: "oil",
      context: createInitialContext({ language: "hi" }),
      toolCalls: [{ id: "t1", name: "searchProducts", args: { keyword: "oil" } }],
      toolResults: [
        {
          ok: true,
          toolName: "searchProducts",
          data: {
            keyword: "oil",
            count: 2,
            products: [
              {
                _id: "oos",
                name: "Old Oil",
                size: "1 L",
                isOutOfStock: true,
                price: 10,
              },
              {
                _id: "ok",
                name: "Fresh Oil",
                size: "1 L",
                isOutOfStock: false,
                price: 20,
              },
            ],
          },
        },
      ],
    });
    expect(result.products?.[0]?._id).toBe("ok");
    expect(result.products?.[1]?._id).toBe("oos");
  });

  it("shows updated cart inline on checkout abort (no cart screen)", () => {
    const result = buildResponseAfterTools({
      userText: "checkout karo",
      context: createInitialContext({ language: "hi", cartItemCount: 1 }),
      toolCalls: [{ id: "c1", name: "startCheckout", args: {} }],
      toolResults: [
        {
          ok: true,
          toolName: "startCheckout",
          data: {
            status: "abort",
            reason: "cart_drift",
            message: "Product details or offers changed. Please review before checkout.",
            cartUpdated: true,
            cartItemCount: 1,
            cartItems: [
              {
                productId: "p1",
                name: "Loose Sugar",
                quantity: 2,
                unitPrice: 51,
                lineTotal: 102,
              },
            ],
          },
        },
      ],
    });
    expect(result.uiAction).toBeNull();
    expect(result.assistantMessage).toMatch(/Updated cart/i);
    expect(result.assistantMessage).toMatch(/Loose Sugar/);
    expect(result.contextPatch.cartItems?.[0]?.name).toBe("Loose Sugar");
  });
});
