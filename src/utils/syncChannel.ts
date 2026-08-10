// Real-time synchronization utility using BroadcastChannel and LocalStorage listener
// Keeps multiple open browser windows, tablets, or devices updated live

const CHANNEL_NAME = 'autopark_sync_channel';

class RealtimeSyncManager {
  private channel: BroadcastChannel | null = null;
  private listeners: Array<(event: { type: string; payload?: any }) => void> = [];

  constructor() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      this.channel = new BroadcastChannel(CHANNEL_NAME);
      this.channel.onmessage = (event) => {
        this.notifyListeners(event.data);
      };
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (event) => {
        if (event.key && event.key.startsWith('autopark_')) {
          this.notifyListeners({ type: 'STORAGE_UPDATE', payload: { key: event.key } });
        }
      });
    }
  }

  public subscribe(callback: (event: { type: string; payload?: any }) => void) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((cb) => cb !== callback);
    };
  }

  public broadcast(type: string, payload?: any) {
    if (this.channel) {
      try {
        this.channel.postMessage({ type, payload, timestamp: Date.now() });
      } catch (err) {
        console.warn('Sync broadcast warning:', err);
      }
    }
  }

  private notifyListeners(data: { type: string; payload?: any }) {
    this.listeners.forEach((callback) => callback(data));
  }
}

export const syncManager = new RealtimeSyncManager();
