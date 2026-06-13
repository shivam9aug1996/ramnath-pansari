/** Shared product grid layout — keep placeholder and list in sync on every screen size. */
export const PRODUCT_CARD_HEIGHT = 280;
export const PRODUCT_LIST_PADDING_TOP = 170;
export const PRODUCT_LIST_MARGIN_TOP = 20;
export const PRODUCT_LIST_PADDING_BOTTOM = 24;
export const PRODUCT_COLUMN_GAP = 4;
export const PRODUCT_ITEM_MARGIN_BOTTOM = 8;
export const PRODUCT_SKELETON_COUNT = 6;

export const getProductColumnStyle = (index: number) => ({
  marginRight: index % 2 === 0 ? PRODUCT_COLUMN_GAP : 0,
  marginLeft: index % 2 === 0 ? 0 : PRODUCT_COLUMN_GAP,
});
