import { create } from "zustand";
import type { AppConfig, ScanResult, RouteNode, RouteType } from "../lib/api";

export type Direction = "TB" | "LR";

interface Store {
  config: AppConfig | null;
  scanResult: ScanResult | null;
  selectedRoute: RouteNode | null;
  filterType: RouteType | "all";
  filterRouter: "app" | "pages" | "all";
  searchQuery: string;
  direction: Direction;

  setConfig: (config: AppConfig) => void;
  setScanResult: (result: ScanResult) => void;
  selectRoute: (route: RouteNode | null) => void;
  setFilterType: (type: RouteType | "all") => void;
  setFilterRouter: (router: "app" | "pages" | "all") => void;
  setSearchQuery: (query: string) => void;
  toggleDirection: () => void;
}

export const useStore = create<Store>((set) => ({
  config: null,
  scanResult: null,
  selectedRoute: null,
  filterType: "all",
  filterRouter: "all",
  searchQuery: "",
  direction: "LR",

  setConfig: (config) => set({ config }),
  setScanResult: (scanResult) => set({ scanResult }),
  selectRoute: (route) => set({ selectedRoute: route }),
  setFilterType: (filterType) => set({ filterType }),
  setFilterRouter: (filterRouter) => set({ filterRouter }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  toggleDirection: () =>
    set((state) => ({ direction: state.direction === "TB" ? "LR" : "TB" })),
}));
