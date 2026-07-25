import { Colors } from "@/constants/Colors";

const RAZORPAY_SCRIPT_SRC = "https://checkout.razorpay.com/v1/checkout.js";

export type RazorpayCheckoutSuccess = {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
};

export type RazorpayWebCheckoutOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill: {
    email: string;
    contact: string;
    name: string;
  };
  theme: { color: string };
};

type RazorpayConstructor = new (options: Record<string, unknown>) => {
  open: () => void;
  on: (event: string, handler: (response: unknown) => void) => void;
};

declare global {
  interface Window {
    Razorpay?: RazorpayConstructor;
  }
}

function loadRazorpayScript(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Razorpay is only available in the browser"));
  }
  if (window.Razorpay) {
    return Promise.resolve();
  }

  const existing = document.querySelector<HTMLScriptElement>(
    `script[src="${RAZORPAY_SCRIPT_SRC}"]`,
  );
  if (existing) {
    return new Promise((resolve, reject) => {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener(
        "error",
        () => reject(new Error("Failed to load Razorpay Checkout")),
        { once: true },
      );
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = RAZORPAY_SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () =>
      reject(new Error("Failed to load Razorpay Checkout"));
    document.body.appendChild(script);
  });
}

/** Open Razorpay Checkout.js (web). Resolves on success, rejects on dismiss/failure. */
export async function openRazorpayWebCheckout(
  options: RazorpayWebCheckoutOptions,
): Promise<RazorpayCheckoutSuccess> {
  await loadRazorpayScript();

  if (!window.Razorpay) {
    throw new Error("Razorpay Checkout failed to initialize");
  }

  return new Promise((resolve, reject) => {
    const rzp = new window.Razorpay!({
      ...options,
      theme: { color: options.theme?.color ?? Colors.light.lightGreen },
      handler: (response: RazorpayCheckoutSuccess) => {
        resolve(response);
      },
      modal: {
        ondismiss: () => {
          reject({ description: "Payment cancelled" });
        },
      },
    });

    rzp.on("payment.failed", (response: unknown) => {
      const err = response as {
        error?: { description?: string; reason?: string };
      };
      reject({
        description:
          err?.error?.description ||
          err?.error?.reason ||
          "Payment failed",
      });
    });

    rzp.open();
  });
}
