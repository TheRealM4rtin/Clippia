import { Node, Edge, NodeChange, EdgeChange, Connection } from '@xyflow/react';
import { User } from '@supabase/supabase-js';
import { WindowData, Position, Size } from '@/types/window';

export interface ViewportState {
  x: number;
  y: number;
  zoom: number;
}

export interface AssistantState {
  position: Position;
  targetPosition: Position | null;
  isMoving: boolean;
  lastMoveTime: number;
}

export interface AppState {
  // React Flow State
  nodes: Node[];
  edges: Edge[];
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  
  // Window State
  windows: WindowData[];
  addWindow: (window: Partial<WindowData>) => void;
  updateWindow: (id: string, updates: Partial<WindowData>) => void;
  removeWindow: (id: string) => void;
  
  // View State
  colorBackground: boolean;
  toggleColorBackground: () => void;
  resetView: () => void;
  viewportSize: Size;
  setViewportSize: (size: Size) => void;
  lastPosition: Position | null;
  viewport: ViewportState;
  setViewport: (viewport: ViewportState) => void;
  position: Position;
  scale: number;
  setPosition: (position: Position) => void;
  setScale: (scale: number) => void;
  
  // User State
  user: User | null;
  setUser: (user: User | null) => void;
  backgroundColor: string;
  setBackgroundColor: (color: string) => void;
  
  // Assistant State
  assistantState: AssistantState;
  updateAssistantState: (updates: Partial<AssistantState>) => void;
} 