"use client"
import { Users, UserCheck, UserCog, UserX, UserMinus, Trash2 } from "lucide-react"

interface ProfileCountsProps {
  counts: {
    all: number
    active: number
    marketing: number
    suppressed: number
    unsubscribed: number
    deleted: number
  }
  selectedType: string
  onTypeClick: (type: string) => void
}

export function ProfileCounts({ counts, selectedType, onTypeClick }: ProfileCountsProps) {
  const cards = [
    {
      title: "All Profiles",
      count: counts.all,
      icon: <Users className="h-5 w-5" />,
      type: "all",
      color: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
      borderColor: "border-blue-500/20",
      textColor: "text-blue-600 dark:text-blue-400",
    },
    {
      title: "Active",
      count: counts.active,
      icon: <UserCheck className="h-5 w-5" />,
      type: "active",
      color: "bg-green-500/10 text-green-600 dark:text-green-400",
      borderColor: "border-green-500/20",
      textColor: "text-green-600 dark:text-green-400",
    },
    {
      title: "Marketing",
      count: counts.marketing,
      icon: <UserCog className="h-5 w-5" />,
      type: "marketing",
      color: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
      borderColor: "border-orange-500/20",
      textColor: "text-orange-600 dark:text-orange-400",
    },
    {
      title: "Suppressed",
      count: counts.suppressed,
      icon: <UserMinus className="h-5 w-5" />,
      type: "suppressed",
      color: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
      borderColor: "border-yellow-500/20",
      textColor: "text-yellow-600 dark:text-yellow-400",
    },
    {
      title: "Unsubscribed",
      count: counts.unsubscribed,
      icon: <UserX className="h-5 w-5" />,
      type: "unsubscribed",
      color: "bg-red-500/10 text-red-600 dark:text-red-400",
      borderColor: "border-red-500/20",
      textColor: "text-red-600 dark:text-red-400",
    },
    {
      title: "Deleted",
      count: counts.deleted,
      icon: <Trash2 className="h-5 w-5" />,
      type: "deleted",
      color: "bg-gray-500/10 text-gray-600 dark:text-gray-400",
      borderColor: "border-gray-500/20",
      textColor: "text-gray-600 dark:text-gray-400",
    },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
      {cards.map((card) => (
        <button
          key={card.type}
          onClick={() => onTypeClick(card.type)}
          className={`
            p-4 rounded-lg border transition-all duration-200 text-left hover:shadow-md
            ${
              selectedType === card.type
                ? `${card.color} ${card.borderColor} ring-2 ring-offset-2 ring-offset-background`
                : "bg-card hover:bg-accent border-border"
            }
          `}
        >
          <div className="flex items-center justify-between mb-2">
            <div className={`p-2 rounded-lg ${card.color}`}>{card.icon}</div>
          </div>
          <div className="space-y-1">
            <p className={`text-2xl font-bold ${selectedType === card.type ? card.textColor : "text-foreground"}`}>
              {card.count.toLocaleString()}
            </p>
            <p className={`text-sm ${selectedType === card.type ? card.textColor : "text-muted-foreground"}`}>
              {card.title}
            </p>
          </div>
        </button>
      ))}
    </div>
  )
}
