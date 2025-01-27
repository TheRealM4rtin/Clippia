import { Node, Edge, NodeProps, Viewport } from "@xyflow/react";
import { WindowData, WindowType } from "./window";
import { Session } from "@supabase/supabase-js";
import { AuthUser } from "@/types/auth";

export interface WhiteboardNodeData extends WindowData {
  id: string;
  title: string;
  zIndex: number;
  content?: string;
  position: { x: number; y: number };
  windowType: WindowType;
  isMinimized?: boolean;
  isMaximized?: boolean;
  size?: { width: number; height: number };
  imageUrl?: string;
  imageData?: string;
  textContent?: string;
  [key: string]: unknown;
}

export interface WhiteboardNode {
  id: string;
  type: WindowType;
  position: { x: number; y: number };
  data: WhiteboardNodeData;
  draggable?: boolean;
  selectable?: boolean;
}

export interface WhiteboardNodeProps extends Omit<NodeProps, "data"> {
  data: WhiteboardNodeData;
  type: WindowType;
}

export interface WhiteboardState {
  id: string;
  user_id: string;
  name: string;
  nodes: WhiteboardNode[];
  edges: Edge[];
  viewport: Viewport;
  version: number;
  created_at: string;
  updated_at: string;
  ui?: {
    colorBackground?: boolean;
    backgroundColor?: string;
    lastModified?: string;
  };
}

export interface SaveError {
  message: string;
  retryable: boolean;
  data: {
    [key: string]: unknown;
    type?: string;
    suppressPrompt?: boolean;
  } | null;
}

export interface SaveQueueItem {
  state: WhiteboardState;
  retryCount: number;
  lastAttempt?: Date;
}

export interface CompressedWhiteboardState {
  id: string;
  user_id: string;
  name: string;
  data: string;
  version: number;
  created_at: string;
  updated_at: string;
  nodes?: WhiteboardNode[];
  edges?: Edge[];
  viewport?: Viewport;
  [key: string]: unknown;
}
