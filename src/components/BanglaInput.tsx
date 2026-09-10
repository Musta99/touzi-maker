"use client";

import { useState, useCallback, useRef } from "react";
import { transliterate } from "@/lib/bangla-phonetic";
import { Languages } from "lucide-react";

interface BanglaInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value"> {
  value: string;
  onChange: (value: string) => void;
  /** Show a small hint below the input with the English text being typed */
  showHint?: boolean;
}

/**
 * A text input that supports both automatic English→Bengali transliteration (e.g. "uttar" → "উত্তর")
 * AND raw English mode (e.g. "3A/4B"). Includes a quick toggle button right inside the input field.
 */
export default function BanglaInput({
  value,
  onChange,
  showHint = true,
  className,
  onKeyDown: externalOnKeyDown,
  ...props
}: BanglaInputProps) {
  const [mode, setMode] = useState<"bangla" | "english">("bangla");
  const [romanBuffer, setRomanBuffer] = useState("");
  const [isTypingRoman, setIsTypingRoman] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const toggleMode = () => {
    setMode((prev) => (prev === "bangla" ? "english" : "bangla"));
    setRomanBuffer("");
    setIsTypingRoman(false);
  };

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;

      // If in English literal mode, bypass transliteration completely
      if (mode === "english") {
        setRomanBuffer("");
        setIsTypingRoman(false);
        onChange(newValue);
        return;
      }

      // ── BANGLA MODE TRANSLITERATION ─────────────────────────────────
      if (!newValue) {
        onChange("");
        setRomanBuffer("");
        setIsTypingRoman(false);
        return;
      }

      if (newValue.length < (value || "").length && !isTypingRoman) {
        setRomanBuffer("");
        setIsTypingRoman(false);
        onChange(newValue);
        return;
      }

      const lastChar = newValue.slice(-1);
      const isRoman = /[a-zA-Z]/.test(lastChar);

      if (isRoman) {
        const nextBuffer = isTypingRoman ? romanBuffer + lastChar : lastChar;
        setIsTypingRoman(true);
        setRomanBuffer(nextBuffer);

        const bengali = transliterate(nextBuffer);
        const prefixBeforeRoman = isTypingRoman
          ? (value || "").slice(
              0,
              Math.max(0, (value || "").length - transliterate(romanBuffer).length)
            )
          : (value || "");

        onChange(prefixBeforeRoman + bengali);
      } else {
        setRomanBuffer("");
        setIsTypingRoman(false);
        onChange(newValue);
      }
    },
    [value, onChange, romanBuffer, isTypingRoman, mode]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (mode === "bangla" && e.key === "Backspace") {
        if (isTypingRoman && romanBuffer.length > 0) {
          e.preventDefault();
          const newBuffer = romanBuffer.slice(0, -1);
          setRomanBuffer(newBuffer);

          const currentTransliterated = transliterate(romanBuffer);
          const prefixBeforeRoman = (value || "").slice(
            0,
            Math.max(0, (value || "").length - currentTransliterated.length)
          );

          if (newBuffer.length === 0) {
            setIsTypingRoman(false);
            onChange(prefixBeforeRoman);
          } else {
            const bengali = transliterate(newBuffer);
            onChange(prefixBeforeRoman + bengali);
          }
        } else {
          setRomanBuffer("");
          setIsTypingRoman(false);
        }
      }

      if (externalOnKeyDown) {
        externalOnKeyDown(e);
      }
    },
    [isTypingRoman, romanBuffer, value, onChange, externalOnKeyDown, mode]
  );

  return (
    <div className="relative flex items-center">
      <input
        ref={inputRef}
        type="text"
        value={value || ""}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        className={`${className} pr-20`}
        {...props}
      />

      {/* Mode Switcher Badge */}
      <button
        type="button"
        onClick={toggleMode}
        title={
          mode === "bangla"
            ? "Click to switch to English input (e.g. 3A/4B)"
            : "Click to switch to Bangla phonetic input (e.g. নিচ সোজা বাম)"
        }
        className={`absolute right-2 px-2 py-0.5 text-[11px] font-semibold rounded-md flex items-center gap-1 transition-all ${
          mode === "bangla"
            ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 hover:bg-green-200"
            : "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 hover:bg-blue-200"
        }`}
      >
        <Languages className="w-3 h-3" />
        {mode === "bangla" ? "বাংলা" : "ENG"}
      </button>

      {showHint && mode === "bangla" && isTypingRoman && romanBuffer && (
        <div className="absolute -bottom-5 left-1 text-[10px] text-amber-500 dark:text-amber-400 font-mono pointer-events-none">
          typing: {romanBuffer}
        </div>
      )}
    </div>
  );
}


