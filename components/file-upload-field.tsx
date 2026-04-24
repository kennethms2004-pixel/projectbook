"use client";

import * as React from "react";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";

type FileUploadFieldProps = {
  accept: string;
  buttonLabel: string;
  helperText: string;
  icon: React.ReactNode;
  value: File | null;
  disabled?: boolean;
  onChange: (file: File | null) => void;
};

function formatFileSize(size: number) {
  if (size < 1024 * 1024) {
    return `${Math.round(size / 1024)}KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)}MB`;
}

export function FileUploadField({
  accept,
  buttonLabel,
  helperText,
  icon,
  value,
  disabled,
  onChange,
}: FileUploadFieldProps) {
  const inputId = React.useId();
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (!value && inputRef.current) {
      inputRef.current.value = "";
    }
  }, [value]);

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={accept}
        className="sr-only"
        disabled={disabled}
        onChange={(event) => onChange(event.target.files?.[0] ?? null)}
      />

      <label
        htmlFor={inputId}
        className={cn(
          "block cursor-pointer rounded-[1.6rem] border border-[#e4d8c7] bg-white px-6 py-10 shadow-[0_12px_28px_rgba(79,63,43,0.05)] transition-colors",
          !disabled && "hover:border-[#ccb9a2]",
          disabled && "cursor-not-allowed opacity-70"
        )}
      >
        <div className="flex flex-col items-center gap-4 text-center">
          <span className="flex size-16 items-center justify-center rounded-full bg-[#f8f1e7] text-[#7c6a58]">
            {icon}
          </span>

          <div className="space-y-1.5">
            <p className="text-xl font-semibold text-[#44372e]">
              {value ? value.name : buttonLabel}
            </p>
            <p className="text-sm leading-6 text-[#8a7e73]">
              {value ? `Selected file • ${formatFileSize(value.size)}` : helperText}
            </p>
          </div>
        </div>
      </label>

      {value ? (
        <button
          type="button"
          onClick={() => onChange(null)}
          className="inline-flex items-center gap-2 rounded-full border border-[#dccfbe] bg-[#fffaf3] px-3 py-1.5 text-sm font-medium text-[#6c5648] transition-colors hover:border-[#c8b8a5] hover:text-[#3d485e]"
        >
          <X className="size-3.5" aria-hidden />
          Remove file
        </button>
      ) : null}
    </div>
  );
}
