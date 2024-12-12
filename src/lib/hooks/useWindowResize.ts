import { useCallback } from "react";
import { WindowData } from "@/types/window";

export function useWindowResize(
  id: string,
  updateWindow: (id: string, updates: Partial<WindowData>) => void
) {
  const handleResize = useCallback(
    (_event: any, { size }: { size: { width: number; height: number } }) => {
      updateWindow(id, { size });
    },
    [id, updateWindow]
  );

  return { handleResize };
} 