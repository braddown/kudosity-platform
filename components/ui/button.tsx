import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground dark:text-white hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground dark:text-white hover:bg-destructive/90",
        outline:
          "perplexity-button backdrop-blur-md " +
          "border border-border bg-background/60 dark:bg-white/[0.03] dark:border-white/[0.08] " +
          "hover:bg-background/80 dark:hover:bg-white/[0.06] hover:border-border " +
          "hover:transform hover:-translate-y-0.5 " +
          "text-foreground dark:text-white",
        secondary:
          "perplexity-button backdrop-blur-md " +
          "bg-secondary/50 dark:bg-white/[0.05] " +
          "hover:bg-secondary/70 dark:hover:bg-white/[0.08] " +
          "text-secondary-foreground dark:text-white",
        ghost: "hover:bg-accent hover:text-accent-foreground dark:text-white dark:hover:text-white",
        link: "text-primary dark:text-white underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
  },
)
Button.displayName = "Button"

export { Button, buttonVariants }
