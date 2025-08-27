"use client"

import MainLayout from "@/components/MainLayout"
import PageLayout from "@/components/layouts/PageLayout"
import { MessageHistory } from "@/components/features/campaigns/MessageHistory"

export default function MessagingActivityPage() {
  return (
    <MainLayout>
      <PageLayout
        title="Messaging Activity"
        description="View all individual messages sent across all channels - campaigns, chat, API, and more"
      >
        <MessageHistory />
      </PageLayout>
    </MainLayout>
  )
}