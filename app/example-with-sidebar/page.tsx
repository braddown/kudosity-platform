"use client"

import MainLayout from "@/components/MainLayout"
import PageContent from "@/components/PageContent"
import { Card, CardContent } from "@/components/ui/card"
import { Save } from "lucide-react"

export default function ExampleWithSidebarPage() {
  return (
    <MainLayout>
      <PageContent
        title="Example With Sidebar"
        description="This is an example of a page with a sidebar using the standardized layout."
        actions={[
          {
            label: "Save",
            icon: <Save className="h-4 w-4" />,
            onClick: () => console.log("Save clicked"),
          },
        ]}
        withSidebar={true}
        sidebar={
          <div className="bg-gray-50 p-4 rounded-lg sticky top-8">
            <h3 className="text-lg font-medium mb-4">Preview</h3>
            <p className="text-sm text-gray-600">
              This is a sidebar that can be used for previews, additional information, or secondary actions.
            </p>
          </div>
        }
      >
        <Card className="shadow-none">
          <CardContent className="p-6">
            <h3 className="text-lg font-medium mb-4">Main Content</h3>
            <p className="mb-4">
              This is the main content area of the page. It takes up 2/3 of the width on larger screens, with the
              sidebar taking up 1/3.
            </p>
            <p>
              On smaller screens, this content takes up the full width, and the sidebar is hidden to provide a better
              mobile experience.
            </p>
          </CardContent>
        </Card>
      </PageContent>
    </MainLayout>
  )
}
