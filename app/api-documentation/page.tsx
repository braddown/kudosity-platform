"use client"

import { useEffect } from "react"
import MainLayout from "@/components/MainLayout"
import ApiDocumentation from "@/components/ApiDocumentation"
import { usePageHeader } from "@/components/PageHeaderContext"

export default function ApiDocumentationPage() {
  const { setPageHeader } = usePageHeader()

  useEffect(() => {
    setPageHeader({
      title: "API Documentation",
      actions: [],
    })

    return () => setPageHeader(null)
  }, [setPageHeader])

  return (
    <MainLayout>
      <ApiDocumentation />
    </MainLayout>
  )
}
