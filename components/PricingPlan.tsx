"\"use client"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Check } from "lucide-react"

interface PricingPlanProps {
  plan: {
    name: string
    description: string
    price: string
    duration: string
    features: string[]
    cta: string
    highlighted: boolean
  }
}

export default function PricingPlan({ plan }: PricingPlanProps) {
  return (
    <Card
      className={`relative flex flex-col justify-between ${plan.highlighted ? "border-gray-500" : "border-[#E5E7EB]"} bg-white`}
    >
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-[#002A66]">{plan.name}</CardTitle>
        <CardDescription className="text-[#374151]">{plan.description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col flex-grow">
        <div className="mb-6">
          <div className="text-3xl font-bold text-[#002A66]">{plan.price}</div>
          <div className="text-sm text-[#374151] mt-2">{plan.duration}</div>
          <ul className="space-y-2">
            {plan.features.map((feature) => (
              <li key={feature} className="flex items-center gap-2 text-sm text-[#374151]">
                <Check className="w-4 h-4 text-green-500" />
                {feature}
              </li>
            ))}
          </ul>
        </div>
        <Button className="mt-auto">{plan.cta}</Button>
      </CardContent>
    </Card>
  )
}
