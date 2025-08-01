import { Button } from "@/components/ui/button"
import type { LucideIcon } from "lucide-react"
import type { ButtonHTMLAttributes, ReactNode } from "react"

interface ActionButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: LucideIcon
  children: ReactNode
  variant?: "default" | "outline" | "destructive"
}

export function ActionButton({
  icon: Icon,
  children,
  variant = "default",
  className = "",
  ...props
}: ActionButtonProps) {
  // Base styles for all variants
  const baseStyles = "text-sm px-4 py-2 rounded-md whitespace-nowrap"

  // Variant-specific styles
  const variantStyles = {
    default: "bg-[#2563EB] hover:bg-[#1d4ed8] text-white",
    outline: "bg-white text-gray-700 border border-gray-300 hover:bg-gray-100",
    destructive: "bg-red-600 hover:bg-red-700 text-white",
  }

  const buttonStyles = `${baseStyles} ${variantStyles[variant]} ${className}`

  return (
    <Button className={buttonStyles} {...props}>
      {Icon && <Icon className="mr-2 h-4 w-4" />}
      {children}
    </Button>
  )
}
