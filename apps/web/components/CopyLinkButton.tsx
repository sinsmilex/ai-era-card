"use client";

import { useState } from "react";

export function CopyLinkButton({
  url,
  accent,
  panel,
  ink,
}: {
  url: string;
  accent: string;
  panel: string;
  ink: string;
}) {
  const [copied, setCopied] = useState(false);

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // ignore — some browsers block clipboard without gesture/permissions
    }
  }

  return (
    <button
      type="button"
      onClick={onCopy}
      style={{
        color: ink,
        background: panel,
        border: `1px solid ${accent}44`,
        padding: "10px 18px",
        borderRadius: 8,
        fontSize: 14,
        fontFamily: "inherit",
        cursor: "pointer",
      }}
    >
      {copied ? "Copied" : "Copy link"}
    </button>
  );
}
