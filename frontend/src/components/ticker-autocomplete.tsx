"use client";

/**
 * Ticker input with a debounced symbol/company-name suggestion dropdown.
 *
 * Shared by BuyStockDialog and AddSymbolDialog, which each already resolve
 * a single exact ticker on debounce (price/quote preview) — this adds the
 * "suggest matches while typing" step in front of that, via
 * GET /market-data/search.
 */

import { useEffect, useRef, useState, useTransition } from "react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { SymbolSuggestion } from "@/types/market-data";

type SearchResult = {
  success: boolean;
  results?: SymbolSuggestion[];
  error?: string;
};

type TickerAutocompleteProps = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  onSelect?: (suggestion: SymbolSuggestion) => void;
  search: (query: string) => Promise<SearchResult>;
  placeholder?: string;
  autoFocus?: boolean;
  required?: boolean;
  disabled?: boolean;
  maxLength?: number;
  className?: string;
};

export function TickerAutocomplete({
  id,
  value,
  onChange,
  onSelect,
  search,
  placeholder = "AAPL",
  autoFocus,
  required,
  disabled,
  maxLength = 20,
  className,
}: TickerAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<SymbolSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const [, startTransition] = useTransition();
  const containerRef = useRef<HTMLDivElement>(null);
  // Selecting a suggestion sets `value` to that exact ticker — skip the
  // fetch that would otherwise immediately re-open the dropdown.
  const skipNextFetch = useRef(false);

  useEffect(() => {
    const trimmed = value.trim();

    if (skipNextFetch.current) {
      skipNextFetch.current = false;
      return;
    }

    if (!trimmed) {
      setSuggestions([]);
      setOpen(false);
      return;
    }

    const timeout = setTimeout(() => {
      startTransition(async () => {
        const result = await search(trimmed);
        const results = result.success ? (result.results ?? []) : [];
        setSuggestions(results);
        setOpen(results.length > 0);
        setHighlighted(0);
      });
    }, 200);

    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `search` is a stable server action reference per caller
  }, [value]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function selectSuggestion(suggestion: SymbolSuggestion) {
    skipNextFetch.current = true;
    onChange(suggestion.symbol);
    onSelect?.(suggestion);
    setOpen(false);
    setSuggestions([]);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || suggestions.length === 0) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlighted((prev) => (prev + 1) % suggestions.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlighted(
        (prev) => (prev - 1 + suggestions.length) % suggestions.length,
      );
    } else if (event.key === "Enter") {
      if (suggestions[highlighted]) {
        event.preventDefault();
        selectSuggestion(suggestions[highlighted]);
      }
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <Input
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        required={required}
        disabled={disabled}
        maxLength={maxLength}
        autoComplete="off"
        role="combobox"
        aria-expanded={open}
        aria-autocomplete="list"
        className={className}
      />

      {open && suggestions.length > 0 && (
        <ul
          role="listbox"
          className="absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border bg-popover p-1 text-popover-foreground shadow-md ring-1 ring-foreground/10"
        >
          {suggestions.map((suggestion, index) => (
            <li key={suggestion.symbol} role="option" aria-selected={index === highlighted}>
              <button
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => selectSuggestion(suggestion)}
                onMouseEnter={() => setHighlighted(index)}
                className={cn(
                  "flex w-full items-center justify-between gap-3 rounded-md px-2 py-1.5 text-left text-sm",
                  index === highlighted && "bg-muted",
                )}
              >
                <span className="font-medium">{suggestion.symbol}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {suggestion.name}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
