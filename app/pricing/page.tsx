"use client"
import Pricing from "@/components/Pricing"
import DashboardLayout from "@/components/layouts/DashboardLayout"
import { PhoneCall } from "lucide-react"

export default function PricingPage() {
  const handleContactSales = () => {
    // Implement contact sales functionality here
    console.log("Contact sales clicked")
    // This could open a modal, redirect to a contact form, or trigger a chat widget
  }

  return (
    <DashboardLayout
      title="Pricing"
      actions={[
        {
          label: "Contact Sales",
          icon: <PhoneCall className="h-4 w-4" />,
          onClick: handleContactSales,
        },
      ]}
    >
      <div className="flex flex-col w-full">
        <div className="w-full">
          <Pricing />
        </div>
      </div>
    </DashboardLayout>
  )
}
