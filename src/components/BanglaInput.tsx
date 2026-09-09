"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { transliterate, isRomanText } from "@/lib/bangla-phonetic";

interface BanglaInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value"> {
  value: string;
  onChange: (value: string) => void;
  /** Show a small hint below the input with the English text being typed */
  showHint?: boolean;
}

/**
 * A text input that automatically transliterates English/Roman text to Bengali.
 * Type "mamun" → "মামুন", "bangladesh" → "বাংলাদেশ"
 * 
 * Users can also type Bengali directly (e.g., with a Bengali keyboard).
 * The transliteration only activates when Roman characters are detected.
 */
export default function BanglaInput({ value, onChange, showHint = true, className, onKeyDown: externalOnKeyDown, ...props }: BanglaInputProps) {
  const [romanBuffer, setRomanBuffer] = useState("");
  const [isTypingRoman, setIsTypingRoman] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;

    // If the user cleared the field
    if (!newValue) {
      onChange("");
      setRomanBuffer("");
      setIsTypingRoman(false);
      return;
    }

    // Check if the latest character typed is Roman
    const lastChar = newValue.slice(-1);
    const isRoman = /[a-zA-Z]/.test(lastChar);

    if (isRoman) {
      // User is typing in Roman — accumulate the buffer
      if (!isTypingRoman) {
        // Starting a new Roman sequence
        setIsTypingRoman(true);
        setRomanBuffer(lastChar);
      } else {
        setRomanBuffer(prev => prev + lastChar);
      }

      // Convert the full Roman buffer to Bengali
      const currentRoman = isTypingRoman ? romanBuffer + lastChar : lastChar;
      const bengali = transliterate(currentRoman);

      // Replace the Roman portion with Bengali
      // Find where the Roman text starts in the current value
      const prefix = value; // Everything before the current Roman sequence
      if (!isTypingRoman) {
        onChange(prefix + bengali);
      } else {
        // Remove the previous transliteration and replace with updated one
        const prefixBeforeRoman = value.slice(0, value.length - transliterate(romanBuffer).length);
        onChange(prefixBeforeRoman + bengali);
      }
    } else if (lastChar === " " && isTypingRoman) {
      // Space pressed while typing Roman — finalize the current word
      setRomanBuffer("");
      setIsTypingRoman(false);
      onChange(value + " ");
    } else {
      // Non-Roman character (Bengali, number, space, etc.) — pass through
      setRomanBuffer("");
      setIsTypingRoman(false);
      onChange(newValue);
    }
  }, [value, onChange, romanBuffer, isTypingRoman]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && isTypingRoman && romanBuffer.length > 0) {
      e.preventDefault();
      const newBuffer = romanBuffer.slice(0, -1);
      setRomanBuffer(newBuffer);

      if (newBuffer.length === 0) {
        // Removed all Roman chars — go back to the prefix
        const prefixBeforeRoman = value.slice(0, value.length - transliterate(romanBuffer).length);
        onChange(prefixBeforeRoman);
        setIsTypingRoman(false);
      } else {
        const bengali = transliterate(newBuffer);
        const prefixBeforeRoman = value.slice(0, value.length - transliterate(romanBuffer).length);
        onChange(prefixBeforeRoman + bengali);
      }
    } else if (e.key === " " && isTypingRoman) {
      // Finalize
      setRomanBuffer("");
      setIsTypingRoman(false);
    }

    // Call the original onKeyDown if provided
    if (externalOnKeyDown) {
      externalOnKeyDown(e);
    }
  }, [isTypingRoman, romanBuffer, value, onChange, externalOnKeyDown]);

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        className={className}
        {...props}
      />
      {showHint && isTypingRoman && romanBuffer && (
        <div className="absolute -bottom-5 left-1 text-[10px] text-amber-500 dark:text-amber-400 font-mono">
          typing: {romanBuffer}
        </div>
      )}
    </div>
  );
}
