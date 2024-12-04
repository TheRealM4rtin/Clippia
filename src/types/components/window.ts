import { XYPosition } from '@xyflow/react';

export type WindowType = 'text' | 'myComputer' | 'login' | 'feedback';

export interface Position extends XYPosition {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface BaseWindowProps {
  id: string;
  title: string;
  content: string;
  position?: Position;
  size?: Size;
  zIndex: number;
  isReadOnly?: boolean;
  isNew?: boolean;
}

export interface WindowData extends BaseWindowProps {
  type: WindowType;
}

export interface BaseNodeData extends WindowData {
  position: Position;  // Required by React Flow
  draggable?: boolean;
  selectable?: boolean;
  [key: string]: unknown;
}

// Type guard
export const isWindowData = (data: unknown): data is WindowData => {
  return (
    typeof data === 'object' &&
    data !== null &&
    'type' in data &&
    typeof (data as WindowData).type === 'string'
  );
}; 