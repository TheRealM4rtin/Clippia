import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { AppState } from '@/types/store/state';
import { StoreActions } from '@/types/store/actions';
import { createFlowSlice } from './slices/flowSlice';
import { createWindowSlice } from './slices/windowSlice';
import { createUISlice } from './slices/uiSlice';
import { createUserSlice } from './slices/userSlice';
import { createAssistantSlice } from './slices/assistantSlice';

export const useAppStore = create<AppState & StoreActions>()(
  devtools(
    persist(
      (set, get, api) => ({
        flow: {
          nodes: [],
          edges: [],
          position: { x: 0, y: 0 },
          scale: 1,
          viewport: { x: 0, y: 0, zoom: 1 }
        },
        windows: {
          windows: [],
          activeWindowId: null
        },
        ui: {
          backgroundColor: '#ffffff',
          colorBackground: false
        },
        user: {
          user: null
        },
        assistant: {
          position: { x: 0, y: 0 },
          targetPosition: null,
          isMoving: false,
          lastMoveTime: 0
        },
        ...createFlowSlice(set, get, api),
        ...createWindowSlice(set, get, api),
        ...createUISlice(set, get, api),
        ...createUserSlice(set, get, api),
        ...createAssistantSlice(set, get, api),
      }),
      {
        name: 'app-storage',
        partialize: (state) => ({
          ui: { backgroundColor: state.ui.backgroundColor },
          user: { user: state.user.user },
        }),
      }
    )
  )
); 