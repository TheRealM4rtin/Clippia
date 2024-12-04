export interface WindowSize {
  width: number;
  height: number;
}

export interface WindowPosition {
  x: number;
  y: number;
}

export interface WindowData {
  id: string;
  title: string;
  content?: string;
  isReadOnly?: boolean;
  isNew?: boolean;
  size?: WindowSize;
  zIndex?: number;
  position?: WindowPosition;
}

export interface DragStartPos {
  x: number;
  y: number;
}

export interface EditorConfig {
  content: string;
  editable: boolean;
  isNew?: boolean;
  isReadOnly?: boolean;
} 