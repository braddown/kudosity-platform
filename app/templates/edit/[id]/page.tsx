import { notFound } from "next/navigation"
import MainLayout from "@/components/MainLayout"
import TemplateEditForm from "@/components/TemplateEditForm"

// Mock data - replace with actual data fetching
const getTemplate = (id: string) => {
  const templates = [
    {
      id: "1",
      name: "Winter Sale",
      content: "❄️ Winter Sale Alert! ❄️ Get 30% off all winter gear. Shop now at https://winterstore.com/sale",
      author: "Marketing Team",
      createdAt: "2023-11-15",
      usageCount: 42,
      engagement: 78,
      category: "Promotional",
    },
    {
      id: "2",
      name: "My Biz Template VMN",
      content: "Thank you for choosing [Business Name]. For support, call our VMN: [VMN]. We're here to help!",
      author: "Support Team",
      createdAt: "2023-10-22",
      usageCount: 156,
      engagement: 65,
      category: "Support",
    },
    // Add other templates...
  ]

  return templates.find((t) => t.id === id)
}

export default function EditTemplatePage({ params }: { params: { id: string } }) {
  const template = getTemplate(params.id)

  if (!template) {
    notFound()
  }

  return (
    <MainLayout>
      <TemplateEditForm template={template} />
    </MainLayout>
  )
}
