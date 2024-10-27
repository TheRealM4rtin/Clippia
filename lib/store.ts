import { create } from 'zustand'
import { Window } from '@/types/Window'

interface AppState {
  windows: Window[]
  scale: number
  position: { x: number; y: number }
  colorBackground: boolean
  addWindow: (window: Partial<Window>) => void
  removeWindow: (id: number) => void
  updateWindow: (id: number, updates: Partial<Window>) => void
  setWindows: (windows: Window[]) => void
  setScale: (scale: number) => void
  setPosition: (position: { x: number; y: number }) => void
  toggleColorBackground: () => void
  resetView: () => void
  viewportSize: { width: number; height: number }
  setViewportSize: (size: { width: number; height: number }) => void
}

export const useAppStore = create<AppState>((set) => ({
  windows: [],
  scale: 1,
  position: { x: 0, y: 0 },
  colorBackground: false,
  viewportSize: { width: 0, height: 0 },
  addWindow: (window) => set((state) => {
    const newWindow: Window = {
      id: Date.now(),
      title: window.title || 'New Window',
      content: window.content || '',
      position: { 
        x: Math.random() * 0.5 + 0.25, // Adjust this to ensure windows are within view
        y: Math.random() * 0.5 + 0.25  // Adjust this to ensure windows are within view
      },
      size: window.size || { width: 0.3, height: 0.3 },
      zIndex: Math.max(...state.windows.map(w => w.zIndex), 0) + 1,
      creationTime: new Date(),
      isNew: true,
      isReadOnly: window.isReadOnly ?? false,
      type: window.type || 'text',
    };
    console.log('New window created:', newWindow);
    return { windows: [...state.windows, newWindow] };
  }),
  removeWindow: (id) => set((state) => ({ windows: state.windows.filter(w => w.id !== id) })),
  updateWindow: (id, updates) => set((state) => ({
    windows: state.windows.map(w => w.id === id ? { ...w, ...updates } : w)
  })),
  setWindows: (windows) => set({ windows }),
  setScale: (scale) => set({ scale }),
  setPosition: (position) => set({ position }),
  toggleColorBackground: () => set((state) => ({ colorBackground: !state.colorBackground })),
  resetView: () => set({ scale: 1, position: { x: 0, y: 0 } }),
  setViewportSize: (size) => set({ viewportSize: size }),
}))
