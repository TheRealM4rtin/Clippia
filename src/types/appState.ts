import { Node, Edge, OnNodesChange, OnEdgesChange, OnConnect } from '@xyflow/react';
import { WindowData } from '@/types/window';
import { AuthUser } from '@/types/auth';

export interface AppState {
  // React Flow State
  nodes: Node<WindowData>[];
  edges: Edge[];
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  
  // Window State
  windows: WindowData[];
  addWindow: (window: Partial<WindowData>) => void;
  updateWindow: (id: string, updates: Partial<WindowData>) => void;
  removeWindow: (id: string) => void;
  
  // View State
  colorBackground: boolean;
  toggleColorBackground: () => void;
  resetView: () => void;
  viewportSize: { width: number; height: number };
  setViewportSize: (size: { width: number; height: number }) => void;

  // User State
  user: AuthUser | null;
  setUser: (user: AuthUser | null) => void;

  // Viewport State
  viewport: { x: number; y: number; zoom: number };
  setViewport: (viewport: { x: number; y: number; zoom: number }) => void;
}
