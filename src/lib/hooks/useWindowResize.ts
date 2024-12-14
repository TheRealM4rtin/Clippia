import { useCallback } from "react";
import { WindowData } from "@/types/window";
import { OnResize, ResizeDragEvent, ResizeParamsWithDirection } from '@xyflow/react';

export function useWindowResize(
  id: string,
  updateWindow: (id: string, updates: Partial<WindowData>) => void
) {
  const handleResize = useCallback<OnResize>(
    (event: ResizeDragEvent, params: ResizeParamsWithDirection) => {
      updateWindow(id, { size: { width: params.width, height: params.height } });
    },
    [id, updateWindow]
  );

  return { handleResize };
} 