import { Node, Edge } from '@xyflow/react';
import { User } from '@supabase/supabase-js';
import { WindowData } from '@/types/window';
import { ChatCommand, ChatMessage, AuthState } from '@/lib/store/slices/assistantSlice';

export interface Position {
  x: number;
  y: number;
}

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
  isChatOpen: boolean;
  messages: ChatMessage[];
  availableCommands: ChatCommand[];
  authState: AuthState | null;
}

export interface FlowState {
  nodes: Node[];
  edges: Edge[];
  position: Position;
  scale: number;
  viewport: ViewportState;
}

export interface WindowState {
  windows: WindowData[];
  activeWindowId: string | null;
}

export interface UIState {
  backgroundColor: string;
  colorBackground: boolean;
  isResizing: boolean;
  resizingNodeId: string | null;
}

export interface UserState {
  user: User | null;
}

export interface AppState {
  flow: FlowState;
  windows: WindowState;
  ui: UIState;
  user: UserState;
  assistant: AssistantState;
} 