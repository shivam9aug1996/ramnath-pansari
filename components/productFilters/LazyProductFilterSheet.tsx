import React, { lazy, memo, Suspense, useRef } from "react";
import { Platform } from "react-native";
import type { ComponentProps } from "react";
import ProductFilterSheetNative from "@/components/productFilters/ProductFilterSheet";

type LazyProductFilterSheetProps = ComponentProps<
  typeof ProductFilterSheetNative
>;

const loadProductFilterSheet = () =>
  import("@/components/productFilters/ProductFilterSheet");

const ProductFilterSheetWeb = lazy(loadProductFilterSheet);

/** Warm the filter/sort sheet chunk (web only — Metro does not code-split React.lazy). */
export function preloadProductFilterSheet() {
  if (Platform.OS !== "web") {
    return Promise.resolve();
  }
  return loadProductFilterSheet();
}

/**
 * Web: lazy-loads the sheet chunk on first open.
 * Native: renders the statically imported sheet (React.lazy is unreliable with Metro).
 */
const LazyProductFilterSheet = (props: LazyProductFilterSheetProps) => {
  const openedOnceRef = useRef(false);
  if (props.visible) {
    openedOnceRef.current = true;
  }

  if (!openedOnceRef.current) {
    return null;
  }

  if (Platform.OS !== "web") {
    return <ProductFilterSheetNative {...props} />;
  }

  return (
    <Suspense fallback={null}>
      <ProductFilterSheetWeb {...props} />
    </Suspense>
  );
};

export default memo(LazyProductFilterSheet);
