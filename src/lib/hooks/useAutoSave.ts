import { useEffect, useRef, useCallback } from "react";
import { debounce } from "@/lib/utils/components/utils";
import { AUTOSAVE_DELAY } from "@/lib/constants/constants";

interface UseAutoSaveProps {
  id: string;
  content: string;
  onSave: (content: string) => void;
  enabled?: boolean;
  saveDelay?: number;
}

export function useAutoSave({
  id,
  content,
  onSave,
  enabled = true,
  saveDelay = AUTOSAVE_DELAY,
}: UseAutoSaveProps) {
  const previousContentRef = useRef<string>(content);
  const savingRef = useRef<boolean>(false);

  // Create debounced save function
  const debouncedSave = useCallback(
    debounce(async (contentToSave: string) => {
      if (savingRef.current) return;

      try {
        savingRef.current = true;
        await onSave(contentToSave);
        // Update previous content ref after successful save
        previousContentRef.current = contentToSave;
      } catch (error) {
        console.error("Error saving content:", error);
        // Optionally trigger error handling/notification here
      } finally {
        savingRef.current = false;
      }
    }, saveDelay),
    [onSave, saveDelay]
  );

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
