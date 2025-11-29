import { useEffect, useRef } from "preact/hooks";
import { Signal } from "@preact/signals";

interface MonacoEditorProps {
  code: Signal<string>;
}

export default function MonacoEditor({ code }: MonacoEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const monacoRef = useRef<unknown>(null);

  useEffect(() => {
    if (typeof globalThis.window === "undefined" || !editorRef.current) return;

    // Load Monaco Editor from CDN
    const script = document.createElement("script");
    script.src =
      "https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs/loader.js";
    script.async = true;

    script.onload = () => {
      // @ts-ignore - Monaco loader
      globalThis.require.config({
        paths: {
          vs: "https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs",
        },
      });

      // @ts-ignore - Monaco loader
      globalThis.require(["vs/editor/editor.main"], () => {
        if (editorRef.current && !monacoRef.current) {
          // カスタム型定義を追加
          // @ts-ignore - Monaco global
          globalThis.monaco.languages.typescript.javascriptDefaults.addExtraLib(
            `
declare function moveRight(): void;
declare function moveLeft(): void;
declare function moveUp(): void;
declare function moveDown(): void;
            `,
            "ts:game-functions.d.ts",
          );

          // @ts-ignore - Monaco global
          globalThis.monaco.languages.typescript.typescriptDefaults.addExtraLib(
            `
declare function moveRight(): void;
declare function moveLeft(): void;
declare function moveUp(): void;
declare function moveDown(): void;
            `,
            "ts:game-functions.d.ts",
          );

          // @ts-ignore - Monaco global
          monacoRef.current = globalThis.monaco.editor.create(
            editorRef.current,
            {
              value: code.value,
              language: "typescript",
              theme: "vs-dark",
              automaticLayout: true,
              minimap: { enabled: true },
              fontSize: 18,
              lineNumbers: "on",
              roundedSelection: false,
              scrollBeyondLastLine: false,
              readOnly: false,
            },
          );

          // Listen for content changes
          // @ts-ignore - Monaco editor instance
          monacoRef.current.onDidChangeModelContent(() => {
            // @ts-ignore - Monaco editor instance
            code.value = monacoRef.current.getValue();
          });
        }
      });
    };

    document.head.appendChild(script);

    return () => {
      if (monacoRef.current) {
        // @ts-ignore - Monaco editor instance
        monacoRef.current.dispose();
        monacoRef.current = null;
      }
    };
  }, []);

  return (
    <div class="w-full h-full min-h-[300px]">
      <div
        ref={editorRef}
        class="rounded-box overflow-hidden h-full w-full border border-base-300"
        style={{ minHeight: "400px" }}
      />
    </div>
  );
}
