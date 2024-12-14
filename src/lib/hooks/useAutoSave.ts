import { useEffect, useRef, useMemo } from "react";
import debounce from "lodash/debounce";
import { AUTOSAVE_DELAY } from "@/lib/constants/constants";

interface UseAutoSaveProps {
  content: string;
  onSave: (content: string) => void;
  enabled?: boolean;
  saveDelay?: number;
}

export function useAutoSave({
  content,
  onSave,
  enabled = true,
  saveDelay = AUTOSAVE_DELAY,
}: UseAutoSaveProps) {
  const previousContentRef = useRef<string>(content);
  const savingRef = useRef<boolean>(false);

  // Create debounced save function
  const debouncedSave = useMemo(() => {
    const save = async (contentToSave: string) => {
      if (savingRef.current) return;

      try {
        savingRef.current = true;
        await onSave(contentToSave);
      } finally {
        savingRef.current = false;
      }
    };

    return debounce(save, saveDelay);
  }, [onSave, saveDelay]);

  // Handle content changes
  useEffect(() => {
    if (!enabled) return;

    const hasChanged = content !== previousContentRef.current;
    if (hasChanged) {
      debouncedSave(content);
    }

    // Cleanup function to ensure pending saves complete
    return () => {
      if (hasChanged && !savingRef.current) {
        debouncedSave.flush();
      }
    };
  }, [content, enabled, debouncedSave]);

  // Save on unmount if needed
  useEffect(() => {
    return () => {
      const hasUnsavedChanges = content !== previousContentRef.current;
      if (enabled && hasUnsavedChanges && !savingRef.current) {
        onSave(content);
      }
    };
  }, [enabled, content, onSave]);

  return {
    isPending: savingRef.current,
    lastSavedContent: previousContentRef.current,
    forceSave: () => debouncedSave.flush(),
  };
}
