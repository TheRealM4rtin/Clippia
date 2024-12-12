import { StateCreator } from "zustand";
import { AppState } from "@/types/store/state";
import { FlowActions } from "@/types/store/actions";
import { applyNodeChanges, applyEdgeChanges, NodeChange } from "@xyflow/react";

export const createFlowSlice: StateCreator<AppState, [], [], FlowActions> = (
  set
) => ({
  flow: {
    nodes: [],
    edges: [],
    position: { x: 0, y: 0 },
    scale: 1,
    viewport: { x: 0, y: 0, zoom: 1 },
  },
  onNodesChange: (changes: NodeChange[]) => {
    set((state) => {
      const updatedNodes = applyNodeChanges(changes, state.flow.nodes);

      // Update windows if there are dimension changes
      const dimensionChanges = changes.filter(
        (change) => change.type === "dimensions"
      );
      if (dimensionChanges.length > 0) {
        const windowUpdates = state.windows.windows.map((window) => {
          const dimensionChange = dimensionChanges.find(
            (change) => change.id === window.id
          );
          if (dimensionChange && "dimensions" in dimensionChange) {
            return {
              ...window,
              size: {
                width: dimensionChange.dimensions.width,
                height: dimensionChange.dimensions.height,
              },
            };
          }
          return window;
        });

        return {
          flow: {
            ...state.flow,
            nodes: updatedNodes,
          },
          windows: {
            ...state.windows,
            windows: windowUpdates,
          },
        };
      }

      return {
        flow: {
          ...state.flow,
          nodes: updatedNodes,
        },
      };
    });
  },
  onEdgesChange: (changes) => {
    set((state) => ({
      flow: {
        ...state.flow,
        edges: applyEdgeChanges(changes, state.flow.edges),
      },
    }));
  },
  onConnect: (connection) => {
    set((state) => ({
      flow: {
        ...state.flow,
        edges: [
          ...state.flow.edges,
          { ...connection, id: `e${connection.source}-${connection.target}` },
        ],
      },
    }));
  },
  setPosition: (position) => {
    set((state) => ({
      flow: {
        ...state.flow,
        position,
      },
    }));
  },
  setScale: (scale) => {
    set((state) => ({
      flow: {
        ...state.flow,
        scale,
      },
    }));
  },
  setViewport: (viewport) => {
    set((state) => ({
      flow: {
        ...state.flow,
        viewport,
      },
    }));
  },
});
