import React, { createContext, useContext, useMemo, useState } from "react";

type DeliveryFloatContextValue = {
  bottomInset: number;
  setBottomInset: (inset: number) => void;
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

  const value = useMemo(
    () => ({ bottomInset, setBottomInset }),
    [bottomInset],
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
