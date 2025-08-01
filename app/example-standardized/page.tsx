"use client"

import MainLayout from "@/components/MainLayout"
import PageContent from "@/components/PageContent"
import { Plus } from "lucide-react"

export default function ExampleStandardizedPage() {
  return (
    <MainLayout>
      <PageContent
        title="Example Standardized Page"
        description="This is an example of a page using the standardized layout."
        actions={[
          {
            label: "Add New",
            icon: <Plus className="h-4 w-4" />,
            href: "#",
          },
        ]}
      >
        <div className="bg-white p-6 rounded-lg">
          <h3 className="text-lg font-medium mb-4">Content Section</h3>
          <p>
            This is the main content of the page. It uses the standardized layout pattern with a consistent header and
            content area.
          </p>
        </div>
      </PageContent>
    </MainLayout>
  )
}
