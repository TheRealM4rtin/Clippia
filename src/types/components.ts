import { NodeProps, Position } from "@xyflow/react";
import { WindowType, Position as WindowPosition, Size } from "./window";
import { WhiteboardNodeProps, WhiteboardNodeData } from "./whiteboard";

// Base props that all window components share
export interface BaseWindowComponentProps extends NodeProps {
  id: string;
  type: WindowType;
  dragging: boolean;
  zIndex: number;
  isConnectable: boolean;
  positionAbsoluteX: number;
  positionAbsoluteY: number;
  width?: number;
  height?: number;
  selected: boolean;
  dragHandle?: string;
  selectable: boolean;
  draggable: boolean;
  deletable: boolean;
  parentId?: string;
}

// Props specifically for MyComputer component
export interface MyComputerProps
  extends Omit<WhiteboardNodeProps, "type" | "data"> {
  type: "myComputer";
  data: WhiteboardNodeData & {
    windowType: "myComputer";
    position: WindowPosition;
    size?: Size;
    dragging: boolean;
    zIndex: number;
  };
  sourcePosition?: Position;
  targetPosition?: Position;
}

// Type guard to check if props are MyComputerProps
export function isMyComputerProps(
  props: WhiteboardNodeProps
): props is MyComputerProps {
  return props.data.windowType === "myComputer" && props.type === "myComputer";
}
