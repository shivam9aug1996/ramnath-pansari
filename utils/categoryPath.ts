import type { Category } from "@/types/global";

export type CategoryPathItem = {
  _id: string;
  name: string;
};

function buildCategoryNameMap(categories: Category[]): Map<string, string> {
  const map = new Map<string, string>();

  const walk = (nodes: Category[]) => {
    for (const node of nodes) {
      map.set(node._id, node.name);
      if (node.children?.length) {
        walk(node.children);
      }
    }
  };

  walk(categories);
  return map;
}

/** Resolve categoryPath IDs to `{ _id, name }` in the same order. */
export function getCategoriesFromPath(
  categories: Category[] | undefined,
  categoryPath: string[] | undefined,
): CategoryPathItem[] {
  if (!categories?.length || !categoryPath?.length) {
    return [];
  }

  const nameById = buildCategoryNameMap(categories);

  return categoryPath
    .map((id) => {
      const name = nameById.get(id);
      return name ? { _id: id, name } : null;
    })
    .filter((item): item is CategoryPathItem => item != null);
}

export type RecentlyViewedL2Chip = {
  l1: Category;
  l2: Category;
  selectedCategoryIdIndex: number;
};

type RecentlyViewedPathItem = {
  type?: string;
  categoryPath?: string[];
};

/**
 * Unique L2 categories from recently viewed products (recency order).
 * categoryPath: [L1, L2, ...]; needs at least L1+L2 to contribute a chip.
 */
export function getL2ChipsFromRecentlyViewed(
  categories: Category[] | undefined,
  recentlyViewedItems: RecentlyViewedPathItem[] | undefined,
): RecentlyViewedL2Chip[] {
  if (!categories?.length || !recentlyViewedItems?.length) {
    return [];
  }

  const seen = new Set<string>();
  const chips: RecentlyViewedL2Chip[] = [];

  for (const item of recentlyViewedItems) {
    if (item?.type !== "product" || !item.categoryPath?.length) continue;

    const path = getCategoriesFromPath(categories, item.categoryPath);
    if (path.length < 2) continue;

    const l2Id = path[1]._id;
    if (seen.has(l2Id)) continue;

    const l1 = categories.find((c) => c._id === path[0]._id);
    if (!l1?.children?.length) continue;

    const selectedCategoryIdIndex = l1.children.findIndex(
      (c) => c._id === l2Id,
    );
    if (selectedCategoryIdIndex < 0) continue;

    const l2 = l1.children[selectedCategoryIdIndex];
    if (!l2) continue;

    seen.add(l2Id);
    chips.push({ l1, l2, selectedCategoryIdIndex });
  }

  return chips;
}
