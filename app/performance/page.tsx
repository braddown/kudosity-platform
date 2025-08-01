import MainLayout from "@/components/MainLayout"
import PerformanceClientWrapper from "@/components/PerformanceClientWrapper"
import PageLayout from "@/components/layouts/PageLayout"
import { Download, RefreshCw } from "lucide-react"

export default function PerformancePage() {
  const handleExportReport = () => {
    console.log("Exporting performance report")
    // Add export logic here
  }

  const handleRefreshData = () => {
    console.log("Refreshing performance data")
    // Add refresh logic here
  }

  const pageActions = [
    {
      label: "Refresh",
      icon: <RefreshCw className="h-4 w-4" />,
      onClick: handleRefreshData,
      variant: "outline" as const,
    },
    {
      label: "Export Report",
      icon: <Download className="h-4 w-4" />,
      onClick: handleExportReport,
      variant: "default" as const,
      className: "bg-blue-600 hover:bg-blue-700 text-white",
    },
  ]

  return (
    <MainLayout>
      <PageLayout title="Performance" actions={pageActions}>
        <PerformanceClientWrapper />
      </PageLayout>
    </MainLayout>
  )
}
