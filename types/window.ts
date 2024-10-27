import { Node, Edge } from '@xyflow/react';

export interface Window {
  id: string;
  title: string;
  content: string;
  type: 'text' | 'myComputer';
  position: { x: number; y: number };
  size: { width: number; height: number };
  zIndex: number;
  isReadOnly?: boolean;
  isNew?: boolean;
  [key: string]: unknown; // Add this line to include an index signature
}

export interface WindowNode extends Node {
  data: Window;
}
