import { create } from "zustand";

interface LayoutState {
  layouts: Record<number, Record<number, string>>;

  setLayout: (gridId: number, printIndex: number, image: string) => void;
}

export const useLayoutStore = create<LayoutState>((set) => ({
  layouts: {},

  setLayout: (gridId, printIndex, image) =>
    set((state) => ({
      layouts: {
        ...state.layouts,
        [gridId]: {
          ...state.layouts[gridId],
          [printIndex]: image,
        },
      },
    })),
}));
