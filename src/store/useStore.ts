import { create } from 'zustand';
import { persist } from 'zustand/middleware'; // Kita gunakan fitur persist (penyimpan)
import type { Profile, ActiveTab } from '../types';

interface AppState {
  user: any | null;
  profile: Profile | null;
  activeTab: ActiveTab;
  kelasList: string[];
  mapelList: string[];
  
  setUser: (user: any) => void;
  setProfile: (profile: Profile | null) => void;
  setActiveTab: (tab: ActiveTab) => void;
  setKelasList: (kelas: string[]) => void;
  setMapelList: (mapel: string[]) => void;
  clearStore: () => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
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
    }),
    {
      name: 'sim-kbm-storage', // Nama file penyimpanan di dalam memori browser/HP
    }
  )
);
