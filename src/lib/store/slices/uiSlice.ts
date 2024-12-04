import { StateCreator } from 'zustand';
import { AppState } from '@/types/store/state';
import { UIActions } from '@/types/store/actions';

export const createUISlice: StateCreator<
  AppState,
  [],
  [],
  UIActions
> = (set) => ({
  setBackgroundColor: (color: string) => {
    set((state) => ({
      ui: {
        ...state.ui,
        backgroundColor: color,
        colorBackground: true,
      },
    }));
  },
  toggleColorBackground: () => {
    set((state) => ({
      ui: {
        ...state.ui,
        colorBackground: !state.ui.colorBackground,
      },
    }));
  },
  setViewportSize: (size: { width: number; height: number }) => {
    set((state) => ({
      ui: {
        ...state.ui,
        viewportSize: size,
      },
    }));
  },
  setResizing: (isResizing: boolean) => {
    set((state) => ({
      ui: {
        ...state.ui,
        isResizing
      }
    }));
  }
}); 