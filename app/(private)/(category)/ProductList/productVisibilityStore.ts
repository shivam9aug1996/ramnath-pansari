type Listener = () => void;

const visibleIds = new Set<string>();
const listeners = new Map<string, Set<Listener>>();
const globalListeners = new Set<Listener>();

function emit(id: string) {
  listeners.get(id)?.forEach((l) => l());
}

function emitGlobal() {
  globalListeners.forEach((l) => l());
}

export function updateVisibleProductIds(nextIds: Iterable<string>) {
  const next = new Set(nextIds);
  const changed = new Set<string>();

  next.forEach((id) => {
    if (!visibleIds.has(id)) changed.add(id);
  });
  visibleIds.forEach((id) => {
    if (!next.has(id)) changed.add(id);
  });

  if (changed.size === 0 && next.size === visibleIds.size) return;

  visibleIds.clear();
  next.forEach((id) => visibleIds.add(id));

  changed.forEach(emit);
  emitGlobal();
}

export function clearVisibleProductIds() {
  if (visibleIds.size === 0) return;
  const changed = [...visibleIds];
  visibleIds.clear();
  changed.forEach(emit);
  emitGlobal();
}

export function subscribeProductVisibility(id: string, listener: Listener) {
  if (!listeners.has(id)) listeners.set(id, new Set());
  listeners.get(id)!.add(listener);
  return () => {
    listeners.get(id)?.delete(listener);
  };
}

export function getProductVisibilitySnapshot(id: string) {
  return visibleIds.has(id);
}