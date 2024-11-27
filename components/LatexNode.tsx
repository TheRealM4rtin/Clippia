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
            tr.delete(pos, pos + 1);
            return true;
          }
          return false;
        })
        .run();
    }
  }, [editor, getPos]);

  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => setIsHovered(false);

  if (isEditing) {
    return (
      <NodeViewWrapper className={`latex-editor ${displayMode ? 'block' : 'inline'}`}>
        <div className="latex-editor-container" onClick={e => e.stopPropagation()}>
          <textarea
            ref={inputRef}
            value={localFormula}
            onChange={(e) => setLocalFormula(e.target.value)}
            onBlur={stopEditing}
            onKeyDown={handleKeyDown}
            className="latex-input"
            rows={displayMode ? 3 : 1}
          />
          <div className="latex-editor-buttons">
            <button onClick={stopEditing} className="save-button">Save</button>
            <button onClick={handleDelete} className="delete-button">Delete</button>
          </div>
        </div>
      </NodeViewWrapper>
    );
  }

  try {
    const html = katex.renderToString(localFormula || formula, {
      throwOnError: true,
      displayMode,
      trust: false, // Security: Disable custom macro execution
      strict: true  // Security: Enforce strict mode
    });

    return (
      <NodeViewWrapper 
        className={`latex-node ${displayMode ? 'block' : 'inline'} ${isHovered ? 'hovered' : ''}`}
        onClick={startEditing}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className="latex-content">
          <span
            data-latex=""
            data-formula={formula}
            data-display-mode={displayMode}
            dangerouslySetInnerHTML={{ __html: html }}
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
  draggable: true,

  addAttributes() {
    return {
      formula: {
        default: '',
      },
      displayMode: {
        default: false,
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
    return [
      'span',
      mergeAttributes(this.options.HTMLAttributes, {
        'data-latex': '',
        'data-formula': node.attrs.formula,
        'data-display-mode': node.attrs.displayMode,
      }),
    ];
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