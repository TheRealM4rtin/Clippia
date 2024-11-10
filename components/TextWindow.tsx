import React, { useCallback, useEffect } from 'react';
import { Handle, Position, NodeProps, NodeResizeControl } from '@xyflow/react';
import { useAppStore } from '@/lib/store';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import { Markdown } from 'tiptap-markdown';
import BulletList from '@tiptap/extension-bullet-list';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import { all, createLowlight } from 'lowlight'

// Register commonly used languages
const lowlight = createLowlight(all)

interface WindowData {
  size?: {
    width?: number;
    height?: number;
  };
  // ... other properties
}

const TextWindow: React.FC<NodeProps & { data: WindowData }> = ({ id, data, selected }) => {
  const { updateWindow, removeWindow } = useAppStore();

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: false,
        codeBlock: false,
      }),
      CodeBlockLowlight.configure({
        lowlight,
        defaultLanguage: 'plaintext',
        languageClassPrefix: 'language-',
        HTMLAttributes: {
          class: 'code-block',
          spellcheck: 'false',
        },
      }),
      BulletList.configure({
        HTMLAttributes: {
          class: 'custom-bullet-list',
        },
        keepMarks: true,
        keepAttributes: true,
        itemTypeName: 'listItem',
      }),
      Markdown,
      Link.configure({
        openOnClick: false,
        linkOnPaste: true,
      }),
      Placeholder.configure({
        placeholder: data.isReadOnly ? '' : 'Type here to start...',
      }),
    ],
    content: data.content || '',
    editable: !data.isReadOnly,
    
    onUpdate: ({ editor }) => {
      if (!data.isReadOnly) {
        const html = editor.getHTML();
        updateWindow(id, { content: html });
      }
    },
    autofocus: false,  // Remove autofocus from here
  });

  useEffect(() => {
    if (editor && data.isNew && !data.isReadOnly) {
      setTimeout(() => {
        editor.commands.focus('end');  // Directly focus the editor
      }, 0);  // Use a timeout to ensure the editor is ready
      updateWindow(id, { isNew: false });
    }
  }, [editor, data.isNew, data.isReadOnly, id, updateWindow]);

  useEffect(() => {
    if (selected && editor) {
      editor.commands.focus('end');
    }
  }, [selected, editor]);

  const handleClose = useCallback(() => {
    removeWindow(id);
  }, [id, removeWindow]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (editor) {
      editor.commands.focus('end');
    }
  }, [editor]);

  return (
    <div 
      className="window"
      style={{
        width: data.size?.width ?? 300,
        height: data.size?.height ?? 200,
        backgroundColor: 'white',
        border: '2px solid #000080',
        position: 'relative',
        zIndex: typeof data.zIndex === 'number' ? data.zIndex : 1,
        outline: selected ? '2px solid #000080' : 'none',
        boxShadow: '2px 2px 5px rgba(0, 0, 0, 0.2)',
      }}
      onClick={handleClick}
    >
      {!data.isReadOnly && (
        <>
          {/* Custom resize controls with larger interaction areas */}
          <NodeResizeControl 
            position="top-left" 
            style={{ width: '25px', height: '25px', cursor: 'nw-resize', border: 'none', background: 'transparent' }} 
            onResize={(event, { width, height }) => {
              updateWindow(id, { size: { width, height } });
            }}
          />
          <NodeResizeControl 
            position="top-right" 
            style={{ width: '25px', height: '25px', cursor: 'ne-resize', border: 'none', background: 'transparent' }} 
            onResize={(event, { width, height }) => {
              updateWindow(id, { size: { width, height } });
            }}
          />
          <NodeResizeControl 
            position="bottom-left" 
            style={{ width: '25px', height: '25px', cursor: 'sw-resize', border: 'none', background: 'transparent' }} 
            onResize={(event, { width, height }) => {
              updateWindow(id, { size: { width, height } });
            }}
          />
          <NodeResizeControl 
            position="bottom-right" 
            style={{ width: '25px', height: '25px', cursor: 'se-resize', border: 'none', background: 'transparent' }} 
            onResize={(event, { width, height }) => {
              updateWindow(id, { size: { width, height } });
            }}
          />
          <Handle 
            type="target" 
            position={Position.Top} 
            id="top-target"
            style={{ visibility: selected ? 'visible' : 'hidden' }} 
          />
          <Handle 
            type="source" 
            position={Position.Top} 
            id="top-source"
            style={{ visibility: selected ? 'visible' : 'hidden' }} 
          />
          <Handle 
            type="target" 
            position={Position.Bottom} 
            id="bottom-target"
            style={{ visibility: selected ? 'visible' : 'hidden' }} 
          />
          <Handle 
            type="source" 
            position={Position.Bottom} 
            id="bottom-source"
            style={{ visibility: selected ? 'visible' : 'hidden' }} 
          />
          <Handle 
            type="target" 
            position={Position.Left} 
            id="left-target"
            style={{ visibility: selected ? 'visible' : 'hidden' }} 
          />
          <Handle 
            type="source" 
            position={Position.Left} 
            id="left-source"
            style={{ visibility: selected ? 'visible' : 'hidden' }} 
          />
          <Handle 
            type="target" 
            position={Position.Right} 
            id="right-target"
            style={{ visibility: selected ? 'visible' : 'hidden' }} 
          />
          <Handle 
            type="source" 
            position={Position.Right} 
            id="right-source"
            style={{ visibility: selected ? 'visible' : 'hidden' }} 
          />
        </>
      )}

      
      
      <div className="title-bar">
        <div className="title-bar-text">{data.title as string}</div>
        <div className="title-bar-controls">
          <button aria-label="Minimize" />
          <button aria-label="Maximize" />
          <button aria-label="Close" onClick={handleClose} />
        </div>
      </div>
      <div 
        className="window-body"
        style={{
          margin: 0,
          padding: '0.5rem',
          height: 'calc(100% - 2rem)',
          backgroundColor: 'white',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          cursor: data.isReadOnly ? 'default' : 'text',
        }}
      >
        <EditorContent 
          editor={editor}
          className="tiptap-editor"
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
};

export default TextWindow;
