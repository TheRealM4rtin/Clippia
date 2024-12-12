import { useCallback, useRef, useEffect } from "react";
import { Editor } from "@tiptap/react";
import { WindowData } from "@/types/window";
import {
  sanitizeHtml,
  hasContentChanged,
  saveToLocalStorage,
} from "@/lib/utils/components/utils";

export function useWindowContent(
  id: string,
  editor: Editor | null,
  isReadOnly: boolean,
  updateWindow: (id: string, updates: Partial<WindowData>) => void
) {
  const previousContentRef = useRef<string>("");

  const handleContentUpdate = useCallback(() => {
    if (!editor || isReadOnly) return;

    const content = editor.getHTML();
    if (hasContentChanged(previousContentRef.current, content)) {
      updateWindow(id, { content: sanitizeHtml(content) });
      saveToLocalStorage(`backup_${id}`, content);
      previousContentRef.current = content;
    }
  }, [editor, isReadOnly, id, updateWindow]);

  useEffect(() => {
    return () => {
      if (editor) {
        const content = editor.getHTML();
        saveToLocalStorage(`backup_${id}`, content);
      }
    };
  }, [editor, id]);

  return { handleContentUpdate };
}
