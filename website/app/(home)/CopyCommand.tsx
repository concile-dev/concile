'use client';

import { useState } from 'react';

// A copyable command pill for the final CTA (dev-friendly closer).
export function CopyCommand({ command }: { command: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      // clipboard blocked; ignore
    }
  }

  return (
    <button type="button" className="copycmd" onClick={copy} aria-label={`Copy: ${command}`}>
      <span className="copycmd-cmd">
        <span className="copycmd-d">$</span> {command}
      </span>
      <span className="copycmd-tag">{copied ? 'copied ✓' : 'copy'}</span>
    </button>
  );
}
