// src/components/MedicalField.tsx
import { useState, type ReactNode } from "react";

type Props = {
  label: string;
  children: ReactNode;
};

export default function MedicalField({ label, children }: Props) {
  const [copied, setCopied] = useState(false);

  const text =
    typeof children === "string" || typeof children === "number"
      ? String(children)
      : "";

  async function handleCopy() {
    if (!text) return;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error("copy error:", err);
    }
  }

  return (
    <div className="medical-field">
      <div className="medical-field__header">
        <div className="medical-field__label">{label}</div>
        {text && (
          <button
            type="button"
            className="medical-field__copy"
            onClick={handleCopy}
            title="Скопировать"
          >
            {copied ? "✓ Скопировано" : "Копировать"}
          </button>
        )}
      </div>
      <div className="medical-field__value">{children}</div>
    </div>
  );
}
