export type PendingProductSelection = {
  id: string;
  name: string;
  size: string;
  image: string | null;
};

let pending: PendingProductSelection | null = null;

export function setPendingProductSelection(selection: PendingProductSelection) {
  pending = selection;
}

export function consumePendingProductSelection(): PendingProductSelection | null {
  const value = pending;
  pending = null;
  return value;
}
