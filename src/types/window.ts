import { Editor } from "@tiptap/react";
import { Node, NodeProps, XYPosition } from "@xyflow/react";

// Window Types
export type WindowType =
  | "text"
  | "myComputer"
  | "login"
  | "feedback"
  | "image"
  | "assistant3D"
  | "plans";

// Base Position & Size Types
export interface Position extends XYPosition {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

// Drag & Resize Types
export interface DragStartPos {
  x: number;
  y: number;
  offsetX: number;
  offsetY: number;
}

// Base window properties
export interface BaseWindowProps {
  id: string;
  title: string;
  content?: string;
  position: Position;
  size?: Size;
  zIndex: number;
  isReadOnly?: boolean;
  isNew?: boolean;
  windowType: WindowType; // Changed from 'type' to 'windowType' to avoid conflict
  [key: string]: unknown;
}

// Window data that includes base props
export interface WindowData extends BaseWindowProps {
  data?: Record<string, unknown>;
}

// ReactFlow Node with our WindowData
export interface FlowWindowNode extends Node {
  data: WindowData;
  type: WindowType;
}

// Props for TextWindow component
export interface TextWindowProps extends NodeProps {
  id: string;
  data: WindowData & {
    windowType: "text";
    content: string;
  };
  selected?: boolean;
}

// Editor Types
export interface EditorConfig {
  content: string;
  editable: boolean;
  isNew?: boolean;
  isReadOnly?: boolean;
  onUpdate?: (props: { editor: Editor }) => void;
  onFocus?: () => void;
  onBlur?: () => void;
}

// Type Guards
export const isWindowData = (data: unknown): data is WindowData => {
  return (
    typeof data === "object" &&
    data !== null &&
    "windowType" in data &&
    typeof (data as WindowData).windowType === "string"
  );
};
