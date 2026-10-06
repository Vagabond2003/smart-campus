import { useId, useState } from "react";
import { Select as RSelect } from "radix-ui";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "../lib/cn";
import { usePresence } from "../lib/presence";

export interface SelectOption {
  value: string;
  label: string;
  hint?: string;
}

interface SelectProps {
  label: string;
  value: string;
  onValueChange: (v: string) => void;
  options: SelectOption[];
  className?: string;
  hideLabel?: boolean;
}

/** Labelled select. Changing it applies immediately; there is no separate Filter button. */
export function Select({ label, value, onValueChange, options, className, hideLabel }: SelectProps) {
  const [open, setOpen] = useState(false);
  const p = usePresence(open, 150);
  const id = useId();
  return (
    <div className={cn("min-w-0", className)}>
      <label id={id} className={cn("field-label", hideLabel && "sr-only")}>
        {label}
      </label>
      <RSelect.Root value={value} onValueChange={onValueChange} open={p.mounted} onOpenChange={setOpen}>
        <RSelect.Trigger
          aria-labelledby={id}
          className="field w-full justify-between text-left text-[0.875rem] font-[540] outline-none data-[placeholder]:text-ink-3"
        >
          <span className="truncate">
            <RSelect.Value />
          </span>
          <RSelect.Icon className="text-ink-3">
            <ChevronDown size={16} strokeWidth={1.75} />
          </RSelect.Icon>
        </RSelect.Trigger>
        <RSelect.Portal>
          <RSelect.Content
            position="popper"
            sideOffset={6}
            collisionPadding={12}
            className={cn("menu t-dropdown min-w-[var(--radix-select-trigger-width)] max-h-[min(22rem,var(--radix-select-content-available-height))]", p.className)}
            data-origin="top-left"
          >
            <RSelect.Viewport>
              {options.map((o) => (
                <RSelect.Item key={o.value} value={o.value} className="menu-item justify-between pr-2">
                  <span className="min-w-0">
                    <RSelect.ItemText>{o.label}</RSelect.ItemText>
                    {o.hint ? <span className="block text-2xs text-ink-3">{o.hint}</span> : null}
                  </span>
                  <RSelect.ItemIndicator>
                    <Check size={16} strokeWidth={2} className="text-primary" />
                  </RSelect.ItemIndicator>
                </RSelect.Item>
              ))}
            </RSelect.Viewport>
          </RSelect.Content>
        </RSelect.Portal>
      </RSelect.Root>
    </div>
  );
}
