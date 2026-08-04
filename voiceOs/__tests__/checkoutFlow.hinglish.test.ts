import {
  buildResponseAfterTools,
  parseMultiProductKeywords,
  parseQuantity,
  parseSizeHint,
  planTurn,
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

const oil: SessionProduct = {
  _id: "oil1",
  name: "Patanjali Kachi Ghani Mustard Oil",
  size: "1 L",
  price: 215,
  discountedPrice: 215,
  isOutOfStock: false,
  maxQuantity: 5,
  image: null,
};

function loggedIn(cartCount = 2) {
  return createInitialContext({
    language: "hi",
    customerId: "user_1",
    customerName: "Shivam",
    cartItemCount: cartCount,
  });
}

describe("Shop Assist → checkout (Hinglish + English)", () => {
  describe("complex search / buy intents", () => {
    const searchCases: Array<{ utter: string; expectKw: RegExp }> = [
      { utter: "bhai thoda sa sarso ka tel mil jayega kya", expectKw: /sarso|tel/i },
      { utter: "mujhe fortune mustard oil chahiye please", expectKw: /fortune|mustard|oil/i },
      { utter: "hi, I need some sugar packets", expectKw: /sugar/i },
      { utter: "yaar doodh aur bread dono chahiye", expectKw: /doodh|milk|bread/i },
      { utter: "can you find atta for me", expectKw: /atta/i },
      { utter: "bas ek kilo chini dilwa do", expectKw: /chini|sugar/i },
      { utter: "search for toor dal", expectKw: /toor|dal/i },
    ];

    it.each(searchCases)("plans search for: $utter", ({ utter, expectKw }) => {
      const planned = planTurn(utter, createInitialContext({ language: "hi" }));
      // either immediate search or multi-confirm
      if (planned.toolCalls[0]?.name === "searchProducts") {
        expect(String(planned.toolCalls[0].args.keyword)).toMatch(expectKw);
      } else {
        expect(
          planned.earlyResult?.contextPatch.pendingMultiProductConfirm ||
            planned.toolCalls.length > 0,
        ).toBeTruthy();
      }
    });

    it("one-shot Hinglish add with size", () => {
      const utter = "patanjali sarso tel 1 litre cart me add krdo";
      expect(wantsAddToCart(utter)).toBe(true);
      expect(parseSizeHint(utter)).toMatch(/1l/i);
      const planned = planTurn(utter, loggedIn());
      expect(planned.toolCalls[0]?.name).toBe("searchProducts");
      expect(planned.toolCalls[0]?.args).toMatchObject({
        intent: "add",
        preferSize: "1l",
      });
    });

    it("English one-shot add", () => {
      const utter = "add 1L mustard oil to cart";
      const planned = planTurn(utter, loggedIn());
      expect(planned.toolCalls[0]?.name).toBe("searchProducts");
      expect(planned.toolCalls[0]?.args.intent).toBe("add");
    });
  });

  describe("select → qty → confirm → added", () => {
    it("Hinglish path through quantity words", () => {
      const selecting = createInitialContext({
        language: "hi",
        customerId: "user_1",
        pendingProductSelection: true,
        lastSearchProducts: [sugar, oil],
        lastSearchQuery: "sugar",
      });

      const pick = planTurn("pehla", selecting);
      expect(pick.earlyResult?.contextPatch.pendingQuantity).toBe(true);
      expect(pick.earlyResult?.contextPatch.selectedProduct?._id).toBe("sugar1");

      const qtyCtx = createInitialContext({
        ...selecting,
        pendingProductSelection: false,
        pendingQuantity: true,
        selectedProduct: sugar,
      });
      expect(parseQuantity("do")).toBe(2);
      const qty = planTurn("do", qtyCtx);
      expect(qty.earlyResult?.contextPatch.pendingConfirmation?.toolName).toBe(
        "addToCart",
      );
      expect(qty.earlyResult?.contextPatch.pendingConfirmation?.toolArgs).toMatchObject({
        productId: "sugar1",
        quantity: 2,
      });

      const confirmCtx = createInitialContext({
        language: "hi",
        customerId: "user_1",
        pendingConfirmation: {
          title: "Cart mein add karein?",
          summary: { Product: sugar.name, Quantity: "2" },
          toolName: "addToCart",
          toolArgs: { productId: "sugar1", quantity: 2, name: sugar.name },
        },
      });
      expect(planTurn("haan bilkul", confirmCtx).toolCalls[0]?.name).toBe(
        "addToCart",
      );
      expect(planTurn("yes please", confirmCtx).toolCalls[0]?.name).toBe(
        "addToCart",
      );
    });

    it("buildResponse after add shows success then allows checkout", () => {
      const afterAdd = buildResponseAfterTools({
        userText: "haan",
        context: loggedIn(1),
        toolCalls: [
          {
            id: "a1",
            name: "addToCart",
            args: { productId: "sugar1", quantity: 2 },
          },
        ],
        toolResults: [
          {
            ok: true,
            toolName: "addToCart",
            data: {
              name: sugar.name,
              quantity: 2,
              lineQuantity: 2,
              cartItemCount: 3,
              cartItems: [
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
      expect(afterAdd.assistantMessage).toMatch(/cart mein add|Added/i);
      expect(afterAdd.contextPatch.cartItemCount).toBe(3);
      expect(afterAdd.contextPatch.pendingConfirmation).toBeNull();

      const checkout = planTurn(
        "ab checkout kar do",
        createInitialContext({
          language: "hi",
          customerId: "user_1",
          cartItemCount: 3,
        }),
      );
      expect(checkout.toolCalls[0]?.name).toBe("startCheckout");
    });
  });

  describe("cart phrases (list vs page vs total)", () => {
    const listUtters = [
      "cart me kya kya hai",
      "abhi mera cart dikhao",
      "show my cart items",
      "what is in the basket",
      "cart batao na",
    ];
    const pageUtters = [
      "cart page open karo",
      "open cart page",
      "go to cart",
      "cart screen kholo",
    ];
    const totalUtters = [
      "total kitna hua",
      "bill amount kya hai",
      "cart total kitn hai",
      "what's my cart total",
    ];

    it.each(listUtters)("lists cart inline: %s", (utter) => {
      expect(planTurn(utter, loggedIn()).toolCalls[0]).toMatchObject({
        name: "getCart",
        args: { mode: "list" },
      });
    });

    it.each(pageUtters)("opens cart page: %s", (utter) => {
      expect(planTurn(utter, loggedIn()).toolCalls[0]).toMatchObject({
        name: "openUi",
        args: { action: "OPEN_CART" },
      });
    });

    it.each(totalUtters)("asks cart total: %s", (utter) => {
      expect(planTurn(utter, loggedIn()).toolCalls[0]).toMatchObject({
        name: "getCart",
        args: { mode: "total" },
      });
    });
  });

  describe("checkout intents (many phrasings)", () => {
    const checkoutYes = [
      "checkout karo",
      "checkout please",
      "lets buy",
      "let's buy now",
      "aage badhna hai",
      "aage badho",
      "place order",
      "order place karo",
      "order kar do",
      "payment karo",
      "pay now",
      "mujhe yeh buy karna hai",
      "bas yahi lena hai",
      "go ahead",
      "complete order",
      "I want to checkout",
      "proceed to payment",
      "bill bharo",
      "final karo",
    ];

    const checkoutNo = [
      "chini buy karna hai",
      "sarso ka tel chahiye",
      "add oil to cart",
      "cart dikhao",
      "hello",
    ];

    it.each(checkoutYes)("wantsCheckout: %s", (utter) => {
      expect(wantsCheckout(utter)).toBe(true);
      const planned = planTurn(utter, loggedIn(2));
      expect(planned.toolCalls[0]?.name).toBe("startCheckout");
    });

    it.each(checkoutNo)("does NOT checkout: %s", (utter) => {
      expect(wantsCheckout(utter)).toBe(false);
    });

    it("checkout without login opens login", () => {
      const planned = planTurn(
        "lets buy",
        createInitialContext({ cartItemCount: 2, customerId: null }),
      );
      expect(planned.toolCalls[0]).toMatchObject({
        name: "openUi",
        args: { action: "OPEN_LOGIN" },
      });
    });

    it("stale empty cartItemCount still plans startCheckout (fresh fetch inside)", () => {
      expect(
        planTurn("checkout karo", loggedIn(0)).toolCalls[0]?.name,
      ).toBe("startCheckout");
    });
  });

  describe("startCheckout tool responses", () => {
    it("proceed → OPEN_PAYMENT with payable total (Hinglish)", () => {
      const result = buildResponseAfterTools({
        userText: "checkout karo",
        context: loggedIn(3),
        toolCalls: [{ id: "c1", name: "startCheckout", args: {} }],
        toolResults: [
          {
            ok: true,
            toolName: "startCheckout",
            data: {
              status: "proceed",
              payableTotal: 865,
              orderDiscount: 0,
              message: "ok",
            },
          },
        ],
      });
      expect(result.uiAction).toEqual({ action: "OPEN_PAYMENT" });
      expect(result.assistantMessage).toMatch(/865|Payable|address/i);
      expect(result.contextPatch.paymentPending).toBe(true);
    });

    it("English proceed message", () => {
      const result = buildResponseAfterTools({
        userText: "place order",
        context: createInitialContext({
          language: "en",
          customerId: "u1",
          cartItemCount: 2,
        }),
        toolCalls: [{ id: "c1", name: "startCheckout", args: {} }],
        toolResults: [
          {
            ok: true,
            toolName: "startCheckout",
            data: { status: "proceed", payableTotal: 400, orderDiscount: 0 },
          },
        ],
      });
      expect(result.uiAction?.action).toBe("OPEN_PAYMENT");
      expect(result.assistantMessage).toMatch(/Pick address|payment/i);
    });

    it("abort with cart drift shows inline cart (no OPEN_CART)", () => {
      const result = buildResponseAfterTools({
        userText: "aage badho",
        context: loggedIn(2),
        toolCalls: [{ id: "c1", name: "startCheckout", args: {} }],
        toolResults: [
          {
            ok: true,
            toolName: "startCheckout",
            data: {
              status: "abort",
              reason: "cart_drift",
              message:
                "Product details or offers changed. Please review before checkout.",
              cartUpdated: true,
              cartItemCount: 2,
              cartItems: [
                {
                  productId: "sugar1",
                  name: sugar.name,
                  quantity: 1,
                  unitPrice: 59,
                  lineTotal: 59,
                },
                {
                  productId: "oil1",
                  name: oil.name,
                  quantity: 1,
                  unitPrice: 215,
                  lineTotal: 215,
                },
              ],
            },
          },
        ],
      });
      expect(result.uiAction).toBeNull();
      expect(result.assistantMessage).toMatch(/Updated cart/i);
      expect(result.assistantMessage).toMatch(/Independence Crystal Sugar/);
      expect(result.assistantMessage).toMatch(/checkout/i);
      expect(result.contextPatch.paymentPending).toBe(false);
    });

    it("blocked empty cart after fresh sync", () => {
      const result = buildResponseAfterTools({
        userText: "lets buy",
        context: loggedIn(0),
        toolCalls: [{ id: "c1", name: "startCheckout", args: {} }],
        toolResults: [
          {
            ok: true,
            toolName: "startCheckout",
            data: {
              status: "blocked",
              reason: "empty_cart",
              message: "Cart khali hai — pehle kuch add karo.",
            },
          },
        ],
      });
      expect(result.uiAction).toBeNull();
      expect(result.assistantMessage).toMatch(/khali|empty|add/i);
    });

    it("blocked login", () => {
      const result = buildResponseAfterTools({
        userText: "checkout",
        context: createInitialContext({ language: "hi", cartItemCount: 1 }),
        toolCalls: [{ id: "c1", name: "startCheckout", args: {} }],
        toolResults: [
          {
            ok: true,
            toolName: "startCheckout",
            data: {
              status: "blocked",
              reason: "login",
              message: "Checkout ke liye login zaroori hai.",
            },
          },
        ],
      });
      expect(result.uiAction).toEqual({ action: "OPEN_LOGIN" });
    });

    it("store closed abort", () => {
      const result = buildResponseAfterTools({
        userText: "place order",
        context: loggedIn(2),
        toolCalls: [{ id: "c1", name: "startCheckout", args: {} }],
        toolResults: [
          {
            ok: true,
            toolName: "startCheckout",
            data: {
              status: "abort",
              reason: "store_closed",
              message: "Store is currently closed.",
              cartUpdated: false,
            },
          },
        ],
      });
      expect(result.assistantMessage).toMatch(/closed|ruk/i);
      expect(result.uiAction).toBeNull();
    });
  });

  describe("end-to-end style sequences", () => {
    it("English: search → pick 1 → qty 1 → yes → checkout", () => {
      const search = planTurn("I need sugar", createInitialContext());
      expect(search.toolCalls[0]?.name).toBe("searchProducts");

      const afterSearch = buildResponseAfterTools({
        userText: "I need sugar",
        context: createInitialContext({ language: "en" }),
        toolCalls: search.toolCalls,
        toolResults: [
          {
            ok: true,
            toolName: "searchProducts",
            data: {
              keyword: "sugar",
              count: 1,
              products: [sugar],
            },
          },
        ],
      });
      expect(afterSearch.contextPatch.pendingProductSelection).toBe(true);

      const pick = planTurn(
        "1",
        createInitialContext({
          language: "en",
          customerId: "u1",
          pendingProductSelection: true,
          lastSearchProducts: [sugar],
        }),
      );
      expect(pick.earlyResult?.contextPatch.pendingQuantity).toBe(true);

      const qty = planTurn(
        "1",
        createInitialContext({
          language: "en",
          customerId: "u1",
          pendingQuantity: true,
          selectedProduct: sugar,
        }),
      );
      expect(qty.earlyResult?.contextPatch.pendingConfirmation?.toolArgs).toMatchObject({
        quantity: 1,
      });

      const yes = planTurn(
        "yes",
        createInitialContext({
          customerId: "u1",
          pendingConfirmation: {
            title: "Add?",
            summary: {},
            toolName: "addToCart",
            toolArgs: { productId: "sugar1", quantity: 1 },
          },
        }),
      );
      expect(yes.toolCalls[0]?.name).toBe("addToCart");

      const checkout = planTurn("proceed to checkout", loggedIn(1));
      expect(checkout.toolCalls[0]?.name).toBe("startCheckout");
    });

    it("Hinglish multi-buy confirm → search queue → later checkout", () => {
      const multi = planTurn(
        "mujhko chini aur sarso ka tel dono chahiye",
        createInitialContext({ language: "hi" }),
      );
      // explicit aur → no confirm needed
      if (multi.toolCalls[0]?.name === "searchProducts") {
        expect(multi.toolCalls[0].args.searchQueue).toEqual(
          expect.arrayContaining([expect.stringMatching(/sarso|tel/i)]),
        );
      } else {
        // if parsed as space list somehow
        expect(multi.earlyResult?.contextPatch.pendingMultiProductConfirm).toBeTruthy();
      }

      const parts = parseMultiProductKeywords(
        "mujhko chini aur sarso ka tel dono chahiye",
      );
      expect(parts.length).toBeGreaterThanOrEqual(2);

      expect(
        planTurn("ab order place karo", loggedIn(4)).toolCalls[0]?.name,
      ).toBe("startCheckout");
    });

    it("soft-escape confirm then checkout in English", () => {
      const escaped = planTurn(
        "actually checkout instead",
        createInitialContext({
          language: "en",
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
      // "checkout" inside should soft-escape
      expect(escaped.sessionPatch?.pendingConfirmation).toBeNull();
      expect(escaped.toolCalls[0]?.name).toBe("startCheckout");
      expect(escaped.notePrefix).toMatch(/cancel/i);
    });

    it("clear cart confirm is not checkout", () => {
      const planned = planTurn("cart khali kar do", loggedIn(3));
      expect(planned.earlyResult?.contextPatch.pendingConfirmation?.toolName).toBe(
        "clearCart",
      );
      expect(wantsCheckout("cart khali kar do")).toBe(false);
    });

    it("soft-escape from quantity to checkout", () => {
      const r = planTurn(
        "aage badho",
        createInitialContext({
          language: "hi",
          customerId: "user_1",
          cartItemCount: 2,
          pendingQuantity: true,
          selectedProduct: sugar,
        }),
      );
      expect(r.sessionPatch?.pendingQuantity).toBe(false);
      expect(r.toolCalls[0]?.name).toBe("startCheckout");
    });

    it("cart total then checkout in sequence", () => {
      expect(planTurn("bill amount kya hai", loggedIn(3)).toolCalls[0]).toMatchObject({
        name: "getCart",
        args: { mode: "total" },
      });
      expect(planTurn("place order", loggedIn(3)).toolCalls[0]?.name).toBe(
        "startCheckout",
      );
    });

    it("English variant disambiguation then checkout intent", () => {
      const afterSearch = buildResponseAfterTools({
        userText: "fortune oil",
        context: createInitialContext({ language: "en", customerId: "u1" }),
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
              products: [oil, sugar],
            },
          },
        ],
      });
      // sugar isn't oil — use two oils for variant hint
      expect(afterSearch.contextPatch.pendingProductSelection).toBe(true);

      expect(
        planTurn("I want to checkout", loggedIn(2)).toolCalls[0]?.name,
      ).toBe("startCheckout");
    });
  });
});
