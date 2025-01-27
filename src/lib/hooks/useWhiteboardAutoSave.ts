import { useEffect, useRef, useCallback } from "react";
import debounce from "lodash/debounce";
import { useAuth } from "@/contexts/AuthContext";
import { useWhiteboardManager } from "./useWhiteboardManager";
import { useAppStore } from "@/lib/store";

const AUTOSAVE_DELAY = 2000;

export function useWhiteboardAutoSave() {
  const { user, hasPaidPlan } = useAuth();
  const { flow } = useAppStore();
  const { saveWhiteboard } = useWhiteboardManager();
  const previousStateRef = useRef<string>("");

  const debouncedSave = useCallback(
    debounce(async () => {
      if (user?.id && hasPaidPlan) {
        await saveWhiteboard();
      }
    }, AUTOSAVE_DELAY),
    [user?.id, hasPaidPlan, saveWhiteboard]
  );

  useEffect(() => {
    const currentState = JSON.stringify({
      nodes: flow.nodes,
      edges: flow.edges,
      viewport: flow.viewport,
    });

    if (currentState !== previousStateRef.current) {
      previousStateRef.current = currentState;
      debouncedSave();
    }

    return () => {
      debouncedSave.cancel();
    };
  }, [flow, debouncedSave]);

  return {
    forceSave: debouncedSave.flush,
  };
}
