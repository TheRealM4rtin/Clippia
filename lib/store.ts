import { create } from 'zustand';
import { 
  Node, 
  Edge, 
  addEdge, 
  applyNodeChanges, 
  applyEdgeChanges,
  Connection,
  NodeChange,
  EdgeChange,
} from '@xyflow/react';
import { Window } from '@/types/window';
import { User } from '@supabase/supabase-js';

interface AppState {
  // React Flow State
  nodes: Node[];
  edges: Edge[];
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  
  // Window State
  windows: Window[];
  addWindow: (window: Partial<Window>) => void;
  updateWindow: (id: string, updates: Partial<Window>) => void;
  removeWindow: (id: string) => void;
  
  // View State
  colorBackground: boolean;
  toggleColorBackground: () => void;
  resetView: () => void;
  
  // New additions
  viewportSize: { width: number; height: number };
  setViewportSize: (size: { width: number; height: number }) => void;
  lastPosition: { x: number; y: number } | null;
  viewport: { x: number; y: number; zoom: number };
  setViewport: (viewport: { x: number; y: number; zoom: number }) => void;
  position: { x: number; y: number };
  scale: number;
  setPosition: (position: { x: number; y: number }) => void;
  setScale: (scale: number) => void;
  
  user: User | null;
  setUser: (user: User | null) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  // React Flow State
  nodes: [],
  edges: [],
  onNodesChange: (changes: NodeChange[]) => {
    set({
      nodes: applyNodeChanges(changes, get().nodes),
    });
  },
  onEdgesChange: (changes: EdgeChange[]) => {
    set({
      edges: applyEdgeChanges(changes, get().edges),
    });
  },
  onConnect: (connection) => {
    set({
      edges: addEdge(connection, get().edges),
    });
  },

  // Window State
  windows: [],
  addWindow: (window) => {
    const id = `window-${Date.now()}`;
    const viewportSize = get().viewportSize;
    const currentWindows = get().windows;
    const viewport = get().viewport;
    
    const windowWidth = window.size?.width || 300;
    const windowHeight = window.size?.height || 200;

    // Calculate the center position in the current viewport
    const centerX = (-viewport.x + viewportSize.width / 2) / viewport.zoom - (windowWidth / 2);
    const centerY = (-viewport.y + viewportSize.height / 2) / viewport.zoom - (windowHeight / 2);

    // Find windows near the viewport center with a larger radius
    const windowsNearby = currentWindows.filter(w => {
      if (!w.position) return false;
      
      const distance = Math.sqrt(
        Math.pow(w.position.x - centerX, 2) + 
        Math.pow(w.position.y - centerY, 2)
      );
      return distance < 200; // Increased detection radius
    });

    // Calculate offset based on the number of nearby windows
    const baseOffset = 30;
    const maxWindows = 10; // Reset pattern after this many windows
    const offsetIndex = windowsNearby.length % maxWindows;
    const offset = offsetIndex * baseOffset;

    // Final position with offset
    const finalPosition = {
      x: centerX + offset,
      y: centerY + offset
    };

    console.log('Creating window at position:', finalPosition, 'with offset:', offset);

    // Calculate zIndex - MyComputer should always be on top
    const baseZIndex = (currentWindows.length + 1) * 100;
    const zIndex = window.type === 'myComputer' 
      ? Math.max(...currentWindows.map(w => w.zIndex), baseZIndex) + 100
      : baseZIndex;

    const newWindow: Window = {
      id,
      title: window.title || 'New Window',
      content: window.content || '',
      type: window.type || 'text',
      position: finalPosition,
      size: { width: windowWidth, height: windowHeight },
      zIndex,
      isReadOnly: window.isReadOnly || false,
      isNew: true,
    };

    const newNode = {
      id,
      type: newWindow.type,
      position: finalPosition,
      data: newWindow,
      draggable: true,
      style: { zIndex: newWindow.zIndex }
    };

    set((state) => ({
      windows: [...state.windows, newWindow],
      nodes: [...state.nodes, newNode],
    }));
  },
  updateWindow: (id, updates) => {
    if (updates.position) {
      set({ lastPosition: updates.position });
    }

    set((state) => ({
      windows: state.windows.map((w) => (w.id === id ? { ...w, ...updates } : w)),
      nodes: state.nodes.map((node) => 
        node.id === id 
          ? { 
              ...node, 
              position: updates.position || node.position,
              data: { ...node.data, ...updates }
            }
          : node
      ),
    }));
  },
  removeWindow: (id) => {
    set((state) => ({
      windows: state.windows.filter((w) => w.id !== id),
      nodes: state.nodes.filter((node) => node.id !== id),
      edges: state.edges.filter((edge) => edge.source !== id && edge.target !== id),
    }));
  },

  // View State
  colorBackground: true,
  toggleColorBackground: () => set((state) => ({ colorBackground: !state.colorBackground })),
  resetView: () => {
    set({ lastPosition: null });
    // Add any other reset logic you need
  },
  viewportSize: { width: 0, height: 0 },
  setViewportSize: (size) => set({ viewportSize: size }),
  viewport: { x: 0, y: 0, zoom: 1 },
  setViewport: (viewport) => set({ viewport }),
  lastPosition: null,
  position: { x: 0, y: 0 },
  scale: 1,
  setPosition: (position) => set({ position }),
  setScale: (scale) => set({ scale }),

  user: null,
  setUser: (user) => set({ user }),
}));
