import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  getCartFooterFallbackInset,
  getGoToCartFallbackInset,
} from "@/utils/bottomChrome";

type DeliveryFloatContextValue = {
  bottomInset: number;
  setBottomInset: (inset: number) => void;
  goToCartInset: number;
  goToCartChromeHidden: boolean;
  setGoToCartChromeHidden: (hidden: boolean) => void;
  setGoToCartInset: (inset: number) => void;
  publishGoToCartInsetEstimate: () => void;
  setGoToCartInsetMeasured: (height: number) => void;
  cartFooterInset: number;
  setCartFooterInset: (inset: number) => void;
  publishCartFooterInsetEstimate: () => void;
  setCartFooterInsetMeasured: (height: number) => void;
};

const DeliveryFloatContext = createContext<DeliveryFloatContextValue | null>(
  null,
);

export function DeliveryFloatProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [bottomInset, setBottomInset] = useState(0);
  const [goToCartInset, setGoToCartInsetState] = useState(0);
  const [goToCartChromeHidden, setGoToCartChromeHiddenState] = useState(false);
  const [cartFooterInset, setCartFooterInsetState] = useState(0);
  const lastMeasuredGoToCartInsetRef = useRef(0);
  const lastMeasuredCartFooterInsetRef = useRef(0);

  const setGoToCartChromeHidden = useCallback((hidden: boolean) => {
    setGoToCartChromeHiddenState(hidden);
  }, []);

  const setGoToCartInset = useCallback((inset: number) => {
    setGoToCartInsetState(inset);
  }, []);

  const publishGoToCartInsetEstimate = useCallback(() => {
    setGoToCartInsetState(
      getGoToCartFallbackInset(lastMeasuredGoToCartInsetRef.current),
    );
  }, []);

  const setGoToCartInsetMeasured = useCallback((height: number) => {
    if (height <= 0) return;
    lastMeasuredGoToCartInsetRef.current = height;
    setGoToCartInsetState(height);
  }, []);

  const setCartFooterInset = useCallback((inset: number) => {
    setCartFooterInsetState(inset);
  }, []);

  const publishCartFooterInsetEstimate = useCallback(() => {
    setCartFooterInsetState(
      getCartFooterFallbackInset(lastMeasuredCartFooterInsetRef.current),
    );
  }, []);

  const setCartFooterInsetMeasured = useCallback((height: number) => {
    if (height <= 0) return;
    lastMeasuredCartFooterInsetRef.current = height;
    setCartFooterInsetState(height);
  }, []);

  const value = useMemo(
    () => ({
      bottomInset,
      setBottomInset,
      goToCartInset,
      goToCartChromeHidden,
      setGoToCartChromeHidden,
      setGoToCartInset,
      publishGoToCartInsetEstimate,
      setGoToCartInsetMeasured,
      cartFooterInset,
      setCartFooterInset,
      publishCartFooterInsetEstimate,
      setCartFooterInsetMeasured,
    }),
    [
      bottomInset,
      cartFooterInset,
      goToCartChromeHidden,
      goToCartInset,
      publishCartFooterInsetEstimate,
      publishGoToCartInsetEstimate,
      setGoToCartChromeHidden,
      setCartFooterInset,
      setCartFooterInsetMeasured,
      setGoToCartInset,
      setGoToCartInsetMeasured,
    ],
  );

  return (
    <DeliveryFloatContext.Provider value={value}>
      {children}
    </DeliveryFloatContext.Provider>
  );
}

export function useDeliveryFloatInset() {
  return useContext(DeliveryFloatContext)?.bottomInset ?? 0;
}

export function useDeliveryFloatInsetSetter() {
  return useContext(DeliveryFloatContext)?.setBottomInset;
}

export function useGoToCartInset() {
  const context = useContext(DeliveryFloatContext);
  if (!context) return 0;
  return context.goToCartChromeHidden ? 0 : context.goToCartInset;
}

/** Raw measured height — unaffected by scroll-hide state */
export function useGoToCartMeasuredInset() {
  return useContext(DeliveryFloatContext)?.goToCartInset ?? 0;
}

/** Stable list padding — never shrinks when chrome is scroll-hidden */
export function useGoToCartListPadding() {
  return useGoToCartMeasuredInset();
}

export function useGoToCartChromeActions() {
  const context = useContext(DeliveryFloatContext);
  return {
    setGoToCartChromeHidden: context?.setGoToCartChromeHidden,
  };
}

export function useGoToCartInsetActions() {
  const context = useContext(DeliveryFloatContext);
  return {
    setGoToCartInset: context?.setGoToCartInset,
    publishGoToCartInsetEstimate: context?.publishGoToCartInsetEstimate,
    setGoToCartInsetMeasured: context?.setGoToCartInsetMeasured,
  };
}

/** @deprecated Use useGoToCartInsetActions */
export function useGoToCartInsetSetter() {
  return useContext(DeliveryFloatContext)?.setGoToCartInset;
}

export function useCartFooterInset() {
  return useContext(DeliveryFloatContext)?.cartFooterInset ?? 0;
}

export function useCartFooterInsetActions() {
  const context = useContext(DeliveryFloatContext);
  return {
    setCartFooterInset: context?.setCartFooterInset,
    publishCartFooterInsetEstimate: context?.publishCartFooterInsetEstimate,
    setCartFooterInsetMeasured: context?.setCartFooterInsetMeasured,
  };
}

/** @deprecated Use useCartFooterInsetActions */
export function useCartFooterInsetSetter() {
  return useContext(DeliveryFloatContext)?.setCartFooterInset;
}
