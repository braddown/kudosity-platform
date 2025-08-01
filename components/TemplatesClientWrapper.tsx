"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, MoreVertical, Edit, Trash2, MessageSquare, FileText } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface Template {
  id: string
  name: string
  content: string
  author: string
  createdAt: string
  usageCount: number
  engagement: number
  category: string
}

export default function TemplatesClientWrapper() {
  const router = useRouter()
  const [templates, setTemplates] = useState<Template[]>([
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
    {
      id: "3",
      name: "My Biz Custom Sender",
      content:
        "Hello [Firstname], this is a message from [Business Name]. Visit our website at https://www.mybusiness.com for the latest updates.",
      author: "John Smith",
      createdAt: "2023-09-18",
      usageCount: 89,
      engagement: 42,
      category: "General",
    },
    {
      id: "4",
      name: "My Biz Template",
      content:
        "Dear [Firstname], your appointment with [Business Name] is confirmed for [Date] at [Time]. Need to reschedule? Call us at [Phone].",
      author: "Appointment Team",
      createdAt: "2023-08-05",
      usageCount: 312,
      engagement: 91,
      category: "Appointment",
    },
    {
      id: "5",
      name: "Product Launch",
      content: "🎉 Exciting news! Our new product is here. Be among the first to get it: https://newproduct.com/launch",
      author: "Product Team",
      createdAt: "2023-12-01",
      usageCount: 28,
      engagement: 83,
      category: "Promotional",
    },
    {
      id: "6",
      name: "Customer Feedback",
      content:
        "Hi [Firstname], we value your opinion! Please take a moment to share your feedback: https://feedback.com/survey",
      author: "Customer Success",
      createdAt: "2023-11-10",
      usageCount: 175,
      engagement: 54,
      category: "Feedback",
    },
  ])

  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")

  const filteredTemplates = templates.filter(
    (template) =>
      (categoryFilter === "all" || template.category === categoryFilter) &&
      (template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.content.toLowerCase().includes(searchQuery.toLowerCase())),
  )

  const handleEditClick = (template: Template) => {
    router.push(`/templates/edit/${template.id}`)
  }

  const handleCreateNew = () => {
    router.push("/templates/create")
  }

  const handleDeleteTemplate = (id: string) => {
    setTemplates(templates.filter((t) => t.id !== id))
  }

  const categories = ["Promotional", "Support", "General", "Appointment", "Feedback"]
  const totalTemplates = templates.length
  const promotionalCount = templates.filter((t) => t.category === "Promotional").length
  const supportCount = templates.filter((t) => t.category === "Support").length
  const generalCount = templates.filter((t) => t.category === "General").length

  useEffect(() => {
    if (typeof window !== "undefined") {
      // @ts-ignore
      window.handleCreateTemplate = handleCreateNew
    }
  }, [])

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
          <div className="flex items-center">
            <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2" />
            <div>
              <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{totalTemplates}</p>
              <p className="text-sm text-blue-700 dark:text-blue-300">All Templates</p>
            </div>
          </div>
        </div>
        <div className="bg-green-50 dark:bg-green-950/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
          <div className="flex items-center">
            <MessageSquare className="h-5 w-5 text-green-600 dark:text-green-400 mr-2" />
            <div>
              <p className="text-2xl font-bold text-green-900 dark:text-green-100">{promotionalCount}</p>
              <p className="text-sm text-green-700 dark:text-green-300">Promotional</p>
            </div>
          </div>
        </div>
        <div className="bg-orange-50 dark:bg-orange-950/20 rounded-lg p-4 border border-orange-200 dark:border-orange-800">
          <div className="flex items-center">
            <MessageSquare className="h-5 w-5 text-orange-600 dark:text-orange-400 mr-2" />
            <div>
              <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">{supportCount}</p>
              <p className="text-sm text-orange-700 dark:text-orange-300">Support</p>
            </div>
          </div>
        </div>
        <div className="bg-purple-50 dark:bg-purple-950/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
          <div className="flex items-center">
            <MessageSquare className="h-5 w-5 text-purple-600 dark:text-purple-400 mr-2" />
            <div>
              <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">{generalCount}</p>
              <p className="text-sm text-purple-700 dark:text-purple-300">General</p>
            </div>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-card rounded-lg shadow-sm border border-border">
        {/* Table Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center space-x-4">
            <h3 className="text-lg font-medium text-card-foreground">All Templates</h3>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none z-10" />
              <Input
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-[250px] h-10"
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="text-left font-medium text-foreground">Template Name</TableHead>
                <TableHead className="text-left font-medium text-foreground">Preview</TableHead>
                <TableHead className="text-left font-medium text-foreground">Category</TableHead>
                <TableHead className="text-left font-medium text-foreground">Usage</TableHead>
                <TableHead className="text-left font-medium text-foreground">Engagement</TableHead>
                <TableHead className="text-left font-medium text-foreground">Author</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTemplates.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                    No templates found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredTemplates.map((template, index) => (
                  <TableRow
                    key={template.id}
                    className={`border-b border-border hover:bg-muted/50 ${
                      index % 2 === 0 ? "bg-card" : "bg-muted/20"
                    }`}
                  >
                    <TableCell className="font-medium text-foreground">
                      <div className="flex items-center">
                        <MessageSquare className="h-4 w-4 mr-2 text-gray-400" />
                        {template.name}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      <div className="max-w-xs truncate">{template.content}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-foreground">
                        {template.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{template.usageCount} uses</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <div className="w-full bg-muted rounded-full h-2.5 mr-2">
                          <div
                            className="bg-blue-500 h-2.5 rounded-full"
                            style={{ width: `${template.engagement}%` }}
                          ></div>
                        </div>
                        <span className="text-muted-foreground">{template.engagement}%</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{template.author}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditClick(template)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDeleteTemplate(template.id)} className="text-red-600">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}
