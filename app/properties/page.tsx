"use client"

import MainLayout from "@/components/MainLayout"
import PageLayout from "@/components/layouts/PageLayout"
import { PropertiesComponent } from "@/features/properties"
import { useRef } from "react"

export default function PropertiesPage() {
  const propertiesRef = useRef<{ handleAddCustomField: () => void; refreshData: () => void }>(null)

  const pageActions = [
    {
      label: "+ Add Property",
      onClick: () => {
        propertiesRef.current?.handleAddCustomField()
      },
      variant: "default" as const,
      className: "bg-blue-600 hover:bg-blue-700 text-white",
    },
  ]

  return (
    <MainLayout>
      <PageLayout title="Properties" description="Manage profile properties and custom fields" actions={pageActions}>
        <PropertiesComponent ref={propertiesRef} />
      </PageLayout>
    </MainLayout>
  )
}
