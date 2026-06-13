export type PendingCategorySelection = {
  id: string;
  label: string;
};

let pending: PendingCategorySelection | null = null;

export function setPendingCategorySelection(selection: PendingCategorySelection) {
  pending = selection;
}

export function consumePendingCategorySelection(): PendingCategorySelection | null {
  const value = pending;
  pending = null;
  return value;
}
