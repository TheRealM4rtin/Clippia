import { useCallback } from "react";
import { Editor } from "@tiptap/react";
import {
  validateImage,
  processImage,
  reportError,
} from "@/lib/utils/components/utils";
import { IMAGE_PADDING } from "@/lib/constants/constants";

interface UseImageHandlingProps {
  editor: Editor | null;
  windowId: string;
  maxWidth?: number;
}

export function useImageHandling({
  editor,
  windowId,
  maxWidth = 800,
}: UseImageHandlingProps) {
  const handleImageFile = useCallback(
    async (file: File) => {
      if (!editor) return;

      try {
        // Validate the image file
        await validateImage(file);

        // Convert to base64
        const reader = new FileReader();
        return new Promise((resolve, reject) => {
          reader.onload = async (event) => {
            try {
              if (!event.target?.result) {
                throw new Error("Failed to read image file");
              }

              const imgSrc = event.target.result.toString();

              // Process image (resize if needed)
              const effectiveMaxWidth = maxWidth - IMAGE_PADDING;
              const dimensions = await processImage(imgSrc, effectiveMaxWidth);

              // Insert into editor
              editor
                .chain()
                .focus()
                .setImage({
                  src: imgSrc,
                  alt: file.name,
                  ...dimensions,
                })
                .run();

              resolve(true);
            } catch (error) {
              reject(error);
            }
          };
          reader.onerror = () => reject(new Error("Failed to read file"));
          reader.readAsDataURL(file);
        });
      } catch (error) {
        reportError(error as Error, {
          windowId,
          action: "image-upload",
          filename: file.name,
        });
        throw error;
      }
    },
    [editor, windowId, maxWidth]
  );

  const handleDrop = useCallback(
    async (event: React.DragEvent) => {
      if (!editor) return;

      event.preventDefault();

      const files = Array.from(event.dataTransfer.files).filter((file) =>
        file.type.startsWith("image/")
      );

      for (const file of files) {
        await handleImageFile(file);
      }
    },
    [editor, handleImageFile]
  );

  const handlePaste = useCallback(
    async (event: React.ClipboardEvent) => {
      if (!editor) return;

      const items = Array.from(event.clipboardData.items);

      for (const item of items) {
        if (item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) {
            event.preventDefault();
            await handleImageFile(file);
          }
        }
      }
    },
    [editor, handleImageFile]
  );

  return {
    handleImageFile,
    handleDrop,
    handlePaste,
  };
}
