import { StateCreator } from 'zustand';
import { AppState } from '@/types/store/state';
import { WindowActions } from '@/types/store/actions';
import { WindowData } from '@/types/window';

const MAX_Z_INDEX = 999999;

export const createWindowSlice: StateCreator<
  AppState,
  [],
  [],
  WindowActions
> = (set, get) => ({
  addWindow: (window: Partial<WindowData>) => {
    const newZIndex = Math.min(
      Math.max(...get().windows.windows.map(w => w.zIndex || 0)) + 1,
      MAX_Z_INDEX
    );
    
    set((state) => ({
      windows: {
        ...state.windows,
        windows: [...state.windows.windows, {
          ...window,
          zIndex: newZIndex
        } as WindowData],
      },
    }));
  },
  
  updateWindow: (id, updates) => {
    if (updates.zIndex !== undefined) {
      updates.zIndex = Math.min(updates.zIndex, MAX_Z_INDEX);
    }
    
    set((state) => ({
      windows: {
        ...state.windows,
        windows: state.windows.windows.map((w) =>
          w.id === id ? { ...w, ...updates } : w
        ),
      },
    }));
  },
  
  removeWindow: (id) => {
    set((state) => {
      const newWindows = state.windows.windows.filter((w) => w.id !== id);
      const newNodes = state.flow.nodes.filter((n) => n.id !== id);
      
      return {
        windows: {
          ...state.windows,
          windows: newWindows,
          activeWindowId: state.windows.activeWindowId === id ? null : state.windows.activeWindowId,
        },
        flow: {
          ...state.flow,
          nodes: newNodes,
        },
      };
    });
  },
}); 