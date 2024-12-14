import { AppState, ViewportState } from './state';
import { WindowData, WindowType } from '@/types/window';
import { Edge } from '@xyflow/react';

// Flow Selectors
export interface FlowSelectors {
  getNodeById: (id: string) => Node | undefined;
  getEdgeById: (id: string) => Edge | undefined;
  getViewport: () => ViewportState;
}

// Window Selectors
export interface WindowSelectors {
  getWindowById: (id: string) => WindowData | undefined;
  getActiveWindow: () => WindowData | undefined;
  getWindowsByType: (type: WindowType) => WindowData[];
}

// Complete Store Selectors
export interface StoreSelectors extends 
  FlowSelectors,
  WindowSelectors {}

// Selector helpers
export const createSelectors = (state: AppState) => ({
  getNodeById: (id: string) => state.flow.nodes.find(node => node.id === id),
  getWindowById: (id: string) => state.windows.windows.find(window => window.id === id),
  getActiveWindow: () => state.windows.windows.find(window => window.id === state.windows.activeWindowId),
  getWindowsByType: (type: WindowType) => state.windows.windows.filter(window => window.type === type),
}); 