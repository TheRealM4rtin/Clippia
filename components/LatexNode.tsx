import React, { ComponentType, useCallback, useEffect, useRef, useState } from 'react';
import { Node as ProsemirrorNode } from 'prosemirror-model';
import { Node, mergeAttributes, InputRule } from '@tiptap/core';
import { NodeViewProps, ReactNodeViewRenderer, NodeViewWrapper } from '@tiptap/react';
import katex from 'katex';

// Types
export interface LatexAttributes {
  formula: string;
  displayMode: boolean;
}

export interface LatexComponentProps extends NodeViewProps {
  node: ProsemirrorNode & {
    attrs: LatexAttributes;
  };
}

// Input rules
export const createLatexInputRule = (displayMode: boolean) => {
  return new InputRule({
    find: displayMode ? /(?:^|\s)\$\$([^$]+)\$\$$/ : /(?:^|\s)\$([^$]+)\$$/,
    handler: ({ state, match, range }) => {
      const formula = match[1].trim();
      const type = state.schema.nodes.latex;
      const node = type.create({ formula, displayMode });
      state.tr.replaceRangeWith(range.from, range.to, node);
    },
  });
};

// React component for rendering LaTeX
export const LatexComponent = (props: LatexComponentProps) => {
  const { node, updateAttributes, editor, getPos } = props;
  const { formula = '', displayMode = false } = node.attrs;
  const [isEditing, setIsEditing] = useState(false);
  const [localFormula, setLocalFormula] = useState(formula);
  const [isHovered, setIsHovered] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    setLocalFormula(formula);
  }, [formula]);

  const startEditing = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
  }, []);

  const stopEditing = useCallback(() => {
    setIsEditing(false);
    if (localFormula !== formula) {
      updateAttributes({ formula: localFormula });
    }
  }, [localFormula, formula, updateAttributes]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      stopEditing();
    }
    if (e.key === 'Escape') {
      setLocalFormula(formula);
      setIsEditing(false);
    }
  };

  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (typeof getPos === 'function') {
      const pos = getPos();
      editor
        .chain()
        .focus()
        .command(({ tr, dispatch }) => {
          if (dispatch) {
            tr.delete(pos, pos + node.nodeSize);
            return true;
          }
          return false;
        })
        .run();
    }
  }, [editor, getPos, node.nodeSize]);

  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => setIsHovered(false);

  if (isEditing) {
    return (
      <NodeViewWrapper 
        className={`latex-editor ${displayMode ? 'block' : 'inline'}`}
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
        onMouseDown={(e: React.MouseEvent) => e.stopPropagation()}
      >
        <div 
          className="latex-editor-container" 
          onMouseDown={(e: React.MouseEvent) => e.stopPropagation()}
          style={{
            position: 'relative',
            width: '100%',
            maxWidth: displayMode ? '100%' : '300px',
            minWidth: '150px',
            pointerEvents: 'auto',
          }}
        >
          <textarea
            ref={inputRef}
            value={localFormula}
            onChange={(e) => setLocalFormula(e.target.value)}
            onKeyDown={handleKeyDown}
            className="latex-input"
            rows={displayMode ? 3 : 1}
            onMouseDown={(e: React.MouseEvent) => e.stopPropagation()}
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
            onBlur={(e) => {
              const container = e.currentTarget.closest('.latex-editor-container');
              const relatedTarget = e.relatedTarget as Element | null;
              if (!container?.contains(relatedTarget)) {
                stopEditing();
              }
            }}
            style={{
              width: '100%',
              resize: 'vertical',
              minHeight: displayMode ? '80px' : '30px',
              maxHeight: '200px',
              padding: '8px',
              marginBottom: '8px',
              fontSize: '14px',
              fontFamily: 'monospace',
              border: '1px solid #ccc',
              borderRadius: '4px',
              pointerEvents: 'auto',
            }}
          />
          <div 
            className="latex-editor-buttons"
            style={{
              display: 'flex',
              gap: '8px',
              justifyContent: 'flex-end',
              pointerEvents: 'auto',
            }}
            onMouseDown={(e: React.MouseEvent) => e.stopPropagation()}
          >
            <button 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                stopEditing();
              }}
              className="save-button"
              type="button"
              style={{
                padding: '4px 12px',
                borderRadius: '4px',
                border: '1px solid #ccc',
                background: '#fff',
                cursor: 'pointer',
                pointerEvents: 'auto',
              }}
            >
              Save
            </button>
            <button 
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleDelete(e);
              }}
              className="delete-button"
              type="button"
              style={{
                padding: '4px 12px',
                borderRadius: '4px',
                border: '1px solid #ff4444',
                background: '#fff',
                color: '#ff4444',
                cursor: 'pointer',
                pointerEvents: 'auto',
              }}
            >
              Delete
            </button>
          </div>
        </div>
      </NodeViewWrapper>
    );
  }

  try {
    const html = katex.renderToString(localFormula || formula, {
      throwOnError: true,
      displayMode,
      trust: false,
      strict: true
    });

    return (
      <NodeViewWrapper 
        className={`latex-node ${displayMode ? 'block' : 'inline'} ${isHovered ? 'hovered' : ''}`}
        onClick={startEditing}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          display: displayMode ? 'block' : 'inline-block',
          margin: displayMode ? '1em 0' : '0',
        }}
      >
        <div 
          className="latex-content"
          style={{
            display: displayMode ? 'block' : 'inline-block',
          }}
        >
          <span
            data-latex=""
            data-formula={formula}
            data-display-mode={displayMode}
            dangerouslySetInnerHTML={{ __html: html }}
            style={{
              display: displayMode ? 'block' : 'inline-block',
            }}
          />
        </div>
      </NodeViewWrapper>
    );
  } catch (error) {
    console.error('LaTeX rendering error:', error);
    return (
      <NodeViewWrapper 
        className={`latex-error ${isHovered ? 'hovered' : ''}`}
        onClick={startEditing}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <span>{formula}</span>
      </NodeViewWrapper>
    );
  }
};

// Custom Node for LaTeX
export const LatexNode = Node.create({
  name: 'latex',
  group: 'inline',
  inline: true,
  atom: true,
  selectable: true,
  draggable: false,

  addAttributes() {
    return {
      formula: {
        default: '',
      },
      displayMode: {
        default: false,
        parseHTML: element => element.getAttribute('data-display-mode') === 'true',
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-latex]',
        getAttrs: element => {
          if (!(element instanceof HTMLElement)) return false;
          return {
            formula: element.getAttribute('data-formula'),
            displayMode: element.getAttribute('data-display-mode') === 'true',
          };
        },
      },
    ];
  },

  renderHTML({ node }) {
    const attrs = {
      'data-latex': '',
      'data-formula': node.attrs.formula,
      'data-display-mode': node.attrs.displayMode,
      class: node.attrs.displayMode ? 'latex-block' : 'latex-inline',
      style: node.attrs.displayMode ? 'display: block;' : 'display: inline;',
    };
    return ['span', mergeAttributes(this.options.HTMLAttributes, attrs)];
  },

  addNodeView() {
    return ReactNodeViewRenderer(LatexComponent as unknown as ComponentType<NodeViewProps>);
  },

  addInputRules() {
    return [
      createLatexInputRule(false), // inline LaTeX
      createLatexInputRule(true),  // block LaTeX
    ];
  },
}); 