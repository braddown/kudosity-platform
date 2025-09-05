"use client"

import MainLayout from "@/components/MainLayout"
import { DataSources } from "@/features/settings"
import PageLayout from "@/components/layouts/PageLayout"
import { Plus, Upload } from "lucide-react"
import { logger } from "@/lib/utils/logger"

export default function DataSourcesPage() {
  const handleCreateDataSource = () => {
    logger.debug("Creating new data source")
    // Add navigation or modal logic here
  }

  const handleImportData = () => {
    logger.debug("Importing data")
    // Add import logic here
  }

  const pageActions = [
    {
      label: "Import Data",
      icon: <Upload className="h-4 w-4" />,
      onClick: handleImportData,
      variant: "outline" as const,
    },
    {
      label: "Add Data Source",
      icon: <Plus className="h-4 w-4" />,
      onClick: handleCreateDataSource,
      variant: "default" as const,
      className: "bg-blue-600 hover:bg-blue-700 text-white",
    },
  ]

  return (
    <MainLayout>
      <PageLayout title="Data Sources" actions={pageActions}>
        <div className="p-6 w-full overflow-auto">
          <DataSources />
        </div>
      </PageLayout>
    </MainLayout>
  )
}
