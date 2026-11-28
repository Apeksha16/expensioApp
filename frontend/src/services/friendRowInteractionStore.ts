export interface FriendRowInteractionStore {
  subscribe(listener: () => void): () => void;
  setActiveSwipeId(id: string | null): void;
  setPendingIds(ids: readonly string[]): void;
  isSwipeOpen(id: string): boolean;
  isPending(id: string): boolean;
}

/**
 * External store isolating per-row swipe and pending state from FlatList renderItem
 * so changing one row never invalidates React.memo for other rows (F-12).
 */
export function createFriendRowInteractionStore(): FriendRowInteractionStore {
  let activeSwipeId: string | null = null;
  let pendingIds = new Set<string>();
  const listeners = new Set<() => void>();

  const notify = () => {
    for (const listener of listeners) {
      listener();
    }
  };

  return {
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    setActiveSwipeId(id) {
      if (activeSwipeId === id) return;
      activeSwipeId = id;
      notify();
    },
    setPendingIds(ids) {
      const next = new Set(ids);
      if (
        next.size === pendingIds.size
        && Array.from(next).every((id) => pendingIds.has(id))
      ) {
        return;
      }
      pendingIds = next;
      notify();
    },
    isSwipeOpen(id) {
      return Boolean(id) && activeSwipeId === id;
    },
    isPending(id) {
      return Boolean(id) && pendingIds.has(id);
    },
  };
}
