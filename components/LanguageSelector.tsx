"use client"

import type { LanguageOption, SarvamLanguageCode } from "@/types"

type LanguageSelectorProps = {
  value: SarvamLanguageCode
  onChange: (value: SarvamLanguageCode) => void
  options: LanguageOption[]
  disabled?: boolean
}

export function LanguageSelector({
  value,
  onChange,
  options,
  disabled = false,
}: LanguageSelectorProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label
          htmlFor="language-code"
          className="text-xs uppercase tracking-[0.3em] text-muted-foreground"
        >
          Language
        </label>
        <span className="text-xs text-muted-foreground">
          Leave on auto-detect if unsure
        </span>
      </div>
      <select
        id="language-code"
        value={value}
        onChange={(event) => onChange(event.target.value as SarvamLanguageCode)}
        disabled={disabled}
        className="h-12 w-full border border-border bg-card px-4 text-sm outline-none transition focus:border-foreground/40 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )
}
