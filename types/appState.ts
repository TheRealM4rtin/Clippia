import { Node, Edge, OnNodesChange, OnEdgesChange, OnConnect } from '@xyflow/react';
import { Window } from './window';
import { User } from '@supabase/supabase-js';

export interface AppState {
  // React Flow State
  nodes: Node[];
  edges: Edge[];
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  
  // Window State
  windows: Window[];
  addWindow: (window: Partial<Window>) => void;
  updateWindow: (id: string, updates: Partial<Window>) => void;
  removeWindow: (id: string) => void;
  
  // View State
  colorBackground: boolean;
  toggleColorBackground: () => void;
  resetView: () => void;
  viewportSize: { width: number; height: number };
  setViewportSize: (size: { width: number; height: number }) => void;

  // User State
  user: User | null;
  setUser: (user: User | null) => void;

  // Viewport State
  viewport: { x: number; y: number; zoom: number };
  setViewport: (viewport: { x: number; y: number; zoom: number }) => void;
}
