import { FRIENDS_CONFIG } from '../config/friendsConfig';

export type FriendsRealtimeEventType =
  | 'request.received'
  | 'request.accepted'
  | 'request.removed';

export interface FriendsRealtimeEvent {
  type: FriendsRealtimeEventType;
  friendshipId?: string;
}

export interface FriendsRealtimeTransport {
  subscribe(onEvent: (event: FriendsRealtimeEvent) => void): () => void;
}

export interface FriendsSyncCallbacks {
  onSync: (reason: 'focus' | 'foreground' | 'poll' | 'realtime') => Promise<void>;
}

/**
 * Pluggable synchronization layer for Friends:
 * - Default (always on): refetch on focus, AppState foreground, pull-to-refresh, mutations, auth change.
 * - While Friends screen is visible: foreground polling with exponential backoff on errors.
 * - Optional adapter (feature-flagged, off by default): SSE/WebSocket invalidation.
 */
export class FriendsSyncController {
  private readonly onSync: FriendsSyncCallbacks['onSync'];
  private readonly realtimeTransport?: FriendsRealtimeTransport;
  private readonly baseIntervalMs: number;
  private readonly maxBackoffMs: number;

  private isVisible = false;
  private isAppActive = true;
  private disposed = false;
  private consecutiveErrors = 0;
  private pollTimer: ReturnType<typeof setTimeout> | null = null;
  private unsubscribeRealtime: (() => void) | null = null;

  constructor(
    callbacks: FriendsSyncCallbacks,
    options?: {
      realtimeTransport?: FriendsRealtimeTransport;
      baseIntervalMs?: number;
      maxBackoffMs?: number;
    },
  ) {
    this.onSync = callbacks.onSync;
    this.realtimeTransport = options?.realtimeTransport;
    this.baseIntervalMs = options?.baseIntervalMs ?? FRIENDS_CONFIG.POLL_INTERVAL_MS;
    this.maxBackoffMs = options?.maxBackoffMs ?? FRIENDS_CONFIG.POLL_MAX_BACKOFF_MS;
  }

  getCurrentPollDelayMs(): number {
    if (this.consecutiveErrors <= 0) return this.baseIntervalMs;
    const multiplier = Math.pow(2, Math.min(this.consecutiveErrors, 4));
    return Math.min(this.baseIntervalMs * multiplier, this.maxBackoffMs);
  }

  setVisible(visible: boolean): void {
    if (this.disposed) return;
    this.isVisible = visible;
    if (visible && this.isAppActive) {
      void this.triggerSync('focus');
      this.scheduleNextPoll();
      this.startRealtimeIfEnabled();
    } else {
      this.clearPollTimer();
      this.stopRealtime();
    }
  }

  setAppActive(active: boolean): void {
    if (this.disposed) return;
    const wasInactive = !this.isAppActive;
    this.isAppActive = active;

    if (active && wasInactive) {
      void this.triggerSync('foreground');
      if (this.isVisible) {
        this.scheduleNextPoll();
        this.startRealtimeIfEnabled();
      }
    } else if (!active) {
      this.clearPollTimer();
      this.stopRealtime();
    }
  }

  recordSuccess(): void {
    this.consecutiveErrors = 0;
  }

  recordError(): void {
    this.consecutiveErrors += 1;
  }

  stopAll(): void {
    this.isVisible = false;
    this.consecutiveErrors = 0;
    this.clearPollTimer();
    this.stopRealtime();
  }

  dispose(): void {
    this.disposed = true;
    this.stopAll();
  }

  private async triggerSync(reason: 'focus' | 'foreground' | 'poll' | 'realtime'): Promise<void> {
    if (this.disposed) return;
    try {
      await this.onSync(reason);
      this.recordSuccess();
    } catch {
      this.recordError();
    }
  }

  private scheduleNextPoll(): void {
    this.clearPollTimer();
    if (this.disposed || !FRIENDS_CONFIG.ENABLE_POLLING || !this.isVisible || !this.isAppActive) {
      return;
    }

    const delay = this.getCurrentPollDelayMs();
    this.pollTimer = setTimeout(async () => {
      if (this.disposed || !this.isVisible || !this.isAppActive) return;
      await this.triggerSync('poll');
      this.scheduleNextPoll();
    }, delay);
  }

  private clearPollTimer(): void {
    if (this.pollTimer) {
      clearTimeout(this.pollTimer);
      this.pollTimer = null;
    }
  }

  private startRealtimeIfEnabled(): void {
    if (!FRIENDS_CONFIG.ENABLE_REALTIME || !this.realtimeTransport || this.unsubscribeRealtime) {
      return;
    }
    this.unsubscribeRealtime = this.realtimeTransport.subscribe(() => {
      // Invalidate/refetch rather than patching state by hand (§4)
      void this.triggerSync('realtime');
    });
  }

  private stopRealtime(): void {
    if (this.unsubscribeRealtime) {
      this.unsubscribeRealtime();
      this.unsubscribeRealtime = null;
    }
  }
}
