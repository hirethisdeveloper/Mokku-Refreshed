import { create } from "zustand";

export enum ViewEnum {
  MOCKS = "MOCKS",
  LOGS = "LOGS",
  IMPORT_EXPORT = "IMPORT_EXPORT",
}

export type useGlobalStoreState = {
  view: "MOCKS" | "LOGS" | "IMPORT_EXPORT";
  setView: (view: ViewEnum) => void;
  search: string;
  setSearch: (search: string) => void;
  recording: boolean;
  toggleRecording: () => void;
  filterNon200: boolean;
  toggleFilterNon200: () => void;
  meta: {
    host: string;
    tab?: chrome.tabs.Tab;
    active: boolean;
    storeKey: string;
  };
  setMeta: (meta: useGlobalStoreState["meta"]) => void;
};

// this is our useStore hook that we can use in our components to get parts of the store and call actions
export const useGlobalStore = create<useGlobalStoreState>((set, get) => ({
  view: ViewEnum.MOCKS,
  setView: (view: ViewEnum) => set({ view: view }),
  search: "",
  setSearch: (search: string) => set({ search: search }),
  toggleRecording: () => set({ recording: !get().recording }),
  recording: false,
  filterNon200: false,
  toggleFilterNon200: () => set({ filterNon200: !get().filterNon200 }),
  meta: {
    active: false,
    host: "",
    storeKey: "",
  },
  setMeta: (meta) => set({ meta: meta }),
}));
