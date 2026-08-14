/** Shared product grid layout — keep placeholder and list in sync on every screen size. */
import { Product } from "@/types/global";
import { Dimensions, Platform } from "react-native";

/** Matches `#root` max-width in `app/+html.tsx` — desktop window is wider than the phone shell. */
const WEB_SHELL_MAX_WIDTH = 430;
const windowWidth = Dimensions.get("window").width;
const SHELL_WIDTH =
  Platform.OS === "web"
    ? Math.min(windowWidth, WEB_SHELL_MAX_WIDTH)
    : windowWidth;

export const PRODUCT_COLUMN_GAP = 8;
/** Vertical gutter between product rows (Blinkit-like). */
export const PRODUCT_ITEM_MARGIN_BOTTOM = 10;
/**
 * Near-square image area (Blinkit cards).
 * aspectRatio = width/height — ~1 keeps packaging readable.
 */
export const PRODUCT_IMAGE_ASPECT_RATIO = 1.35;

const COLUMN_WIDTH = (SHELL_WIDTH - PRODUCT_COLUMN_GAP * 2) / 2;
const IMAGE_HEIGHT = COLUMN_WIDTH / PRODUCT_IMAGE_ASPECT_RATIO;
/** Name (2 lines) + size + price/ADD footer. */
export const PRODUCT_INFO_HEIGHT = 82;
/** Extra space under the price/ADD row inside the card. */
export const PRODUCT_INFO_MARGIN_BOTTOM = 8;
export const PRODUCT_CARD_HEIGHT = Math.round(
  IMAGE_HEIGHT + PRODUCT_INFO_HEIGHT + PRODUCT_INFO_MARGIN_BOTTOM,
);

/** Category chips + subcategory + sort/filter chip row. */
export const CATEGORY_CHROME_ESTIMATED_HEIGHT = 152;
export const PRODUCT_LIST_PADDING_TOP = CATEGORY_CHROME_ESTIMATED_HEIGHT;
export const PRODUCT_LIST_MARGIN_TOP = 6;
export const PRODUCT_LIST_PADDING_BOTTOM = 24;
/** Chip bar is in chrome flow — no FAB clearance. */
export const PRODUCT_FILTER_FAB_CLEARANCE = 0;
export const PRODUCT_LIST_ITEM_SEPARATOR_HEIGHT = 0;
export const PRODUCT_SKELETON_COUNT = 6;
export const PRODUCT_PAGINATION_SKELETON_COUNT = 2;
/** Fallback until GoToCart onLayout measures the real height */
export const GO_TO_CART_ESTIMATED_HEIGHT = 88;

export type ProductListSkeletonItem = {
  _id: string;
  isSkeleton: true;
};

export type ProductListRow = Product | ProductListSkeletonItem;

export function isProductSkeleton(
  item: ProductListRow,
): item is ProductListSkeletonItem {
  return "isSkeleton" in item && item.isSkeleton === true;
}

export function withPaginationSkeletons(
  products: Product[] = [],
  isLoadingMore: boolean,
  count = PRODUCT_PAGINATION_SKELETON_COUNT,
): ProductListRow[] {
  if (!isLoadingMore) return products;
  return [
    ...products,
    ...Array.from({ length: count }, (_, index) => ({
      _id: `__pagination-skeleton-${index}`,
      isSkeleton: true as const,
    })),
  ];
}

export const getProductColumnStyle = (index: number) => ({
  marginRight: index % 2 === 0 ? PRODUCT_COLUMN_GAP / 2 : 0,
  marginLeft: index % 2 === 0 ? 0 : PRODUCT_COLUMN_GAP / 2,
});

export function createInitialSkeletonRows(
  count = PRODUCT_SKELETON_COUNT,
): ProductListSkeletonItem[] {
  return Array.from({ length: count }, (_, index) => ({
    _id: `__initial-skeleton-${index}`,
    isSkeleton: true as const,
  }));
}

export function buildProductListData(
  products: Product[] = [],
  {
    showInitialSkeleton = false,
    showPaginationSkeleton = false,
  }: {
    showInitialSkeleton?: boolean;
    showPaginationSkeleton?: boolean;
  } = {},
): ProductListRow[] {
  if (showInitialSkeleton) {
    return createInitialSkeletonRows();
  }
  return products;
}
