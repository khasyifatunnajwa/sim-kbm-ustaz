import { create } from 'zustand';
import type { Profile, ActiveTab } from '../types';

interface AppState {
  user: any | null;
  profile: Profile | null;
  activeTab: ActiveTab;
  kelasList: string[];
  mapelList: string[];
  
  // Actions (Fungsi pengubah state)
  setUser: (user: any) => void;
  setProfile: (profile: Profile | null) => void;
  setActiveTab: (tab: ActiveTab) => void;
  setKelasList: (kelas: string[]) => void;
  setMapelList: (mapel: string[]) => void;
  clearStore: () => void; // Digunakan saat logout
}

export const useStore = create<AppState>((set) => ({
  user: null,
  profile: null,
  activeTab: 'dashboard',
  kelasList: [],
  mapelList: [],
  
  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
  setActiveTab: (activeTab) => set({ activeTab }),
  setKelasList: (kelasList) => set({ kelasList }),
  setMapelList: (mapelList) => set({ mapelList }),
  clearStore: () => set({ 
    user: null, 
    profile: null, 
    activeTab: 'dashboard', 
    kelasList: [], 
    mapelList: [] 
  }),
}));
