"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Input } from "./input";

export type AutocompleteOption = {
  value: string;
  label: string;
  meta?: string;
};

type AutocompleteProps = {
  name: string;
  value: string;
  options: AutocompleteOption[];
  label?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  isLoading?: boolean;
  emptyLabel?: string;
  onValueChange: (value: string) => void;
  onQueryChange?: (value: string) => void;
  onSelect?: (option: AutocompleteOption) => void;
};

export function Autocomplete({
  name,
  value,
  options,
  placeholder,
  required,
  disabled,
  isLoading,
  emptyLabel = "No matches",
  onValueChange,
  onQueryChange,
  onSelect
}: AutocompleteProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <Input
        name={name}
        value={value}
        required={required}
        disabled={disabled}
        placeholder={placeholder}
        autoComplete="off"
        onFocus={() => setIsOpen(true)}
        onChange={(event) => {
          onValueChange(event.target.value);
          onQueryChange?.(event.target.value);
          setIsOpen(true);
        }}
      />
      {isOpen && !disabled ? (
        <div className="absolute z-50 mt-1 max-h-52 w-full overflow-y-auto rounded-md border border-slate-700 bg-slate-950 py-1 shadow-xl">
          {isLoading ? (
            <div className="px-3 py-2 text-sm text-slate-400">Loading...</div>
          ) : options.length > 0 ? (
            options.map((option) => (
              <button
                key={`${option.value}-${option.meta ?? ""}`}
                type="button"
                className={cn(
                  "flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm text-slate-100 transition hover:bg-slate-800 focus:bg-slate-800 focus:outline-none",
                  option.value === value ? "bg-slate-800" : ""
                )}
                onClick={() => {
                  onValueChange(option.value);
                  onSelect?.(option);
                  setIsOpen(false);
                }}
              >
                <span className="truncate">{option.label}</span>
                {option.meta ? <span className="shrink-0 text-xs text-slate-500">{option.meta}</span> : null}
              </button>
            ))
          ) : (
            <div className="px-3 py-2 text-sm text-slate-400">{emptyLabel}</div>
          )}
        </div>
      ) : null}
    </div>
  );
}
