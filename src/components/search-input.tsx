import React from "react"
import { cx } from "../utils/cx"
import { IconButton } from "./icon-button"
import { ClearIcon16, SearchIcon16 } from "./icons"
import { Keys } from "./keys"

type SearchInputProps = Omit<React.ComponentPropsWithoutRef<"input">, "onChange"> & {
  shortcut?: string[]
  onChange?: (value: string) => void
}

export function SearchInput({
  shortcut = ["⌘", "F"],
  placeholder = "Search…",
  onChange,
  ...props
}: SearchInputProps) {
  const ref = React.useRef<HTMLInputElement>(null)
  return (
    <div className="relative">
      <div className="absolute inset-y-0 left-0 grid aspect-square place-items-center text-text-secondary">
        <SearchIcon16 />
      </div>
      <input
        ref={ref}
        className={cx(
          "focus-ring h-10 w-full rounded-md bg-bg-secondary pl-10 [-webkit-appearance:none] [font-variant-numeric:inherit] placeholder:text-text-secondary hover:bg-bg-tertiary focus-visible:bg-bg coarse:h-12 coarse:pl-12",
          props.value ? "pr-10 coarse:pr-12" : "pr-3 coarse:pr-4",
        )}
        type="search"
        placeholder={placeholder}
        onChange={(e) => onChange?.(e.target.value)}
        {...props}
      />
      {shortcut && !props.value ? (
        <div
          aria-hidden
          className="absolute inset-y-0 right-0 flex items-center pr-3 coarse:hidden"
        >
          <Keys keys={shortcut} />
        </div>
      ) : null}
      {props.value ? (
        <div
          aria-hidden
          className="absolute inset-y-0 right-0 grid aspect-square place-items-center"
        >
          <IconButton
            aria-label="Clear"
            tabIndex={-1}
            onClick={() => {
              onChange?.("")
              ref.current?.focus()
            }}
          >
            <ClearIcon16 />
          </IconButton>
        </div>
      ) : null}
    </div>
  )
}
