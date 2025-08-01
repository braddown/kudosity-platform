import type * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        // Refined translucent variants with gray undertones
        "translucent-blue":
          "border-blue-500/40 bg-blue-600/15 text-blue-700 hover:bg-blue-600/25 hover:border-blue-500/50 backdrop-blur-sm dark:border-blue-400/25 dark:bg-blue-500/8 dark:text-blue-300 dark:hover:bg-blue-500/15 dark:hover:border-blue-400/35",
        "translucent-green":
          "border-green-500/40 bg-green-600/15 text-green-700 hover:bg-green-600/25 hover:border-green-500/50 backdrop-blur-sm dark:border-green-400/25 dark:bg-green-500/8 dark:text-green-300 dark:hover:bg-green-500/15 dark:hover:border-green-400/35",
        "translucent-gray":
          "border-gray-500/40 bg-gray-600/15 text-gray-700 hover:bg-gray-600/25 hover:border-gray-500/50 backdrop-blur-sm dark:border-gray-400/25 dark:bg-gray-500/8 dark:text-gray-300 dark:hover:bg-gray-500/15 dark:hover:border-gray-400/35",
        "translucent-orange":
          "border-orange-500/40 bg-orange-600/15 text-orange-700 hover:bg-orange-600/25 hover:border-orange-500/50 backdrop-blur-sm dark:border-orange-400/25 dark:bg-orange-500/8 dark:text-orange-300 dark:hover:bg-orange-500/15 dark:hover:border-orange-400/35",
        "translucent-purple":
          "border-purple-500/40 bg-purple-600/15 text-purple-700 hover:bg-purple-600/25 hover:border-purple-500/50 backdrop-blur-sm dark:border-purple-400/25 dark:bg-purple-500/8 dark:text-purple-300 dark:hover:bg-purple-500/15 dark:hover:border-purple-400/35",
        "translucent-neutral":
          "border-slate-500/35 bg-slate-600/12 text-slate-700 hover:bg-slate-600/20 hover:border-slate-500/45 backdrop-blur-sm dark:border-slate-400/20 dark:bg-slate-500/6 dark:text-slate-300 dark:hover:bg-slate-500/12 dark:hover:border-slate-400/30",
        "translucent-yellow":
          "border-yellow-500/40 bg-yellow-600/15 text-yellow-700 hover:bg-yellow-600/25 hover:border-yellow-500/50 backdrop-blur-sm dark:border-yellow-400/25 dark:bg-yellow-500/8 dark:text-yellow-300 dark:hover:bg-yellow-500/15 dark:hover:border-yellow-400/35",
        "translucent-red":
          "border-red-500/40 bg-red-600/15 text-red-700 hover:bg-red-600/25 hover:border-red-500/50 backdrop-blur-sm dark:border-red-400/25 dark:bg-red-500/8 dark:text-red-300 dark:hover:bg-red-500/15 dark:hover:border-red-400/35",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
)

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
