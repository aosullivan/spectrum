"use client";

import Editor, { type OnMount } from "@monaco-editor/react";
import { useCallback } from "react";

type Props = {
  value: string;
  onChange: (value: string) => void;
  onCompile: () => void;
};

export function CodeEditor({ value, onChange, onCompile }: Props) {
  const handleMount: OnMount = useCallback(
    (editor, monaco) => {
      editor.addCommand(
        monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter,
        () => onCompile(),
      );
    },
    [onCompile],
  );

  return (
    <Editor
      height="100%"
      defaultLanguage="c"
      theme="vs-dark"
      value={value}
      onChange={(v) => onChange(v ?? "")}
      onMount={handleMount}
      options={{
        fontSize: 13,
        fontFamily:
          "var(--font-geist-mono), ui-monospace, SFMono-Regular, Menlo, monospace",
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        wordWrap: "on",
        smoothScrolling: true,
        cursorBlinking: "smooth",
        renderWhitespace: "selection",
        tabSize: 4,
      }}
    />
  );
}
