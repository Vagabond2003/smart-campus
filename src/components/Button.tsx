import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { Slot } from "radix-ui";
import { cn } from "../lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "quiet";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary: "bg-primary text-primary-ink hover:bg-primary-hover active:bg-primary-press",
  secondary: "bg-surface text-ink border border-line-strong hover:bg-surface-2 hover:border-ink-3/60",
  ghost: "text-ink-2 hover:bg-surface-2 hover:text-ink",
  quiet: "bg-surface-2 text-ink hover:bg-surface-3",
  danger: "bg-danger text-white hover:brightness-110 dark:text-[#1c0b0a]",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-sm gap-1.5 rounded-md relative after:absolute after:-inset-1 after:content-['']",
  md: "h-10 px-4 text-[0.875rem] gap-2 rounded-md",
  lg: "h-12 px-5 text-base gap-2 rounded-md",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  asChild?: boolean;
  /** Turn off the 0.96 press scale where motion would distract (repeated controls). */
  static?: boolean;
  icon?: ReactNode;
  trailing?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", asChild, static: isStatic, icon, trailing, className, children, ...rest },
  ref,
) {
  const Comp = asChild ? Slot.Root : "button";
  return (
    <Comp
      ref={ref}
      className={cn(
        "inline-flex select-none items-center justify-center whitespace-nowrap font-[570] no-underline",
        "transition-[background-color,color,border-color,scale,filter] duration-150 ease-out",
        !isStatic && "active:scale-[0.96]",
        "disabled:pointer-events-none disabled:opacity-45",
        variants[variant],
        sizes[size],
        className,
      )}
      {...rest}
    >
      {asChild ? (
        children
      ) : (
        <>
          {icon}
          {children}
          {trailing}
        </>
      )}
    </Comp>
  );
});

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  tone?: "default" | "rail" | "board";
  size?: "sm" | "md";
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { label, tone = "default", size = "md", className, children, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      aria-label={label}
      className={cn(
        "relative inline-grid shrink-0 place-items-center rounded-md transition-[background-color,color,scale] duration-150 ease-out active:scale-[0.96]",
        size === "md" ? "size-10" : "size-8 after:absolute after:-inset-1 after:content-['']",
        tone === "default" && "text-ink-2 hover:bg-surface-2 hover:text-ink",
        tone === "rail" && "text-rail-ink hover:bg-rail-hover",
        tone === "board" && "text-board-text/80 hover:bg-board-2 hover:text-board-text",
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
});
