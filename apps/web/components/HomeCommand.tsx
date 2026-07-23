"use client";

import { useState } from "react";
import { beacon } from "@/lib/beacon";
import { cardTheme as t } from "./cardTheme";

// The install command with a one-click copy. Copy attempts (success or
// failure) fire command_copy — the leading signal for C17.
export function HomeCommand() {
  const [copied, setCopied] = useState<"idle" | "ok" | "fail">("idle");

  async function onCopy() {
    beacon("command_copy");
    try {
      await navigator.clipboard.writeText("npx aieracard");
      setCopied("ok");
    } catch {
      setCopied("fail");
    }
    window.setTimeout(() => setCopied("idle"), 1800);
  }

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "stretch",
        borderRadius: t.panelRadius,
        overflow: "hidden",
        border: `1px solid ${t.chipBg}`,
        background: t.panel,
      }}
    >
      <code
        style={{
          fontFamily: t.mono,
          fontSize: 16,
          color: t.text,
          padding: "14px 18px",
        }}
      >
        npx aieracard
      </code>
      <button
        type="button"
        onClick={onCopy}
        aria-label="Copy install command"
        style={{
          fontFamily: t.mono,
          fontSize: 13,
          color: copied === "fail" ? "#e5687f" : t.accent,
          background: "transparent",
          border: "none",
          borderLeft: `1px solid ${t.chipBg}`,
          padding: "0 16px",
          cursor: "pointer",
          minWidth: 76,
        }}
      >
        {copied === "ok" ? "copied" : copied === "fail" ? "select it" : "copy"}
      </button>
    </div>
  );
}
