import { create } from "zustand";
import { ProfileRecord } from "../types/api";

interface AppState {
  theme: "dark" | "light";
  sidebarOpen: boolean;
  activeProfile: string | null;
  profiles: ProfileRecord[];
  daemonConnected: boolean;
  daemonUrl: string;
  activeTab: "canvas" | "chat" | "assets";
  dbPath: string;
  setTheme: (theme: "dark" | "light") => void;
  setSidebarOpen: (open: boolean) => void;
  setActiveProfile: (profile: string | null) => void;
  setProfiles: (profiles: ProfileRecord[]) => void;
  setDaemonConnected: (connected: boolean) => void;
  setDaemonUrl: (url: string) => void;
  setActiveTab: (tab: "canvas" | "chat" | "assets") => void;
  setDbPath: (path: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  theme: "dark",
  sidebarOpen: true,
  activeProfile: "default",
  profiles: [
    {
      name: "default",
      profile_dir: "",
      first_seen_at: new Date().toISOString(),
    },
  ],
  daemonConnected: false,
  daemonUrl: "http://127.0.0.1:8000",
  activeTab: "canvas",
  dbPath: "",
  setTheme: (theme) => set({ theme }),
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  setActiveProfile: (activeProfile) => set({ activeProfile }),
  setProfiles: (profiles) => set({ profiles }),
  setDaemonConnected: (daemonConnected) => set({ daemonConnected }),
  setDaemonUrl: (daemonUrl) => set({ daemonUrl }),
  setActiveTab: (activeTab) => set({ activeTab }),
  setDbPath: (dbPath) => set({ dbPath }),
}));
