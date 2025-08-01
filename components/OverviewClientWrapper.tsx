"use client"

import PageLayout from "@/components/layouts/PageLayout"
import Overview from "@/components/Overview"
import { Download } from "lucide-react"

interface OverviewClientWrapperProps {
  data: any
}

export default function OverviewClientWrapper({ data }: OverviewClientWrapperProps) {
  const handleExportData = () => {
    console.log("Exporting overview data...")
    // TODO: Implement actual export functionality
  }

  return (
    <PageLayout
      title="Overview"
      description="Monitor your campaign performance and key metrics"
      actions={[
        {
          label: "Export Data",
          icon: <Download className="h-4 w-4" />,
          onClick: handleExportData,
          variant: "default",
        },
      ]}
    >
      <Overview data={data} />
    </PageLayout>
  )
}