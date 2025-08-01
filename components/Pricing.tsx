"use client"

import { useState } from "react"
import { Check, ShoppingCart, CreditCard, Mail, ClipboardList, Database, Lock, Users, Search } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import PageLayout from "@/components/layouts/PageLayout"

const addOns = [
  {
    name: "Abandoned Cart",
    price: 49,
    conversionPrice: 0.55,
    description:
      "Sends personalised text messages over time to shopper that left items in cart unpurchased after pre-defined time periods.",
    icon: ShoppingCart,
  },
  {
    name: "Payment Recovery",
    price: 49,
    conversionPrice: 1.25,
    description:
      "Sends a series of messages to a customer after a recurring credit card payment has failed. Design to reactivate payment.",
    icon: CreditCard,
  },
  {
    name: "Email Update",
    price: 29,
    conversionPrice: 0.25,
    description:
      "Sends a request to person after their email has bounced a number of times requesting an updated email address.",
    icon: Mail,
  },
  {
    name: "Customer Survey",
    price: 149,
    conversionPrice: 0.05,
    description:
      "Optimised message based surveys designed for maximum engagement. Can be used for single surveys or long term studies.",
    icon: ClipboardList,
  },
  {
    name: "Data Retention",
    price: 19,
    description:
      "Standard data retention is 90 days. To avoid having unused contact lists and campaign history archived, you can pay for storage.",
    icon: Database,
  },
  {
    name: "SSO Authentication",
    price: 199,
    description: "Add extra single sign on security to your accounts. Allows for sign on using single private domain.",
    icon: Lock,
  },
  {
    name: "Extra User Seats",
    price: 9,
    description:
      "Extra audited users showing responsibility for uploading/downloading PII, sending messages and adding logins.",
    icon: Users,
  },
  {
    name: "Number Lookup",
    price: 0.001,
    description: "Wash your list for disconnected numbers, get insights and extra data associated with your audiences.",
    icon: Search,
    perContact: true,
  },
]

function AddOnCard({ addOn, currencySymbol, isActive }) {
  const Icon = addOn.icon
  return (
    <Card
      className={`flex flex-col justify-between ${isActive ? "border-blue-500 dark:border-blue-400" : "border-gray-200 dark:border-gray-700"} bg-white dark:bg-gray-800`}
    >
      <CardHeader>
        <div className="flex items-center gap-2">
          <Icon className="w-6 h-6 text-gray-900 dark:text-white" />
          <CardTitle className="text-xl font-semibold text-gray-900 dark:text-white">{addOn.name}</CardTitle>
        </div>
        <CardDescription className="text-sm text-gray-600 dark:text-gray-300 mt-2">
          {addOn.description}{" "}
          <a href="#" className="text-blue-600 hover:underline">
            Find out more...
          </a>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-2">
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {currencySymbol}
            {addOn.price}{" "}
            <span className="text-sm font-normal text-gray-600 dark:text-gray-300">
              {addOn.perContact ? "/contact" : "/month"}
            </span>
          </p>
          {addOn.conversionPrice && (
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {currencySymbol}
              {addOn.conversionPrice.toFixed(2)} per conversion
            </p>
          )}
          {isActive ? (
            <div
              className="w-full py-2 px-4 text-center bg-gray-500 text-white rounded-md mt-4 cursor-pointer transition-colors duration-200 ease-in-out hover:bg-red-800"
              onMouseEnter={(e) => (e.currentTarget.textContent = "Cancel")}
              onMouseLeave={(e) => (e.currentTarget.textContent = "Active")}
            >
              Active
            </div>
          ) : (
            <Button
              className="mt-4 w-full transition-colors duration-200 ease-in-out border-gray-900 dark:border-white text-gray-900 dark:text-white hover:bg-blue-600 hover:text-white dark:hover:bg-blue-500"
              variant="outline"
            >
              Add to Plan
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default function Pricing() {
  const [isAnnual, setIsAnnual] = useState(false)
  const [selectedCurrency, setSelectedCurrency] = useState("AUD")
  const [selectedDestination, setSelectedDestination] = useState("Australia")
  const [selectedChannel, setSelectedChannel] = useState("SMS")

  const volumePlans = {
    Starter: {
      price: 0,
    },
    Business: {
      price: 49,
    },
    Professional: {
      price: 249,
    },
    Enterprise: {
      price: "Call",
    },
  }

  const getPrice = (tier) => {
    return volumePlans[tier].price === "Call" ? "Call" : volumePlans[tier].price
  }

  const plans = [
    {
      name: "Starter",
      description: "Getting started with messaging",
      seats: "1 User",
      includedMessages: "First 100 messages included",
      features: [
        "50,000 contacts",
        "Reply based opt-out handling",
        "Standard delivery reports",
        "Email support",
        "Basic analytics",
        "90 day data retention",
        "Scheduled messages",
        "Automated sender ID management",
        "2 way messaging via email",
        "Global Delivery",
        "Automated number validation",
        "20 requests per second API limit",
      ],
    },
    {
      name: "Business",
      description: "Getting serious about your business",
      seats: "1 User",
      includedMessages: "First 250 messages included",
      features: [
        "75,000 contacts",
        "Priority support",
        "200 requests per second API call",
        "6 months data retention",
        "Everything in Starter, plus:",
        "Advanced analytics",
        "Custom sender IDs",
        "Webhook integrations",
        "Automated bounce handling",
        "Link tracking",
        "Template management",
      ],
    },
    {
      name: "Professional",
      description: "Optimal for growing businesses",
      popular: true,
      seats: "10 Users",
      includedMessages: "First 500 messages included",
      features: [
        "250,000 contacts",
        "Custom senders",
        "AI opt-out processing",
        "AI based wrong number handling",
        "Automated bounce handling",
        "Automated reply handling",
        "Operator Inbox",
        "Split messaging",
        "Custom link tracking",
        "Priority support",
        "1 year data retention",
        "AI suggested responses",
        "Advanced data filtering and cleaning",
        "Link based opt-out",
        "200 requests per second API limit",
        "Live Dashboard Reporting",
      ],
    },
    {
      name: "Enterprise",
      description: "Custom plans for complex operations",
      seats: "Unlimited Users",
      includedMessages: "Unlimited Sandbox Testing",
      features: [
        "Unlimited contacts",
        "Conversion Tracking and Attribution",
        "ISO 27001 Compliance",
        "SOC 2 Compliance",
        "Data Sovereignty",
        "Enterprise Support",
        "Integration Support",
        "Dedicated Account Manager",
        "Custom Security Features",
        "Advanced Analytics",
        "ISV parent/child account support",
        "User Audit",
        "Unlimited data retention",
        "Sender ID porting and management",
        "SMPP connectivity",
        "Advanced SSO Authentication",
      ],
    },
  ]

  const currencies = [
    { code: "AUD", symbol: "A$" },
    { code: "USD", symbol: "$" },
    { code: "GBP", symbol: "£" },
    { code: "EUR", symbol: "€" },
    { code: "CAD", symbol: "C$" },
  ]

  const destinations = [
    "Australia",
    "New Zealand",
    "Singapore",
    "Philippines",
    "Hong Kong",
    "United States",
    "United Kingdom",
  ]

  const channels = ["SMS", "MMS", "RCS", "WhatsApp"]

  const pricing = {
    Australia: { SMS: 0.069, MMS: 0.25, RCS: 0.075, WhatsApp: 0.001 },
    "New Zealand": { SMS: 0.072, MMS: 0.26, RCS: 0.078, WhatsApp: 0.0011 },
    Singapore: { SMS: 0.065, MMS: 0.24, RCS: 0.071, WhatsApp: 0.001 },
    Philippines: { SMS: 0.063, MMS: 0.23, RCS: 0.069, WhatsApp: 0.0009 },
    "Hong Kong": { SMS: 0.067, MMS: 0.245, RCS: 0.073, WhatsApp: 0.001 },
    "United States": { SMS: 0.07, MMS: 0.255, RCS: 0.076, WhatsApp: 0.0011 },
    "United Kingdom": { SMS: 0.068, MMS: 0.248, RCS: 0.074, WhatsApp: 0.001 },
  }

  const getCurrencySymbol = (code) => {
    return currencies.find((currency) => currency.code === code)?.symbol || "$"
  }

  const getChannelPricing = (destination, channel, plan) => {
    const basePrice = pricing[destination][channel]
    if (plan === "Starter") return basePrice
    if (plan === "Business") return 0.049
    return 0.039
  }

  return (
    <PageLayout fullWidth={true} title="Pricing" description="Choose the plan that's right for you">
      <div className="bg-gray-50 dark:bg-gray-900 -mx-6 -my-6 px-6 py-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
          <div className="inline-flex rounded-md bg-gray-100 dark:bg-gray-800 p-1">
            <button
              onClick={() => setIsAnnual(false)}
              className={`px-4 py-2 text-sm rounded-md transition-colors ${
                !isAnnual
                  ? "bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setIsAnnual(true)}
              className={`px-4 py-2 text-sm rounded-md transition-colors ${
                isAnnual
                  ? "bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              Annual (20% OFF)
            </button>
          </div>
          <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Currency" />
            </SelectTrigger>
            <SelectContent>
              {currencies.map((currency) => (
                <SelectItem key={currency.code} value={currency.code}>
                  {currency.code} ({currency.symbol})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 xl:gap-6 mb-16 xl:mb-24">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={`relative flex flex-col justify-between ${
                plan.name === "Starter"
                  ? "border-blue-500 dark:border-blue-400"
                  : "border-gray-200 dark:border-gray-700"
              } bg-white dark:bg-gray-800`}
            >
              <CardHeader>
                <CardTitle className="text-xl sm:text-2xl xl:text-3xl font-semibold text-gray-900 dark:text-white">
                  {plan.name}
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-300">{plan.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col flex-grow">
                <div className="mb-6">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl sm:text-4xl xl:text-5xl font-bold text-gray-900 dark:text-white">
                      {getCurrencySymbol(selectedCurrency)}
                      {plan.name === "Enterprise"
                        ? "Call"
                        : isAnnual
                          ? Math.round(getPrice(plan.name) * 0.8 * 12)
                          : getPrice(plan.name)}
                    </span>
                    <span className="text-gray-600 dark:text-gray-300">/{isAnnual ? "year" : "month"}</span>
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-300 mt-2 mb-4">{plan.seats}</div>
                  {plan.includedMessages && (
                    <div className="text-sm font-medium text-green-600 mb-4">{plan.includedMessages}</div>
                  )}
                  <Card className="bg-blue-50 dark:bg-gray-700/50 border-blue-200 dark:border-gray-600">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">
                        {plan.name === "Starter"
                          ? "Retail pricing"
                          : plan.name === "Business"
                            ? "Business pricing"
                            : plan.name === "Professional"
                              ? "Wholesale pricing"
                              : "Enterprise pricing"}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {plan.name !== "Enterprise" ? (
                        <>
                          <div className="grid grid-cols-2 gap-2">
                            <Select value={selectedDestination} onValueChange={setSelectedDestination}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select destination" />
                              </SelectTrigger>
                              <SelectContent>
                                {destinations.map((destination) => (
                                  <SelectItem key={destination} value={destination}>
                                    {destination}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Select value={selectedChannel} onValueChange={setSelectedChannel}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select channel" />
                              </SelectTrigger>
                              <SelectContent>
                                {channels.map((channel) => (
                                  <SelectItem key={channel} value={channel}>
                                    {channel}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <p className="text-lg font-semibold text-gray-900 dark:text-white">
                            {getChannelPricing(selectedDestination, selectedChannel, plan.name).toFixed(3)}c per{" "}
                            {selectedChannel}
                          </p>
                        </>
                      ) : (
                        <>
                          <Button
                            variant="outline"
                            className="w-full border-gray-900 dark:border-white text-gray-900 dark:text-white hover:bg-blue-600 hover:text-white dark:hover:bg-blue-500"
                          >
                            Request Pricing Review
                          </Button>
                          <p className="text-lg font-semibold text-gray-900 dark:text-white">From 0.019c per SMS</p>
                        </>
                      )}
                    </CardContent>
                  </Card>
                  <div className="mt-6">
                    {plan.name === "Starter" && (
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Includes:</h4>
                    )}
                    {plan.name === "Business" && (
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Everything in Starter, plus:</h4>
                    )}
                    {plan.name === "Professional" && (
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                        Everything in Business, plus:
                      </h4>
                    )}
                    {plan.name === "Enterprise" && (
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                        Everything in Professional, plus:
                      </h4>
                    )}
                    <ul className="space-y-2">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                          <Check className="w-4 h-4 text-green-500" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="mt-auto pt-6">
                  {plan.name === "Starter" ? (
                    <div className="w-full py-2 px-4 text-center bg-gray-500 dark:bg-gray-600 text-white rounded-md cursor-not-allowed">
                      Current Plan
                    </div>
                  ) : (
                    <Button
                      className="w-full transition-colors duration-200 ease-in-out border-gray-900 dark:border-white text-gray-900 dark:text-white hover:bg-blue-600 hover:text-white dark:hover:bg-blue-500"
                      variant="outline"
                    >
                      {plan.name === "Enterprise" ? "Contact Sales" : "Upgrade Plan"}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Add-ons Section */}
        <div className="mt-16 xl:mt-24">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-8">Add-ons</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 xl:gap-6">
            {addOns.map((addOn) => (
              <AddOnCard
                key={addOn.name}
                addOn={addOn}
                currencySymbol={getCurrencySymbol(selectedCurrency)}
                isActive={addOn.name === "Abandoned Cart"}
              />
            ))}
          </div>
        </div>
      </div>
    </PageLayout>
  )
}
