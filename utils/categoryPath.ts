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
