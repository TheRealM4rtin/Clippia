import { useState, useCallback, useRef, useEffect } from "react";
import { compress, decompress } from "lz-string";
import { useAutoSave } from "./useAutoSave";
import {
  WhiteboardState,
  CompressedWhiteboardState,
  SaveError,
  SaveQueueItem,
} from "@/types/whiteboard";
import { useAuth } from "@/contexts/AuthContext";
import { useAppStore } from "@/lib/store";

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second
const PROMPT_COOLDOWN_KEY = "clippia_cloud_prompt_cooldown";
const PROMPT_COOLDOWN_HOURS = 1;

export function useWhiteboardState(userId: string, whiteboardId: string) {
  const { user, loading: authLoading, supabase } = useAuth();
  const {
    flow: { nodes },
  } = useAppStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<SaveError | null>(null);
  const [hasCloudAccess, setHasCloudAccess] = useState(false);
  const saveQueueRef = useRef<SaveQueueItem[]>([]);
  const processingRef = useRef<boolean>(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize state
  useEffect(() => {
    if (!authLoading) {
      setIsInitialized(true);
    }
  }, [authLoading]);

  // Move decompressState function before createInitialWhiteboard
  const decompressState = useCallback(
    (compressed: CompressedWhiteboardState): WhiteboardState => {
      const { id, user_id, name, data, version, created_at, updated_at } =
        compressed;
      const decompressed = JSON.parse(decompress(data) || "{}");

      return {
        id,
        user_id,
        name,
        nodes: decompressed.nodes || [],
        edges: decompressed.edges || [],
        viewport: decompressed.viewport || { x: 0, y: 0, zoom: 1 },
        version,
        created_at,
        updated_at,
      };
    },
    []
  );

  // Update error handling to ensure type safety
  const handleError = useCallback(
    (message: string, data?: unknown, retryable = false) => {
      setError({
        message,
        retryable,
        data: data || null,
      });
    },
    []
  );

  // Create initial whiteboard
  const createInitialWhiteboard = useCallback(async () => {
    if (!supabase) return null;

    try {
      const initialState = {
        id: whiteboardId,
        user_id: userId,
        name: "My Whiteboard",
        data: compress(
          JSON.stringify({
            nodes: [],
            edges: [],
            viewport: { x: 0, y: 0, zoom: 1 },
          })
        ),
        version: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from("whiteboards")
        .insert(initialState)
        .select()
        .single();

      if (error) throw error;

      return decompressState(data as CompressedWhiteboardState);
    } catch (err) {
      console.error("Failed to create initial whiteboard:", err);
      handleError("Failed to create initial whiteboard", err, true);
      return null;
    }
  }, [supabase, whiteboardId, userId, decompressState, handleError]);

  // Check subscription status
  useEffect(() => {
    if (!isInitialized) return;

    const checkSubscription = async () => {
      try {
        if (!userId || !user || !supabase) {
          setHasCloudAccess(false);
          return;
        }

        setIsLoading(true);

        const { data: subscription, error: subError } = await supabase
          .from("subscriptions")
          .select("status, plan")
          .eq("user_id", userId)
          .single();

        if (subError || !subscription) {
          console.log("No subscription found or error:", subError);
          setHasCloudAccess(false);
          return;
        }

        const hasPaidAccess =
          subscription.status === "active" &&
          (subscription.plan === "paid" || subscription.plan === "lifetime");

        setHasCloudAccess(hasPaidAccess);
      } catch (err) {
        console.error("Failed to check subscription status:", err);
        setHasCloudAccess(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkSubscription();
  }, [userId, user, supabase, isInitialized]);

  // Compress whiteboard state for storage
  const compressState = useCallback(
    (state: WhiteboardState): CompressedWhiteboardState => {
      const { id, user_id, name, version, created_at, updated_at } = state;
      const compressedData = compress(
        JSON.stringify({
          nodes: state.nodes,
          edges: state.edges,
          viewport: state.viewport,
        })
      );

      return {
        id,
        user_id,
        name,
        data: compressedData,
        version,
        created_at,
        updated_at,
      };
    },
    []
  );

  // Process save queue
  const processSaveQueue = useCallback(async () => {
    if (!hasCloudAccess || !supabase) {
      // Clear queue if user doesn't have cloud access or no client
      saveQueueRef.current = [];
      setError({
        message:
          "Cloud save is only available with paid plans. Please upgrade to save your work.",
        retryable: false,
        data: { type: "subscription_required" },
      });
      return;
    }

    if (processingRef.current || saveQueueRef.current.length === 0) return;

    processingRef.current = true;
    const item = saveQueueRef.current[0];

    try {
      const compressed = compressState(item.state);
      const { error: saveError } = await supabase.from("whiteboards").upsert({
        id: compressed.id,
        user_id: compressed.user_id,
        name: compressed.name,
        data: compressed.data,
        version: compressed.version,
        updated_at: new Date().toISOString(),
      });

      if (saveError) throw saveError;

      // Success - remove from queue
      saveQueueRef.current.shift();
      setError(null);
    } catch (err) {
      const retryable = item.retryCount < MAX_RETRIES;
      if (retryable) {
        // Update retry count and move to end of queue
        item.retryCount++;
        item.lastAttempt = new Date();
        saveQueueRef.current.push(saveQueueRef.current.shift()!);

        // Schedule retry
        setTimeout(processSaveQueue, RETRY_DELAY);
      } else {
        // Max retries reached - remove from queue and set error
        saveQueueRef.current.shift();
        setError({
          message: "Failed to save whiteboard state",
          retryable: false,
          data: err,
        });
      }
    } finally {
      processingRef.current = false;
      if (saveQueueRef.current.length > 0) {
        processSaveQueue();
      }
    }
  }, [supabase, compressState, hasCloudAccess]);

  // Add interface for node data
  interface PlanNodeData {
    suppressCloudPrompt?: boolean;
  }

  // Queue state for saving
  const queueSave = useCallback(
    (state: WhiteboardState) => {
      const suppressPrompt = nodes.some(
        (node) =>
          node.type === "plans" &&
          (node.data as PlanNodeData)?.suppressCloudPrompt
      );

      const lastPrompt = localStorage.getItem(PROMPT_COOLDOWN_KEY);
      const now = new Date().getTime();
      const cooldownPassed =
        !lastPrompt ||
        now - parseInt(lastPrompt) > PROMPT_COOLDOWN_HOURS * 60 * 60 * 1000;

      if (!hasCloudAccess || !supabase) {
        if (!suppressPrompt && cooldownPassed) {
          localStorage.setItem(PROMPT_COOLDOWN_KEY, now.toString());
          handleError(
            "Cloud save is only available with paid plans. Please upgrade to save your work.",
            { type: "subscription_required" },
            false
          );
        }
        return;
      }

      saveQueueRef.current.push({
        state,
        retryCount: 0,
        lastAttempt: new Date(),
      });
      processSaveQueue();
    },
    [processSaveQueue, hasCloudAccess, supabase, nodes, handleError]
  );

  // Load whiteboard state
  const loadState = useCallback(async () => {
    if (!hasCloudAccess || !supabase) {
      handleError(
        "Cloud storage is only available with paid plans. Please upgrade to access your saved work.",
        { type: "subscription_required" },
        false
      );
      return null;
    }

    try {
      setIsLoading(true);

      // First try to fetch existing whiteboard
      const { data, error } = await supabase
        .from("whiteboards")
        .select("*")
        .eq("id", whiteboardId)
        .eq("user_id", userId)
        .single();

      if (error) {
        // If no record found, create a new one
        if (error.code === "PGRST116") {
          return await createInitialWhiteboard();
        }
        throw error;
      }

      return decompressState(data as CompressedWhiteboardState);
    } catch (err) {
      console.error("Failed to load whiteboard state:", err);
      handleError("Failed to load whiteboard state", err, true);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [
    supabase,
    whiteboardId,
    userId,
    decompressState,
    hasCloudAccess,
    handleError,
    createInitialWhiteboard,
  ]);

  // Auto-save hook integration
  const { isPending: isSaving } = useAutoSave({
    content: JSON.stringify({ whiteboardId, userId }),
    onSave: async () => {
      if (!hasCloudAccess || !supabase) return; // Skip auto-save for non-paid users

      const currentState = {
        id: whiteboardId,
        user_id: userId,
        name: "My Whiteboard", // TODO: Make configurable
        nodes: [], // TODO: Get from store
        edges: [], // TODO: Get from store
        viewport: { x: 0, y: 0, zoom: 1 }, // TODO: Get from store
        version: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      queueSave(currentState);
    },
    enabled: hasCloudAccess, // Only enable auto-save for paid users
  });

  return {
    loadState,
    queueSave,
    isLoading: (isLoading || authLoading || !isInitialized) && !!user,
    isSaving,
    error,
    hasCloudAccess,
    setError,
  };
}
