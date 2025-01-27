import { User } from "@supabase/supabase-js";
import { Connection, NodeChange, EdgeChange, Viewport } from "@xyflow/react";
import { WindowData } from "@/types/window";
import { AssistantState, Position, ViewportState } from "@/types/store/state";
import { ChatMessage } from "@/lib/store/slices/assistantSlice";

export interface FlowActions {
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  setPosition: (position: { x: number; y: number }) => void;
  setScale: (scale: number) => void;
  setViewport: (viewport: Viewport) => void;
}

export interface WindowActions {
  addWindow: (window: Partial<WindowData>) => void;
  updateWindow: (id: string, updates: Partial<WindowData>) => void;
  removeWindow: (id: string) => void;
}

export interface UIActions {
  setBackgroundColor: (color: string) => void;
  toggleColorBackground: () => void;
  setViewportSize: (size: { width: number; height: number }) => void;
  setResizing: (isResizing: boolean) => void;
}

export interface UserActions {
  setUser: (user: User | null) => void;
}

export interface AssistantActions {
  updateAssistantState: (updates: Partial<AssistantState>) => void;
  addMessage: (message: Omit<ChatMessage, "id" | "timestamp">) => void;
  handleAuthResponse: (response: string) => void;
}

export type StoreActions = FlowActions &
  WindowActions &
  UIActions &
  UserActions &
  AssistantActions;
