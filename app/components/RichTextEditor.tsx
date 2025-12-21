"use client";

import { useEffect, useRef, useState } from "react";

// Import Quill CSS
// @ts-ignore - CSS import
import "quill/dist/quill.snow.css";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = "Enter text...",
  disabled = false,
  className = "",
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const quillInstanceRef = useRef<any>(null);
  const lastValueRef = useRef<string>(value);
  const isUpdatingFromPropRef = useRef(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let isMounted = true;

    // Dynamically import Quill
    const initQuill = async () => {
      try {
        const QuillModule = await import("quill");
        const Quill = QuillModule.default;

        // Wait for the ref to be attached to the DOM
        const waitForRef = () => {
          return new Promise<void>((resolve) => {
            if (editorRef.current) {
              resolve();
            } else {
              const checkInterval = setInterval(() => {
                if (editorRef.current) {
                  clearInterval(checkInterval);
                  resolve();
                }
              }, 10);
              // Timeout after 1 second
              setTimeout(() => {
                clearInterval(checkInterval);
                resolve();
              }, 1000);
            }
          });
        };

        await waitForRef();

        // Wait for next frame to ensure DOM is ready
        await new Promise((resolve) => requestAnimationFrame(resolve));

        if (!isMounted || !editorRef.current || quillInstanceRef.current) {
          return;
        }

        // Clear the container before initializing
        if (editorRef.current) {
          editorRef.current.innerHTML = "";
        }

        // Initialize Quill - ensure it's editable
        const quill = new Quill(editorRef.current!, {
          theme: "snow",
          placeholder: placeholder,
          readOnly: disabled,
          modules: {
            toolbar: [
              [{ header: [1, 2, 3, false] }],
              ["bold", "italic", "underline"],
              [{ align: [] }],
              [{ list: "ordered" }, { list: "bullet" }],
              ["undo", "redo"],
            ],
            history: {
              delay: 1000,
              maxStack: 50,
              userOnly: false,
            },
          },
        });

        // Ensure editor is enabled
        quill.enable(!disabled);

        quillInstanceRef.current = quill;

        // Set initial value
        if (value) {
          const delta = quill.clipboard.convert({ html: value });
          quill.setContents(delta, "silent");
          lastValueRef.current = value;
        }

        // Listen for text changes
        quill.on("text-change", () => {
          if (isUpdatingFromPropRef.current) {
            isUpdatingFromPropRef.current = false;
            return;
          }

          const html = quill.root.innerHTML;
          // Quill returns "<p><br></p>" for empty content, normalize to empty string
          const normalizedHtml = html === "<p><br></p>" ? "" : html;

          if (normalizedHtml !== lastValueRef.current) {
            lastValueRef.current = normalizedHtml;
            onChange(normalizedHtml);
          }
        });

        setIsMounted(true);
      } catch (error) {
        console.error("Error initializing Quill:", error);
        setIsMounted(true); // Set mounted even on error to show the container
      }
    };

    initQuill();

    // Cleanup
    return () => {
      isMounted = false;
      if (quillInstanceRef.current) {
        quillInstanceRef.current = null;
      }
    };
  }, []); // Only run once on mount

  // Handle external value changes (e.g., form reset)
  useEffect(() => {
    if (!quillInstanceRef.current || value === lastValueRef.current) return;

    isUpdatingFromPropRef.current = true;
    const quill = quillInstanceRef.current;
    const delta = quill.clipboard.convert({ html: value || "" });
    quill.setContents(delta, "silent");
    lastValueRef.current = value || "";
  }, [value]);

  // Handle disabled state changes
  useEffect(() => {
    if (!quillInstanceRef.current) return;
    quillInstanceRef.current.enable(!disabled);
  }, [disabled]);

  // Handle placeholder changes
  useEffect(() => {
    if (!quillInstanceRef.current) return;
    const root = quillInstanceRef.current.root;
    if (root) {
      root.setAttribute("data-placeholder", placeholder);
    }
  }, [placeholder]);

  return (
    <div
      className={`rich-text-editor flex flex-col flex-1 min-h-0 ${className}`}
    >
      <div className="border border-border-hr rounded-lg rich-text-editor-wrapper relative flex flex-col flex-1 min-h-0">
        {!isMounted && (
          <div className="min-h-[200px] px-3 py-2 bg-input text-text-primary text-sm flex items-center justify-center absolute inset-0 z-10 rounded-lg">
            <span className="text-text-secondary">Loading editor...</span>
          </div>
        )}
        <div
          ref={editorRef}
          className="rich-text-content flex-1 min-h-0"
          style={{
            opacity: isMounted ? 1 : 0,
          }}
        />
      </div>
    </div>
  );
}
