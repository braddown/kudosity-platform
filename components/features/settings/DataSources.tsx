"use client"

import React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Plus, Settings, RefreshCw, Filter, CheckCircle, XCircle, Trash2 } from "lucide-react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ScrollArea } from "@/components/ui/scroll-area"

interface DataSource {
  id: string
  name: string
  type: string
  status: "connected" | "disconnected"
  lastSync: string
  profileCount: number
}

interface FilterCondition {
  field: string
  operator: string
  value: string
}

interface FilterGroup {
  conditions: FilterCondition[]
}

const sampleSources: DataSource[] = [
  {
    id: "1",
    name: "Salesforce",
    type: "CRM",
    status: "connected",
    lastSync: "2 hours ago",
    profileCount: 15000,
  },
  {
    id: "2",
    name: "HubSpot",
    type: "CRM",
    status: "connected",
    lastSync: "1 hour ago",
    profileCount: 8000,
  },
  {
    id: "3",
    name: "Zendesk",
    type: "Customer Service",
    status: "disconnected",
    lastSync: "Never",
    profileCount: 0,
  },
  {
    id: "4",
    name: "Zapier",
    type: "Automation",
    status: "connected",
    lastSync: "30 minutes ago",
    profileCount: 5000,
  },
  {
    id: "5",
    name: "n8n",
    type: "Workflow Automation",
    status: "connected",
    lastSync: "1 hour ago",
    profileCount: 3000,
  },
]

function ConfigureModal({
  isOpen,
  onClose,
  source,
}: { isOpen: boolean; onClose: () => void; source: DataSource | null }) {
  const [apiKey, setApiKey] = useState("")
  const [ssoUrl, setSsoUrl] = useState("")

  // Sample source fields and our field definitions
  const sourceFields = ["First Name", "Last Name", "Email", "Phone", "Company", "Job Title"]
  const ourFields = [
    "firstName",
    "lastName",
    "email",
    "mobileNumber",
    "companyName",
    "jobTitle",
    "customField1",
    "customField2",
  ]

  if (!source) return null

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-1/2 sm:max-w-none pt-16 flex flex-col" side="right">
        <SheetHeader className="mt-4">
          <SheetTitle>Configure {source.name}</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col flex-grow overflow-hidden">
          <div className="px-6 py-4 space-y-4">
            <Card className="border p-4 rounded-md">
              <div className="flex items-center gap-2">
                <Label htmlFor="api-key" className="min-w-[100px]">
                  API Key:
                </Label>
                <Input id="api-key" value={apiKey} onChange={(e) => setApiKey(e.target.value)} className="flex-grow" />
              </div>
            </Card>
            <Card className="border p-4 rounded-md">
              <div className="flex items-center gap-2">
                <Label htmlFor="sso-url" className="min-w-[100px]">
                  SSO URL:
                </Label>
                <Input id="sso-url" value={ssoUrl} onChange={(e) => setSsoUrl(e.target.value)} className="flex-grow" />
              </div>
            </Card>
          </div>
          <div className="px-6 py-4 flex flex-col flex-grow overflow-hidden">
            <h3 className="text-lg font-semibold mb-4">Data Mapping</h3>
            <div className="flex-grow overflow-hidden">
              <ScrollArea className="h-full w-full rounded-md border">
                <div className="p-4">
                  <Table className="w-full">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[200px]">Source Field</TableHead>
                        <TableHead className="w-[200px]">Our Field</TableHead>
                        <TableHead>Update</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sourceFields.map((field, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{field}</TableCell>
                          <TableCell>
                            <Select>
                              <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Select field" />
                              </SelectTrigger>
                              <SelectContent>
                                {ourFields.map((ourField, idx) => (
                                  <SelectItem key={idx} value={ourField}>
                                    {ourField}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Select>
                              <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Select update option" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="always">Always</SelectItem>
                                <SelectItem value="if-changed">If Changed</SelectItem>
                                <SelectItem value="never">Never</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </ScrollArea>
            </div>
          </div>
        </div>
        <SheetFooter className="border-t p-6 bg-white">
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button variant="default" className="">Save</Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

function FilteringDrawer({
  isOpen,
  onClose,
  source,
}: { isOpen: boolean; onClose: () => void; source: DataSource | null }) {
  const [filterGroups, setFilterGroups] = useState<FilterGroup[]>([
    { conditions: [{ field: "firstName", operator: "contains", value: "" }] },
  ])
  const [excludeEvery, setExcludeEvery] = useState<string>("")
  const [excludeList, setExcludeList] = useState("")
  const [suppressionList, setSuppressionList] = useState("")

  if (!source) return null

  const addCondition = (groupIndex: number) => {
    const newGroups = [...filterGroups]
    newGroups[groupIndex].conditions.push({ field: "firstName", operator: "contains", value: "" })
    setFilterGroups(newGroups)
  }

  const removeCondition = (groupIndex: number, conditionIndex: number) => {
    const newGroups = [...filterGroups]
    newGroups[groupIndex].conditions.splice(conditionIndex, 1)
    if (newGroups[groupIndex].conditions.length === 0) {
      newGroups.splice(groupIndex, 1)
    }
    setFilterGroups(newGroups)
  }

  const addGroup = () => {
    setFilterGroups([...filterGroups, { conditions: [{ field: "firstName", operator: "contains", value: "" }] }])
  }

  const updateCondition = (groupIndex: number, conditionIndex: number, field: keyof FilterCondition, value: string) => {
    const newGroups = [...filterGroups]
    newGroups[groupIndex].conditions[conditionIndex][field] = value
    setFilterGroups(newGroups)
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-1/2 sm:max-w-none pt-16 flex flex-col" side="right">
        <SheetHeader className="mt-4">
          <SheetTitle>Filter incoming data from {source.name}</SheetTitle>
        </SheetHeader>
        <div className="px-6 py-4 space-y-4">
          <Card className="border p-4 rounded-md">
            <div className="flex items-center gap-2">
              <Label htmlFor="exclude-profiles" className="min-w-[200px]">
                Control Group:
              </Label>
              <div className="flex-grow flex items-center gap-2 text-sm">
                <span>Exclude every</span>
                <Input
                  id="exclude-profiles"
                  type="number"
                  placeholder="000"
                  value={excludeEvery}
                  onChange={(e) => setExcludeEvery(e.target.value)}
                  className="w-20"
                />
                <span>profiles added and add to</span>
                <Select value={excludeList} onValueChange={setExcludeList}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Select list" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="list1">List 1</SelectItem>
                    <SelectItem value="list2">List 2</SelectItem>
                    <SelectItem value="list3">List 3</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>
          <Card className="border p-4 rounded-md">
            <div className="flex items-center gap-2">
              <Label htmlFor="suppression-list" className="min-w-[200px]">
                Suppression List:
              </Label>
              <div className="flex-grow">
                <Select value={suppressionList} onValueChange={setSuppressionList}>
                  <SelectTrigger id="suppression-list" className="w-full">
                    <SelectValue placeholder="Select a list to exclude contacts" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="list1">List 1</SelectItem>
                    <SelectItem value="list2">List 2</SelectItem>
                    <SelectItem value="list3">List 3</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>
        </div>
        <div className="px-6 py-4 flex-grow overflow-auto">
          {filterGroups.map((group, groupIndex) => (
            <React.Fragment key={groupIndex}>
              <div className="border p-4 rounded-md space-y-2 mb-4">
                {group.conditions.map((condition, conditionIndex) => (
                  <React.Fragment key={conditionIndex}>
                    {conditionIndex > 0 && <div className="text-sm font-medium text-gray-500 my-2">and</div>}
                    <div className="flex items-center space-x-2">
                      <div className="flex-grow flex items-center space-x-2">
                        <Select
                          value={condition.field}
                          onValueChange={(value) => updateCondition(groupIndex, conditionIndex, "field", value)}
                        >
                          <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder="Select field" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="firstName">First Name</SelectItem>
                            <SelectItem value="lastName">Last Name</SelectItem>
                            <SelectItem value="email">Email</SelectItem>
                          </SelectContent>
                        </Select>
                        <Select
                          value={condition.operator}
                          onValueChange={(value) => updateCondition(groupIndex, conditionIndex, "operator", value)}
                        >
                          <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder="Select operator" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="contains">contains</SelectItem>
                            <SelectItem value="equals">equals</SelectItem>
                            <SelectItem value="startsWith">starts with</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input
                          value={condition.value}
                          onChange={(e) => updateCondition(groupIndex, conditionIndex, "value", e.target.value)}
                          placeholder="Enter value"
                          className="flex-grow"
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-sm"
                          onClick={() => removeCondition(groupIndex, conditionIndex)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="default" className=" whitespace-nowrap"
                          onClick={() => addCondition(groupIndex)}
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Condition
                        </Button>
                      </div>
                    </div>
                  </React.Fragment>
                ))}
              </div>
              {groupIndex < filterGroups.length - 1 && <div className="text-sm font-medium text-gray-500 my-2">or</div>}
            </React.Fragment>
          ))}
          <Button variant="default" className=" mt-4" onClick={addGroup}>
            <Plus className="mr-2 h-4 w-4" />
            Filter
          </Button>
        </div>
        <SheetFooter className="border-t p-6 bg-white">
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button variant="default" className="">Save</Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

export default function DataSourcesComponent() {
  const [sources, setSources] = useState<DataSource[]>(sampleSources)
  const [selectedSource, setSelectedSource] = useState<string | null>(null)
  const [configureModalOpen, setConfigureModalOpen] = useState(false)
  const [selectedSourceForConfig, setSelectedSourceForConfig] = useState<DataSource | null>(null)
  const [filteringDrawerOpen, setFilteringDrawerOpen] = useState(false)
  const [selectedSourceForFiltering, setSelectedSourceForFiltering] = useState<DataSource | null>(null)

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {sources.map((source) => (
          <Card
            key={source.id}
            className="cursor-pointer hover:border-primary"
            onClick={() => setSelectedSource(source.id)}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xl font-semibold">{source.name}</CardTitle>
              <Badge
                variant={source.status === "connected" ? "default" : "secondary"}
                className={`flex items-center gap-1 ${
                  source.status === "connected" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                }`}
              >
                {source.status === "connected" ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                {source.status}
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  <p>Type: {source.type}</p>
                  <p>Profiles: {source.profileCount.toLocaleString()}</p>
                  <p>Last sync: {source.lastSync}</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 justify-between items-start sm:items-center">
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedSourceForConfig(source)
                        setConfigureModalOpen(true)
                      }}
                    >
                      <Settings className="mr-1 h-3 w-3" />
                      Configure
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedSourceForFiltering(source)
                        setFilteringDrawerOpen(true)
                      }}
                    >
                      <Filter className="mr-1 h-3 w-3" />
                      Filtering
                    </Button>
                  </div>
                  <Button variant="outline" size="sm" className="text-xs">
                    <RefreshCw className="mr-1 h-3 w-3" />
                    Sync Now
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <ConfigureModal
        isOpen={configureModalOpen}
        onClose={() => setConfigureModalOpen(false)}
        source={selectedSourceForConfig}
      />

      <FilteringDrawer
        isOpen={filteringDrawerOpen}
        onClose={() => setFilteringDrawerOpen(false)}
        source={selectedSourceForFiltering}
      />
    </div>
  )
}
