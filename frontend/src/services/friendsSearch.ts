import { FRIENDS_CONFIG } from '../config/friendsConfig';
import { isAbortError } from './api/friendsErrors';
import { filterDefensivelyForSearch } from './friendsStore';
import type { Friendship, SearchCandidate } from '../types/friends';

export interface SearchControllerState {
  searching: boolean;
  searched: boolean;
  candidates: SearchCandidate[];
  error: string;
}

export interface DebouncedSearchControllerOptions {
  debounceMs?: number;
  minChars?: number;
  onSearch: (query: string, signal?: AbortSignal) => Promise<SearchCandidate[]>;
  getContext?: () => {
    currentUserId?: string | null;
    existingFriendships?: readonly Friendship[];
  };
  onStateChange: (state: SearchControllerState) => void;
}

export function createDebouncedSearchController(options: DebouncedSearchControllerOptions) {
  const debounceMs = options.debounceMs ?? FRIENDS_CONFIG.SEARCH_DEBOUNCE_MS;
  const minChars = options.minChars ?? FRIENDS_CONFIG.SEARCH_MIN_CHARS;

  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let activeAbort: AbortController | null = null;
  let latestRequestId = 0;
  let state: SearchControllerState = {
    searching: false,
    searched: false,
    candidates: [],
    error: '',
  };

  const emit = (patch: Partial<SearchControllerState>) => {
    state = { ...state, ...patch };
    options.onStateChange(state);
  };

  const cancelPending = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    if (activeAbort) {
      activeAbort.abort();
      activeAbort = null;
    }
    latestRequestId += 1;
  };

  const execute = async (trimmedQuery: string, requestId: number) => {
    const controller = new AbortController();
    activeAbort = controller;
    try {
      const rawResults = await options.onSearch(trimmedQuery, controller.signal);
      if (latestRequestId !== requestId || controller.signal.aborted) return;

      const ctx = options.getContext?.() ?? {};
      const filtered = filterDefensivelyForSearch(
        rawResults,
        ctx.currentUserId,
        ctx.existingFriendships ?? [],
      );
      emit({
        searching: false,
        searched: true,
        candidates: filtered,
        error: '',
      });
    } catch (err) {
      if (isAbortError(err) || controller.signal.aborted) return;
      if (latestRequestId !== requestId) return;
      emit({
        searching: false,
        searched: false,
        candidates: [],
        error: err instanceof Error ? err.message : 'Search failed. Please try again.',
      });
    } finally {
      if (activeAbort === controller) {
        activeAbort = null;
      }
    }
  };

  return {
    getState: () => state,
    search(rawText: string, immediate = false) {
      cancelPending();
      const trimmed = rawText.trim();
      if (trimmed.length < minChars) {
        emit({
          searching: false,
          searched: false,
          candidates: [],
          error: '',
        });
        return;
      }

      const requestId = ++latestRequestId;
      emit({ searching: true, error: '' });

      if (immediate) {
        void execute(trimmed, requestId);
      } else {
        timeoutId = setTimeout(() => {
          timeoutId = null;
          void execute(trimmed, requestId);
        }, debounceMs);
      }
    },
    reset() {
      cancelPending();
      emit({
        searching: false,
        searched: false,
        candidates: [],
        error: '',
      });
    },
    dispose() {
      cancelPending();
    },
  };
}
