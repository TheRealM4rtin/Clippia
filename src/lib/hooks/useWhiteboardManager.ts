import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useAppStore } from "@/lib/store";
import { WhiteboardState, WhiteboardNode } from "@/types/whiteboard";
import { Node, Edge, NodeChange } from "@xyflow/react";

interface WhiteboardManager {
  isLoading: boolean;
  error: Error | null;
  saveWhiteboard: () => Promise<void>;
  resetWhiteboard: () => void;
  initialized: boolean;
}

interface WhiteboardData {
  nodes: WhiteboardNode[];
  edges: Edge[];
  viewport: { x: number; y: number; zoom: number };
}

export function useWhiteboardManager(): WhiteboardManager {
  const { user, hasPaidPlan, supabase } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [initialized, setInitialized] = useState(false);
  const { flow, onNodesChange, onEdgesChange, setViewport } = useAppStore();

  const loadWhiteboard = useCallback(async () => {
    console.log("🔍 loadWhiteboard called with:", {
      hasSupabase: !!supabase,
      userId: user?.id,
      hasPaidPlan,
      initialized,
    });

    if (initialized || !supabase || !user?.id || !hasPaidPlan) {
      console.log("⚠️ loadWhiteboard early return:", {
        initialized,
        hasSupabase: !!supabase,
        hasUser: !!user?.id,
        hasPaidPlan,
      });
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      console.log("📥 Fetching whiteboard data for user:", user.id);
      const { data, error: fetchError } = await supabase
        .from("whiteboards")
        .select("*")
        .eq("user_id", user.id)
        .single();

      console.log("📦 Fetched whiteboard data:", { data, error: fetchError });

      let whiteboardData = {
        nodes: [],
        edges: [],
        viewport: { x: 0, y: 0, zoom: 1 },
      };

      if (fetchError) {
        if (fetchError.code === "PGRST116") {
          // Create new whiteboard if none exists
          const { error: createError } = await supabase
            .from("whiteboards")
            .insert({
              user_id: user.id,
              name: "My Whiteboard",
              data: JSON.stringify(whiteboardData),
              version: 1,
            })
            .select();

          if (createError) throw createError;
        } else {
          throw fetchError;
        }
      } else if (data && typeof data.data === "string") {
        try {
          whiteboardData = JSON.parse(data.data);
        } catch (parseError) {
          console.error("Failed to parse whiteboard data:", parseError);
          throw new Error("Invalid whiteboard data format");
        }
      }

      // Update nodes
      if (Array.isArray(whiteboardData.nodes)) {
        onNodesChange(
          whiteboardData.nodes.map((node: WhiteboardNode) => ({
            type: "add",
            item: node,
          }))
        );
      }

      // Update edges
      if (Array.isArray(whiteboardData.edges)) {
        onEdgesChange(
          whiteboardData.edges.map((edge: Edge) => ({
            type: "add",
            item: edge,
          }))
        );
      }

      // Update viewport
      if (whiteboardData.viewport) {
        setViewport(whiteboardData.viewport);
      }

      setInitialized(true);
    } catch (err) {
      console.error("Failed to load whiteboard:", err);
      setError(
        err instanceof Error ? err : new Error("Failed to load whiteboard")
      );
    } finally {
      setIsLoading(false);
    }
  }, [
    supabase,
    user?.id,
    hasPaidPlan,
    initialized,
    onNodesChange,
    onEdgesChange,
    setViewport,
  ]);

  const saveWhiteboard = useCallback(async () => {
    if (!supabase || !user?.id || !hasPaidPlan) return;

    try {
      const whiteboardData: WhiteboardData = {
        nodes: flow.nodes as WhiteboardNode[],
        edges: flow.edges,
        viewport: flow.viewport,
      };

      const { error: saveError } = await supabase.from("whiteboards").upsert({
        user_id: user.id,
        name: "My Whiteboard",
        data: JSON.stringify(whiteboardData),
        updated_at: new Date().toISOString(),
        version: 1,
      });

      if (saveError) throw saveError;
    } catch (err) {
      console.error("Failed to save whiteboard:", err);
      setError(
        err instanceof Error ? err : new Error("Failed to save whiteboard")
      );
    }
  }, [supabase, user?.id, hasPaidPlan, flow]);

  const resetWhiteboard = useCallback(() => {
    const removeChanges: NodeChange[] = flow.nodes.map((node) => ({
      type: "remove" as const,
      id: node.id,
    }));
    onNodesChange(removeChanges);
    setInitialized(false);
    setError(null);
  }, [flow.nodes, onNodesChange]);

  useEffect(() => {
    loadWhiteboard();
  }, [loadWhiteboard]);

  useEffect(() => {
    if (!hasPaidPlan) {
      resetWhiteboard();
    }
  }, [hasPaidPlan, resetWhiteboard]);

  return {
    isLoading,
    error,
    saveWhiteboard,
    resetWhiteboard,
    initialized,
  };
}
