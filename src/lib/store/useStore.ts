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
          colorBackground: false,
          isResizing: false,
          resizingNodeId: null
        },
        user: {
          user: null
        },
        assistant: {
          position: { x: 0, y: 0 },
          targetPosition: null,
          isMoving: false,
          lastMoveTime: Date.now(),
          isChatOpen: false,
          messages: [],
          availableCommands: [
            {
              title: 'Login',
              command: '/login',
              description: 'Open the login interface',
              action: () => {
                // Implementation will be added
              },
            },
            {
              title: 'About',
              command: '/about',
              description: 'Show information about Clippia',
              action: () => {
                // Implementation will be added
              },
            },
          ],
          authState: null
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