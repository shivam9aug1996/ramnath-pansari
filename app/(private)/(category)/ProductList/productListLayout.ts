/** Shared product grid layout — keep placeholder and list in sync on every screen size. */
import { Product } from "@/types/global";

export const PRODUCT_CARD_HEIGHT = 280;
export const PRODUCT_LIST_PADDING_TOP = 170;
export const PRODUCT_LIST_MARGIN_TOP = 20;
export const PRODUCT_LIST_PADDING_BOTTOM = 24;
export const PRODUCT_LIST_ITEM_SEPARATOR_HEIGHT = 20;
export const PRODUCT_COLUMN_GAP = 4;
export const PRODUCT_ITEM_MARGIN_BOTTOM = 8;
export const PRODUCT_SKELETON_COUNT = 6;
export const PRODUCT_PAGINATION_SKELETON_COUNT = 2;
/** Fallback until GoToCart onLayout measures the real height */
export const GO_TO_CART_ESTIMATED_HEIGHT = 192;

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
  marginRight: index % 2 === 0 ? PRODUCT_COLUMN_GAP : 0,
  marginLeft: index % 2 === 0 ? 0 : PRODUCT_COLUMN_GAP,
});
