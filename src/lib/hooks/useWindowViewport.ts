import { useEffect } from "react";
import { useReactFlow } from "@xyflow/react";
import { WindowData } from "@/types/window";
import {
  DEFAULT_WINDOW_WIDTH,
  DEFAULT_WINDOW_HEIGHT,
} from "@/lib/constants/constants";

export function useWindowViewport(
  id: string,
  isNew: boolean,
  updateWindow: (id: string, updates: Partial<WindowData>) => void
) {
  const { getViewport } = useReactFlow();

  useEffect(() => {
    if (!isNew) return;

    const viewport = getViewport();
    const viewportCenterX = -viewport.x * viewport.zoom + window.innerWidth / 2;
    const viewportCenterY =
      -viewport.y * viewport.zoom + window.innerHeight / 2;

    const newPosition = {
      x: (viewportCenterX - DEFAULT_WINDOW_WIDTH / 2) / viewport.zoom,
      y: (viewportCenterY - DEFAULT_WINDOW_HEIGHT / 2) / viewport.zoom,
    };

    updateWindow(id, {
      position: newPosition,
      isNew: false,
    });
  }, [id, isNew, getViewport, updateWindow]);
}
