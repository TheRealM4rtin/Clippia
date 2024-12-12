import { useCallback } from "react";
import { Editor } from "@tiptap/react";
import { exportToMarkdown } from "@/lib/exportUtils";
import { sanitizeHtml, reportError } from "@/lib/utils/components/utils";

export function useWindowExport(
  id: string,
  editor: Editor | null,
  title: string
) {
  const handleExport = useCallback(async () => {
    if (!editor) return;

    try {
      const content = editor.getHTML();
      await exportToMarkdown(title, sanitizeHtml(content));
    } catch (error) {
      reportError(error as Error, {
        windowId: id,
        action: "export",
        title,
      });
    }
  }, [editor, id, title]);

  return { handleExport };
}
