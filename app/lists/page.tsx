"use client"

import { PlusCircle } from "lucide-react"
import MainLayout from "@/components/MainLayout"
import ListsComponent from "@/components/ListsComponent"
import PageLayout from "@/components/layouts/PageLayout"

export default function ListsPage() {
  const handleCreateList = () => {
    // This will be handled by the ListsComponent via window object (same pattern as segments)
    if (typeof window !== "undefined" && (window as any).createNewList) {
      ;(window as any).createNewList()
    }
  }

  const pageActions = [
    {
      label: "Create List",
      icon: <PlusCircle className="h-4 w-4" />,
      onClick: handleCreateList,
      variant: "default" as const,
      className: "bg-blue-600 hover:bg-blue-700 text-white",
    },
  ]

  return (
    <MainLayout>
      <PageLayout title="Lists" actions={pageActions}>
        <div className="w-full overflow-auto">
          <ListsComponent />
        </div>
      </PageLayout>
    </MainLayout>
  )
}