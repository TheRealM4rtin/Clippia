import { Node, Edge, OnNodesChange, OnEdgesChange, OnConnect } from '@xyflow/react';
import { WindowData, NodeData } from '@/types/window';
import { User } from '@supabase/supabase-js';

export interface AppState {
  // React Flow State
  nodes: Node<NodeData>[];
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
  user: User | null;
  setUser: (user: User | null) => void;

  // Viewport State
  viewport: { x: number; y: number; zoom: number };
  setViewport: (viewport: { x: number; y: number; zoom: number }) => void;
}
