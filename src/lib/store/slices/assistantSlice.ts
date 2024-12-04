import { StateCreator } from 'zustand';
import { AppState } from '@/types/store/state';
import { AssistantActions } from '@/types/store/actions';
import { AssistantState } from '@/types/store';

export const createAssistantSlice: StateCreator<
  AppState,
  [],
  [],
  AssistantActions
> = (set) => ({
  assistant: {
    position: { x: 0, y: 0 },
    targetPosition: null,
    isMoving: false,
    lastMoveTime: 0,
  },
  updateAssistantState: (updates: Partial<AssistantState>) =>
    set((state) => ({
      assistant: {
        ...state.assistant,
        ...updates,
      },
    })),
}); 