import React, { memo, useRef, useEffect } from 'react';
import { NodeProps, NodeResizer } from '@xyflow/react';
import { EditorContent, useEditor } from '@tiptap/react';
import { WindowData } from '@/types/window';
import { useAppStore } from '@/lib/store';
import { createEditorConfig } from '@/lib/utils/editorConfig';
import {
  useWindowContent,
  useWindowState,
  useWindowExport,
  useWindowViewport,
  useWindowResize,
  useImageHandling
} from '@/lib/hooks';
import styles from '@/styles/animations.module.css';

const TextWindow: React.FC<NodeProps & { data: WindowData }> = memo(({ id, data, selected }) => {
  // Refs
  const windowRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);

  // Editor setup first, without onUpdate
  const editor = useEditor(
    createEditorConfig({
      isReadOnly: !!data.isReadOnly,
      content: data.content,
      onCreate: ({ editor }) => {
        if (data.isNew && !data.isReadOnly) {
          setTimeout(() => editor.commands.focus('end'), 100);
        }
      }
    })
  );
  

  // Selective store access
  const updateWindow = useAppStore((state) => state.updateWindow);
  const removeWindow = useAppStore((state) => state.removeWindow);
  const isResizing = useAppStore((state) => state.ui.isResizing);

  // Custom hooks
  const { isEditing, isDragging } = useWindowState();
  const { handleContentUpdate } = useWindowContent(id, editor, !!data.isReadOnly, updateWindow);
  const { handleExport } = useWindowExport(id, editor, data.title);
  useWindowViewport(id, !!data.isNew, updateWindow);
  const { handleResize } = useWindowResize(id, updateWindow);
  const { handleDrop, handlePaste } = useImageHandling({
    editor,
    windowId: id,
    maxWidth: data.size?.width || 800
  });

  // Update editor configuration when handleContentUpdate changes
  useEffect(() => {
    if (editor && handleContentUpdate) {
      editor.on('update', handleContentUpdate);
      return () => {
        editor.off('update', handleContentUpdate);
      };
    }
  }, [editor, handleContentUpdate]);

  return (
    <div
      ref={windowRef}
      className={`window ${styles.windowHoverEffect} ${styles.light} ${styles.windowAnimation}`}
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: 'white',
        border: '2px solid #000080',
        position: 'relative',
        outline: selected ? '2px solid #000080' : 'none',
        boxShadow: '2px 2px 5px rgba(0, 0, 0, 0.2)',
        overflow: 'visible',
        pointerEvents: 'auto'
      }}
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      onPaste={handlePaste}
      onContextMenu={(e) => e.preventDefault()}
    >
      {!data.isReadOnly && (
        <NodeResizer
          minWidth={200}
          minHeight={150}
          isVisible={selected && !isResizing}
          lineClassName="border-blue-400"
          handleClassName="bg-white border-2 border-blue-400 rounded-full"
          onResize={handleResize}
        />
      )}

      <div className="title-bar">
        <div className="title-bar-text">{data.title}</div>
        <div className="title-bar-controls">
          <span
            aria-label="Export"
            onClick={handleExport}
            style={{
              marginRight: '5px',
              fontSize: '10px',
              color: '#ffffff',
              cursor: 'pointer',
              display: 'inline-block'
            }}
          >
            export
          </span>
          <button aria-label="Minimize" />
          <button aria-label="Maximize" />
          <button aria-label="Close" onClick={() => removeWindow(id)} />
        </div>
      </div>

      <div
        ref={editorRef}
        className="window-body"
        style={{
          margin: 0,
          padding: '0.5rem',
          height: 'calc(100% - 2rem)',
          backgroundColor: 'white',
          overflow: 'auto',
          display: 'flex',
          flexDirection: 'column',
          cursor: isEditing ? 'text' : 'default',
          userSelect: isDragging ? 'none' : 'text',
        }}
      >
        <EditorContent
          editor={editor}
          className={`tiptap-editor ${isEditing ? 'editing' : ''}`}
          style={{
            flex: 1,
            overflow: 'auto',
            height: '100%',
            position: 'relative',
          }}
        />
      </div>
    </div>
  );
});

TextWindow.displayName = 'TextWindow';

export default TextWindow;