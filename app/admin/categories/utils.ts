import { Category } from '@/types/global';

export type FlatCategoryRow = {
  _id: string;
  name: string;
  image: string | null;
  depth: number;
  parentId: string | null;
  childCount: number;
  pathLabel?: string;
  isExpanded?: boolean;
};

export function flattenCategories(
  categories: Category[],
  depth = 0,
  parentId: string | null = null,
  pathNames: string[] = [],
): FlatCategoryRow[] {
  const rows: FlatCategoryRow[] = [];

  for (const cat of categories) {
    const pathLabel = [...pathNames, cat.name].join(' › ');
    rows.push({
      _id: cat._id,
      name: cat.name,
      image: cat.image,
      depth,
      parentId,
      childCount: cat.children?.length ?? 0,
      pathLabel: pathNames.length > 0 ? pathLabel : undefined,
    });

    if (cat.children?.length) {
      rows.push(
        ...flattenCategories(cat.children, depth + 1, cat._id, [...pathNames, cat.name]),
      );
    }
  }

  return rows;
}

export function countAllCategories(categories: Category[]): number {
  return flattenCategories(categories).length;
}

export function buildVisibleRows(
  categories: Category[],
  expandedIds: Set<string>,
  searchQuery: string,
): FlatCategoryRow[] {
  const query = searchQuery.trim().toLowerCase();

  if (query) {
    return flattenCategories(categories).filter((row) => {
      const nameMatch = row.name.toLowerCase().includes(query);
      const pathMatch = row.pathLabel?.toLowerCase().includes(query) ?? false;
      return nameMatch || pathMatch;
    });
  }

  const rows: FlatCategoryRow[] = [];

  const walk = (nodes: Category[], depth: number, parentId: string | null) => {
    for (const cat of nodes) {
      const isExpanded = expandedIds.has(cat._id);
      rows.push({
        _id: cat._id,
        name: cat.name,
        image: cat.image,
        depth,
        parentId,
        childCount: cat.children?.length ?? 0,
        isExpanded,
      });

      if (cat.children?.length && isExpanded) {
        walk(cat.children, depth + 1, cat._id);
      }
    }
  };

  walk(categories, 0, null);
  return rows;
}

export function collectExpandableIds(categories: Category[]): string[] {
  const ids: string[] = [];
  const walk = (nodes: Category[]) => {
    for (const cat of nodes) {
      if (cat.children?.length) {
        ids.push(cat._id);
        walk(cat.children);
      }
    }
  };
  walk(categories);
  return ids;
}

export function findCategoryBreadcrumb(
  categories: Category[],
  categoryId: string,
): string | null {
  const rows = flattenCategories(categories);
  const row = rows.find((r) => r._id === categoryId);
  if (!row) return null;
  return row.pathLabel ?? row.name;
}

export function findCategoryInTree(
  categories: Category[],
  categoryId: string,
): Category | null {
  for (const cat of categories) {
    if (cat._id === categoryId) return cat;
    if (cat.children?.length) {
      const found = findCategoryInTree(cat.children, categoryId);
      if (found) return found;
    }
  }
  return null;
}

export function buildCategoryStackToId(
  categories: Category[],
  categoryId: string,
): Category[] {
  const walk = (
    nodes: Category[],
    trail: Category[],
  ): Category[] | null => {
    for (const cat of nodes) {
      const nextTrail = [...trail, cat];
      if (cat._id === categoryId) return trail;
      if (cat.children?.length) {
        const found = walk(cat.children, nextTrail);
        if (found) return found;
      }
    }
    return null;
  };

  return walk(categories, []) ?? [];
}
