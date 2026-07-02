import { create } from 'zustand';

interface PresenceState {
  onlineUserIds: Set<string>;
  setOnlineUsers: (ids: string[]) => void;
  addUser: (id: string) => void;
  removeUser: (id: string) => void;
  isUserOnline: (id?: string | null) => boolean;
}

export const usePresenceStore = create<PresenceState>((set, get) => ({
  onlineUserIds: new Set<string>(),

  setOnlineUsers: (ids) =>
    set({
      onlineUserIds: new Set(ids.map((id) => id.toLowerCase())),
    }),

  addUser: (id) =>
    set((state) => {
      const next = new Set(state.onlineUserIds);
      next.add(id.toLowerCase());
      return { onlineUserIds: next };
    }),

  removeUser: (id) =>
    set((state) => {
      const next = new Set(state.onlineUserIds);
      next.delete(id.toLowerCase());
      return { onlineUserIds: next };
    }),

  isUserOnline: (id) => {
    if (!id) return false;
    return get().onlineUserIds.has(id.toLowerCase());
  },
}));
