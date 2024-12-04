import { Node, XYPosition, NodeProps } from '@xyflow/react';

export interface WindowPosition extends XYPosition {
  x: number;
  y: number;
}

export interface DragStartPos {
  x: number;
  y: number;
  offsetX: number;
  offsetY: number;
}

export interface Size {
  width: number;
  height: number;
}

export type WindowType = 'text' | 'myComputer' | 'login' | 'feedback' | 'image' | 'assistant3D';

export interface BaseWindowData {
  id?: string;
  title: string;
  content: string;
  type: WindowType;
  position?: WindowPosition;
  size?: Size;
  zIndex?: number;
  isReadOnly?: boolean;
  dragging?: boolean;
  isNew?: boolean;
  [key: string]: unknown;
}

export interface WindowData extends BaseWindowData {
  type: WindowType;
}

export interface MyComputerData extends Node<WindowData> {
  type: 'myComputer';
  data: WindowData & { type: 'myComputer' };
  dragging: boolean;
  zIndex: number;
  position: XYPosition;
  [key: string]: unknown;
}

export interface TextData extends WindowData {
  type: 'text';
}

export interface LoginData extends WindowData {
  type: 'login';
}

export interface FeedbackData extends WindowData {
  type: 'feedback';
}

export interface ImageData extends WindowData {
  type: 'image';
}

export interface Assistant3DData extends WindowData {
  type: 'assistant3D';
}

export type NodeData = Node<
  | MyComputerData 
  | TextData 
  | LoginData 
  | FeedbackData 
  | ImageData 
  | Assistant3DData
>;

export type NodeTypes = {
  [K in WindowType]: React.ComponentType<NodeProps<NodeData>>;
};

// Type guard
export function isWindowData(data: unknown): data is WindowData {
  return (
    typeof data === 'object' &&
    data !== null &&
    'type' in data &&
    typeof (data as WindowData).type === 'string'
  );
}
