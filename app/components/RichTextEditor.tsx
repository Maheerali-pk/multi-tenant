"use client";

import { useEffect, useRef, useState } from "react";
import {
  createEditorSystem,
  boldExtension,
  italicExtension,
  underlineExtension,
  listExtension,
  blockFormatExtension,
  historyExtension,
  htmlExtension,
  RichText,
} from "@lexkit/editor";
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Undo,
  Redo,
  Heading1,
  Heading2,
  Heading3,
} from "lucide-react";

// Create editor system with extensions
const extensions = [
  boldExtension,
  italicExtension,
  underlineExtension,
  listExtension,
  blockFormatExtension,
  historyExtension,
  htmlExtension,
] as const;

const { Provider, useEditor } = createEditorSystem<typeof extensions>();

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

function RichTextEditorContent({
  value,
  onChange,
  placeholder = "Enter text...",
  disabled = false,
  className = "",
}: RichTextEditorProps) {
  const { commands, editor, activeStates } = useEditor();
  const isInitialized = useRef(false);
  const lastValueRef = useRef<string>(value);
  const [activeStatesLocal, setActiveStatesLocal] = useState<{
    bold: boolean;
    italic: boolean;
    underline: boolean;
    unorderedList: boolean;
    orderedList: boolean;
    canUndo: boolean;
    canRedo: boolean;
    isH1: boolean;
    isH2: boolean;
    isH3: boolean;
  }>({
    bold: false,
    italic: false,
    underline: false,
    unorderedList: false,
    orderedList: false,
    canUndo: false,
    canRedo: false,
    isH1: false,
    isH2: false,
    isH3: false,
  });

  // Update active states
  useEffect(() => {
    if (!editor) return;

    const updateStates = () => {
      // activeStates should already contain boolean values
      setActiveStatesLocal({
        bold: activeStates.bold ?? false,
        italic: activeStates.italic ?? false,
        underline: activeStates.underline ?? false,
        unorderedList: activeStates.unorderedList ?? false,
        orderedList: activeStates.orderedList ?? false,
        canUndo: activeStates.canUndo ?? false,
        canRedo: activeStates.canRedo ?? false,
        isH1: activeStates.isH1 ?? false,
        isH2: activeStates.isH2 ?? false,
        isH3: activeStates.isH3 ?? false,
      });
    };

    const removeUpdateListener = editor.registerUpdateListener(() => {
      updateStates();
    });

    // Initial state update
    updateStates();

    return () => {
      removeUpdateListener();
    };
  }, [editor, activeStates]);

  // Load initial value or update when value prop changes externally
  useEffect(() => {
    if (!editor) return;

    if (!isInitialized.current) {
      // Initial load
      if (value) {
        commands.importFromHTML(value, { preventFocus: true }).then(() => {
          isInitialized.current = true;
          lastValueRef.current = value;
        });
      } else {
        isInitialized.current = true;
        lastValueRef.current = "";
      }
    } else if (value !== lastValueRef.current) {
      // External value change (e.g., form reset)
      commands.importFromHTML(value || "", { preventFocus: true }).then(() => {
        lastValueRef.current = value || "";
      });
    }
  }, [editor, value, commands]);

  // Listen for editor changes and export HTML
  useEffect(() => {
    if (!editor || !isInitialized.current) return;

    const removeUpdateListener = editor.registerUpdateListener(() => {
      const html = commands.exportToHTML();
      // Only call onChange if the value actually changed
      if (html !== lastValueRef.current) {
        lastValueRef.current = html;
        onChange(html);
      }
    });

    return () => {
      removeUpdateListener();
    };
  }, [editor, commands, onChange]);

  const ToolbarButton = ({
    onClick,
    isActive,
    disabled,
    children,
    title,
  }: {
    onClick: () => void;
    isActive?: boolean;
    disabled?: boolean;
    children: React.ReactNode;
    title?: string;
  }) => (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`p-2 rounded hover:bg-sidebar-sub-item-hover transition-colors ${
        isActive
          ? "bg-sidebar-sub-item-hover text-brand"
          : "text-text-secondary hover:text-text-primary"
      } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
    >
      {children}
    </button>
  );

  return (
    <div className={`rich-text-editor ${className}`}>
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 border-b border-border-hr bg-bg-inner rounded-t-lg">
        <div className="flex items-center gap-1 border-r border-border-hr pr-2 mr-2">
          <ToolbarButton
            onClick={() => commands.toggleBold()}
            isActive={activeStatesLocal.bold}
            title="Bold (Ctrl+B)"
          >
            <Bold size={16} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => commands.toggleItalic()}
            isActive={activeStatesLocal.italic}
            title="Italic (Ctrl+I)"
          >
            <Italic size={16} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => commands.toggleUnderline()}
            isActive={activeStatesLocal.underline}
            title="Underline (Ctrl+U)"
          >
            <Underline size={16} />
          </ToolbarButton>
        </div>

        <div className="flex items-center gap-1 border-r border-border-hr pr-2 mr-2">
          <ToolbarButton
            onClick={() => commands.toggleHeading("h1")}
            isActive={activeStatesLocal.isH1}
            title="Heading 1"
          >
            <Heading1 size={16} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => commands.toggleHeading("h2")}
            isActive={activeStatesLocal.isH2}
            title="Heading 2"
          >
            <Heading2 size={16} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => commands.toggleHeading("h3")}
            isActive={activeStatesLocal.isH3}
            title="Heading 3"
          >
            <Heading3 size={16} />
          </ToolbarButton>
        </div>

        <div className="flex items-center gap-1 border-r border-border-hr pr-2 mr-2">
          <ToolbarButton
            onClick={() => commands.toggleUnorderedList()}
            isActive={activeStatesLocal.unorderedList}
            title="Bullet List"
          >
            <List size={16} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => commands.toggleOrderedList()}
            isActive={activeStatesLocal.orderedList}
            title="Numbered List"
          >
            <ListOrdered size={16} />
          </ToolbarButton>
        </div>

        <div className="flex items-center gap-1">
          <ToolbarButton
            onClick={() => commands.undo()}
            disabled={!activeStatesLocal.canUndo}
            title="Undo (Ctrl+Z)"
          >
            <Undo size={16} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => commands.redo()}
            disabled={!activeStatesLocal.canRedo}
            title="Redo (Ctrl+Y)"
          >
            <Redo size={16} />
          </ToolbarButton>
        </div>
      </div>

      {/* Editor */}
      <div className="border border-border-hr border-t-0 rounded-b-lg rich-text-editor-wrapper">
        <RichText
          placeholder={placeholder}
          className="min-h-[200px] px-3 py-2 bg-input text-text-primary text-sm outline-none focus-within:border-brand transition-colors"
          classNames={{
            container: "w-full",
            contentEditable:
              "min-h-[200px] focus:outline-none text-text-primary rich-text-content",
            placeholder: "text-text-secondary",
          }}
        />
      </div>
    </div>
  );
}

export default function RichTextEditor(props: RichTextEditorProps) {
  return (
    <Provider extensions={extensions}>
      <RichTextEditorContent {...props} />
    </Provider>
  );
}
