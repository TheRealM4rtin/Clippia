import { useState, useCallback } from "react";

export function useWindowState() {
  const [isEditing, setIsEditing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const handleFocus = useCallback(() => setIsEditing(true), []);
  const handleBlur = useCallback(() => setIsEditing(false), []);
  const handleDragStart = useCallback(() => setIsDragging(true), []);
  const handleDragEnd = useCallback(() => setIsDragging(false), []);

  return {
    isEditing,
    isDragging,
    handleFocus,
    handleBlur,
    handleDragStart,
    handleDragEnd,
  };
}
