import { Node, Edge, NodeProps, Viewport } from "@xyflow/react";
import { WindowData, WindowType } from "./window";
import { Session } from "@supabase/supabase-js";
import { AuthUser } from "@/types/auth";

export interface WhiteboardNodeData extends WindowData {
  session?: Session;
  user?: AuthUser;
  onError?: (error: string) => void;
  [key: string]: unknown;
}

export interface WhiteboardNode extends Node<WhiteboardNodeData> {
  type: WindowType;
  width?: number;
  height?: number;
}

export type WhiteboardNodeProps = NodeProps & {
  data: WhiteboardNodeData;
  type: WindowType;
  width?: number;
  height?: number;
};

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
}

export interface SaveError {
  message: string;
  retryable: boolean;
  data: {
    type?: string;
    suppressPrompt?: boolean;
    [key: string]: unknown;
  } | null;
}

export interface SaveQueueItem {
  state: WhiteboardState;
  retryCount: number;
  lastAttempt?: Date;
}
