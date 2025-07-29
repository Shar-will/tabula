import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils"

// Split base classes into logical groups for better readability
const baseClasses = {
  // Layout and positioning
  layout: "inline-flex items-center justify-center gap-2 shrink-0",
  
  // Typography
  typography: "text-sm font-medium whitespace-nowrap",
  
  // Visual styling
  visual: "rounded-md outline-none",
  
  // Interactive states
  states: "transition-all disabled:pointer-events-none disabled:opacity-50",
  
  // Focus and accessibility
  focus: "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
  
  // SVG handling
  svg: "[&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0",
  
  // Validation states
  validation: "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive"
}

const buttonVariants = cva(
  // Join all base classes together
  Object.values(baseClasses).join(" "),
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80",
        ghost:
          "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        // Provide fallback padding for browsers without :has() support
        default: "h-9 px-3 py-2 @supports(selector(:has(*))):has-[>svg]:px-3 @supports not (selector(:has(*))):px-4",
        sm: "h-8 rounded-md gap-1.5 px-2.5 @supports(selector(:has(*))):has-[>svg]:px-2.5 @supports not (selector(:has(*))):px-3",
        lg: "h-10 rounded-md px-4 @supports(selector(:has(*))):has-[>svg]:px-4 @supports not (selector(:has(*))):px-6",
        icon: "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({
  className,
  variant,
  size,
  asChild = false,
  ...props
}, ref) => {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      ref={ref}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props} />
  );
})

Button.displayName = "Button"

export { Button, buttonVariants }
