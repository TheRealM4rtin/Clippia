import { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import BulletList from "@tiptap/extension-bullet-list";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { common, createLowlight } from "lowlight";
import HorizontalRule from "@tiptap/extension-horizontal-rule";
import TiptapImage from "@tiptap/extension-image";
import Dropcursor from "@tiptap/extension-dropcursor";
import Link from "@tiptap/extension-link";
import { Markdown } from "tiptap-markdown";
import { LatexNode } from "@/components/nodes/LatexNode";
import { isValidUrl } from "@/lib/utils/components/utils";

// Initialize lowlight with common languages
const lowlight = createLowlight(common);

interface EditorConfigOptions {
  isReadOnly?: boolean;
  placeholder?: string;
  content?: string;
  onUpdate?: (content: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  onCreate?: ({ editor }: { editor: Editor }) => void;
}

export function createEditorConfig({
  isReadOnly = false,
  placeholder = "Type here to start...",
  content = "",
  onUpdate,
  onFocus,
  onBlur,
  onCreate
}: EditorConfigOptions = {}) {
  return {
    extensions: [
      StarterKit.configure({
        bulletList: false,
        codeBlock: false,
        horizontalRule: false,
      }),
      CodeBlockLowlight.configure({
        lowlight,
        defaultLanguage: "plaintext",
        languageClassPrefix: "language-",
        HTMLAttributes: {
          class: "code-block",
          spellcheck: "false",
        },
      }),
      BulletList.configure({
        HTMLAttributes: {
          class: "custom-bullet-list",
        },
        keepMarks: true,
        keepAttributes: true,
      }),
      HorizontalRule,
      Markdown,
      Link.configure({
        openOnClick: false,
        linkOnPaste: true,
        validate: (url) => isValidUrl(url),
      }),
      Placeholder.configure({
        placeholder: isReadOnly ? "" : placeholder,
      }),
      TiptapImage.configure({
        inline: true,
        allowBase64: true,
        HTMLAttributes: {
          class: "resizable-image",
          draggable: "true",
          style: "cursor: move",
        },
      }),
      Dropcursor,
      LatexNode,
    ],
    content,
    editable: !isReadOnly,
    enableInputRules: !isReadOnly,
    enablePasteRules: !isReadOnly,
    editorProps: {
      attributes: {
        class: "tiptap-editor",
        spellcheck: "false",
      },
    },
    onCreate,
    onFocus,
    onBlur,
    onUpdate: ({ editor }: { editor: Editor }) => {
      if (onUpdate) {
        onUpdate(editor.getHTML());
      }
    },
  };
}

// Export preset configurations
export const READONLY_CONFIG = createEditorConfig({ isReadOnly: true });
export const DEFAULT_CONFIG = createEditorConfig();
export const MINIMAL_CONFIG = createEditorConfig({
  isReadOnly: false,
  placeholder: "",
});
