import { StateCreator } from 'zustand';
import { AppState } from '@/types/store/state';
import { FlowActions } from '@/types/store/actions';
import { applyNodeChanges, applyEdgeChanges } from '@xyflow/react';

export const createFlowSlice: StateCreator<
  AppState,
  [],
  [],
  FlowActions
> = (set) => ({
  flow: {
    nodes: [],
    edges: [],
    position: { x: 0, y: 0 },
    scale: 1,
    viewport: { x: 0, y: 0, zoom: 1 },
  },
  onNodesChange: (changes) => {
    set((state) => ({
      flow: {
        ...state.flow,
        nodes: applyNodeChanges(changes, state.flow.nodes),
      },
    }));
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
        edges: [...state.flow.edges, { ...connection, id: `e${connection.source}-${connection.target}` }],
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