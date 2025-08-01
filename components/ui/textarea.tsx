"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-[80px] w-full rounded-md px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        // Improved glass morphism with better light mode contrast
        "perplexity-button backdrop-blur-md",
        "border border-border/60 bg-background/60 dark:bg-white/[0.03] dark:border-white/[0.08]",
        "hover:bg-background/80 dark:hover:bg-white/[0.06] hover:border-border/80",
        "focus:bg-background/90 dark:focus:bg-white/[0.08] focus:border-border/90",
        "transition-all duration-200 ease-out",
        className,
      )}
      ref={ref}
      {...props}
    />
  )
})
Textarea.displayName = "Textarea"

export { Textarea }
