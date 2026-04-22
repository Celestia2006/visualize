import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useUserStore = create(
  persist(
    (set) => ({
      user: null,

      // Called on signup — stores everything collected in the 3-step form
      setUser: (userData) => set({ user: userData }),

      // Called on login — just sets the user, preferences already persisted
      login: (userData) => set({ user: userData }),

      // Update a single preference (theme, font, skill, etc.)
      updatePreference: (key, value) =>
        set((state) => ({
          user: { ...state.user, [key]: value },
        })),

      // Update bookmark (last visited topic)
      updateBookmark: (bookmark) =>
        set((state) => ({
          user: {
            ...state.user,
            lastTopic: bookmark,
          },
        })),

      logout: () => set({ user: null }),
    }),
    {
      name: "visualize-user", // localStorage key
      version: 1,
      migrate: (persistedState, version) => {
        if (version === 0) {
          // v0 → v1: avatar was accidentally stored as an object {emoji, name, title, description}
          // normalize it back to just the emoji string
          const user = persistedState?.user;
          if (user && typeof user.avatar === "object" && user.avatar !== null) {
            return {
              ...persistedState,
              user: { ...user, avatar: user.avatar.emoji ?? "🦉" },
            };
          }
        }
        return persistedState;
      },
    },
  ),
);
