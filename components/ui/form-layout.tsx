"use client"

import type * as React from "react"
import { cn } from "@/lib/utils"

interface FormLayoutProps {
  children: React.ReactNode
  className?: string
  columns?: 1 | 2
}

export function FormLayout({ children, className, columns = 2 }: FormLayoutProps) {
  return (
    <div className={cn("space-y-6", columns === 2 && "grid grid-cols-1 md:grid-cols-2 gap-6 space-y-0", className)}>
      {children}
    </div>
  )
}

interface FormSectionProps {
  children: React.ReactNode
  className?: string
  title?: string
  description?: string
  fullWidth?: boolean
}

export function FormSection({ children, className, title, description, fullWidth = false }: FormSectionProps) {
  return (
    <div
      className={cn(
        "glass-card p-6 rounded-lg",
        "bg-card/50 dark:bg-card/30",
        "border border-border/50",
        "backdrop-blur-md",
        fullWidth && "md:col-span-2",
        className,
      )}
    >
      {title && (
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
        </div>
      )}
      <div className="space-y-4">{children}</div>
    </div>
  )
}

interface FormFieldProps {
  children: React.ReactNode
  className?: string
  label?: string
  description?: string
  required?: boolean
}

export function FormField({ children, className, label, description, required = false }: FormFieldProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <label className="text-sm font-medium text-foreground">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </label>
      )}
      {children}
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
    </div>
  )
}
