import MainLayout from "@/components/MainLayout"
import TemplatesClientWrapper from "@/components/TemplatesClientWrapper"
import PageLayout from "@/components/layouts/PageLayout"
import { Plus } from "lucide-react"

export default function TemplatesPage() {
  const pageActions = [
    {
      label: "Create Template",
      icon: <Plus className="h-4 w-4" />,
      href: "/templates/create",
      variant: "default" as const,
      className: "bg-blue-600 hover:bg-blue-700 text-white",
    },
  ]

  return (
    <MainLayout>
      <PageLayout title="Templates" actions={pageActions}>
        <div className="w-full overflow-auto">
          <TemplatesClientWrapper />
        </div>
      </PageLayout>
    </MainLayout>
  )
}
