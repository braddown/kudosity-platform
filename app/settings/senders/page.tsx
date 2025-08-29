"use client"

import MainLayout from "@/components/MainLayout"
import { KudosityTable } from "@/components/KudosityTable"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { toast } from "sonner"
import { MoreHorizontal, Edit, Trash2, Plus, Phone, Hash, Loader2 } from "lucide-react"
import { usePageHeader } from "@/components/PageHeaderContext"
import { useEffect, useState } from "react"

interface Sender {
  id: string
  sender_id: string
  display_name: string
  description: string
  type: 'virtual_number' | 'alphanumeric' | 'mobile_number'
  country: string | null
  country_name: string | null
  capabilities: string[]
  status: 'active' | 'inactive' | 'pending' | 'expired'
  price: number | null
  next_charge: string | null
  auto_renew: boolean | null
  approval_status?: 'approved' | 'pending' | 'rejected' | null
  last_synced_at: string | null
  source: 'kudosity_api' | 'manual' | 'imported'
  use_case: 'marketing' | 'transactional' | 'private' | 'otp'
}

export default function SendersSettingsPage() {
  const { setPageHeader } = usePageHeader()
  const [senders, setSenders] = useState<Sender[]>([])
  const [loading, setLoading] = useState(true)

  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [addVirtualDialogOpen, setAddVirtualDialogOpen] = useState(false)
  
  // Form states
  const [customSenderForm, setCustomSenderForm] = useState({
    sender_id: '',
    type: 'alphanumeric',
    countries: [] as string[],
    description: '',
    use_case: 'marketing' as 'marketing' | 'transactional' | 'private' | 'otp'
  })
  
  const [editingSender, setEditingSender] = useState<Sender | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)

  // Country options
  const countryOptions = [
    'Australia', 'United States', 'United Kingdom', 'Canada', 'Germany', 
    'France', 'Japan', 'Singapore', 'New Zealand', 'Netherlands',
    'Sweden', 'Norway', 'Denmark', 'Finland', 'Switzerland'
  ]
  
  const [virtualNumberForm, setVirtualNumberForm] = useState({
    number: '',
    forward_url: ''
  })
  
  // Available numbers state
  const [availableNumbers, setAvailableNumbers] = useState<any[]>([])
  const [loadingAvailable, setLoadingAvailable] = useState(false)
  const [availablePagination, setAvailablePagination] = useState({
    current_page: 1,
    total_pages: 1,
    total_numbers: 0,
    per_page: 20
  })
  const [selectedNumber, setSelectedNumber] = useState<any>(null)
  const [leasingStep, setLeasingStep] = useState<'select' | 'confirm' | 'lease'>('select')

  // Fetch senders from database and auto-sync
  const fetchSenders = async (autoSync = false) => {
    try {
      setLoading(true)
      
      // Auto-sync with Kudosity first if requested
      if (autoSync) {
        console.log('Auto-syncing with Kudosity...')
        try {
          await fetch('/api/senders/sync', { method: 'POST' })
        } catch (error) {
          console.error('Auto-sync failed:', error)
          // Don't show error to user for auto-sync failures
        }
      }
      
      const response = await fetch(`/api/kudosity/senders?t=${Date.now()}`)
      const data = await response.json()
      
      if (data.error) {
        toast.error(data.error)
        return
      }
      
      console.log('Loaded', data.senders?.length || 0, 'senders')
      setSenders(data.senders || [])
    } catch (error) {
      console.error('Error fetching senders:', error)
      toast.error("Failed to fetch senders")
    } finally {
      setLoading(false)
    }
  }

  // Fetch available numbers from Kudosity
  const fetchAvailableNumbers = async (page = 1) => {
    try {
      setLoadingAvailable(true)
      const response = await fetch(`/api/senders/available-numbers?page=${page}&max=20`)
      const data = await response.json()
      
      if (data.error) {
        toast.error(`Error fetching available numbers: ${data.error}`)
        return
      }
      
      setAvailableNumbers(data.numbers || [])
      setAvailablePagination(data.pagination)
    } catch (error) {
      console.error('Error fetching available numbers:', error)
      toast.error("Failed to fetch available numbers")
    } finally {
      setLoadingAvailable(false)
    }
  }

  // Open virtual number dialog and fetch available numbers
  const openVirtualNumberDialog = () => {
    setAddVirtualDialogOpen(true)
    setLeasingStep('select')
    setSelectedNumber(null)
    setVirtualNumberForm({ number: '', forward_url: '' })
    fetchAvailableNumbers(1)
  }

  // Add custom sender
  const addCustomSender = async () => {
    try {
      if (!customSenderForm.sender_id) {
        toast.error("Sender ID is required")
        return
      }

      const response = await fetch('/api/senders/custom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customSenderForm)
      })
      
      const data = await response.json()
      
      if (data.error) {
        toast.error(`${data.error}${data.details ? ': ' + data.details : ''}`)
        return
      }
      
      toast.success(data.message)
      
      setAddDialogOpen(false)
      setCustomSenderForm({
        sender_id: '',
        type: 'alphanumeric',
        countries: [],
        description: '',
        use_case: 'marketing'
      })
      
      await fetchSenders(false)
    } catch (error) {
      console.error('Error adding custom sender:', error)
      toast.error("Failed to add custom sender")
    }
  }

  // Edit sender
  const editSender = (sender: Sender) => {
    setEditingSender(sender)
    setEditDialogOpen(true)
  }

  // Update sender
  const updateSender = async () => {
    if (!editingSender) return

    try {
      const updateData = {
        id: editingSender.id,
        description: editingSender.description || '',
        countries: editingSender.country ? editingSender.country.split(',') : [],
        use_case: editingSender.use_case
      }
      
      console.log('Updating sender:', updateData.id, 'with description:', updateData.description)
      
      const response = await fetch('/api/senders/custom', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      })
      
      const data = await response.json()
      
      console.log('Update successful for sender:', data.sender?.sender_id)
      
      if (data.error) {
        console.error('Update error:', data.error)
        toast.error(data.error)
        return
      }
      
      toast.success("Sender updated successfully")
      
      // Update the local state immediately to reflect changes
      if (data.sender) {
        setSenders(prevSenders => 
          prevSenders.map(sender => 
            sender.id === data.sender.id 
              ? { ...sender, description: data.sender.description, country: data.sender.country, use_case: data.sender.use_case }
              : sender
          )
        )
      }
      
      setEditDialogOpen(false)
      setEditingSender(null)
      
      // Still fetch fresh data to ensure consistency
      await fetchSenders(false)
    } catch (error) {
      console.error('Error updating sender:', error)
      toast.error("Failed to update sender")
    }
  }

  // Lease selected virtual number
  const leaseVirtualNumber = async () => {
    if (!selectedNumber) return

    try {
      setLeasingStep('lease')
      
      const response = await fetch('/api/senders/lease-number', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          number: selectedNumber.number,
          forward_url: virtualNumberForm.forward_url
        })
      })
      
      const data = await response.json()
      
      if (data.error) {
        // Check for insufficient balance error
        if (data.error.toLowerCase().includes('balance') || data.error.toLowerCase().includes('insufficient')) {
          toast.error("Insufficient account balance. Please add funds to your Kudosity account to lease this number.")
        } else {
          toast.error(`Failed to lease number: ${data.error}`)
        }
        setLeasingStep('confirm')
        return
      }
      
      toast.success(data.message)
      
      setAddVirtualDialogOpen(false)
      setLeasingStep('select')
      setSelectedNumber(null)
      setVirtualNumberForm({
        number: '',
        forward_url: ''
      })
      
      await fetchSenders(false)
    } catch (error) {
      console.error('Error leasing virtual number:', error)
      toast.error("Failed to lease virtual number")
      setLeasingStep('confirm')
    }
  }

  // Delete sender
  const deleteSender = async (senderId: string) => {
    try {
      const response = await fetch(`/api/senders/custom?id=${senderId}`, {
        method: 'DELETE'
      })
      
      const data = await response.json()
      
      if (data.error) {
        toast.error(data.error)
        return
      }
      
      toast.success("Sender deleted successfully")
      
      await fetchSenders(false)
    } catch (error) {
      console.error('Error deleting sender:', error)
      toast.error("Failed to delete sender")
    }
  }

  // Set page header
  useEffect(() => {
    setPageHeader({
      title: "Senders",
      actions: [
        {
          label: "Add Virtual Number",
          icon: <Phone className="h-4 w-4" />,
          onClick: openVirtualNumberDialog,
        },
        {
          label: "Add Custom Sender",
          icon: <Hash className="h-4 w-4" />,
          onClick: () => setAddDialogOpen(true),
        },
      ],
    })

    // Cleanup function to clear page header when component unmounts
    return () => {
      setPageHeader(null)
    }
  }, [setPageHeader])

  // Fetch senders on component mount with auto-sync
  useEffect(() => {
    fetchSenders(true) // Auto-sync on page load
  }, [])

  const getStatusBadge = (status: string) => {
    const statusVariants = {
      active: "translucent-green",
      inactive: "translucent-gray",
      pending: "translucent-orange",
      expired: "translucent-red",
    }

    return <Badge variant={statusVariants[status] || "translucent-gray"}>{status}</Badge>
  }

  const getTypeBadge = (type: string) => {
    const typeVariants = {
      virtual_number: "translucent-blue",
      mobile_number: "translucent-green",
      alphanumeric: "translucent-purple",
    }

    const typeLabels = {
      virtual_number: "Virtual Number",
      mobile_number: "Mobile Number",
      alphanumeric: "Alphanumeric",
    }

    return <Badge variant={typeVariants[type] || "translucent-gray"}>
      {typeLabels[type] || type}
    </Badge>
  }

  const getUseCaseBadge = (useCase: string) => {
    const useCaseVariants = {
      marketing: "translucent-orange",
      transactional: "translucent-blue", 
      private: "translucent-purple",
      otp: "translucent-green",
    }

    const useCaseLabels = {
      marketing: "Marketing",
      transactional: "Transactional",
      private: "Private",
      otp: "OTP",
    }

    return (
      <Badge variant={useCaseVariants[useCase] || "translucent-gray"}>
        {useCaseLabels[useCase] || useCase}
      </Badge>
    )
  }

  const ActionMenu = ({ item }: { item: Sender }) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => editSender(item)}>
          <Edit className="mr-2 h-4 w-4" />
          Edit Sender
        </DropdownMenuItem>
        {item.source === 'manual' && (
          <DropdownMenuItem 
            className="text-destructive"
            onClick={() => deleteSender(item.id)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )

  const columns = [
    {
      header: "Sender ID",
      accessorKey: "sender_id" as keyof Sender,
    },
    {
      header: "Description",
      accessorKey: "description" as keyof Sender,
      cell: (row: Sender) => row.description || "—",
    },
    {
      header: "Type",
      accessorKey: "type" as keyof Sender,
      cell: (row: Sender) => getTypeBadge(row.type),
    },
    {
      header: "Use Case",
      accessorKey: "use_case" as keyof Sender,
      cell: (row: Sender) => getUseCaseBadge(row.use_case),
    },
    {
      header: "Status",
      accessorKey: "status" as keyof Sender,
      cell: (row: Sender) => (
        <div className="flex items-center gap-2">
          {getStatusBadge(row.status)}
          {row.approval_status && row.approval_status !== 'approved' && (
            <Badge variant="outline" className="text-xs">
              {row.approval_status}
            </Badge>
          )}
        </div>
      ),
    },
    {
      header: "Countries",
      accessorKey: "country" as keyof Sender,
      cell: (row: Sender) => {
        if (row.country) {
          const countries = row.country.split(',')
          return countries.length > 2 
            ? `${countries.slice(0, 2).join(', ')} +${countries.length - 2} more`
            : countries.join(', ')
        }
        return "—"
      },
    },
    {
      header: "Price",
      accessorKey: "price" as keyof Sender,
      cell: (row: Sender) => row.price ? `$${row.price}/month` : "—",
    },
    {
      header: "Actions",
      accessorKey: "actions" as keyof Sender,
      cell: (row: Sender) => <ActionMenu item={row} />,
    },
  ]

  if (loading) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <div className="text-center py-8">Loading senders...</div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <KudosityTable data={senders} columns={columns} />

        {/* Add Custom Sender Dialog */}
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add Custom Sender</DialogTitle>
              <DialogDescription>
                Add a custom sender ID. Alphanumeric senders need approval before use.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="type">Sender Type</Label>
                <Select 
                  value={customSenderForm.type} 
                  onValueChange={(value) => setCustomSenderForm(prev => ({ 
                    ...prev, 
                    type: value,
                    sender_id: '', // Reset sender ID when type changes
                    countries: value === 'mobile_number' ? [] : prev.countries // Clear countries for mobile numbers
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="alphanumeric">Alphanumeric (e.g., ACME)</SelectItem>
                    <SelectItem value="mobile_number">Mobile Number</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="sender_id">
                  {customSenderForm.type === 'alphanumeric' ? 'Alphanumeric ID' : 'Mobile Number'}
                </Label>
                <Input
                  id="sender_id"
                  placeholder={
                    customSenderForm.type === 'alphanumeric' 
                      ? "e.g., ACME (max 11 letters)" 
                      : "e.g., +61412345678"
                  }
                  value={customSenderForm.sender_id}
                  onChange={(e) => setCustomSenderForm(prev => ({ ...prev, sender_id: e.target.value }))}
                />
                {customSenderForm.type === 'alphanumeric' && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Maximum 11 letters only. No spaces, numbers, or special characters.
                  </p>
                )}
              </div>

              {customSenderForm.type === 'alphanumeric' && (
                <div>
                  <Label>Countries (Select all countries where this sender will be used)</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start">
                        {customSenderForm.countries.length === 0 
                          ? "Select countries..."
                          : `${customSenderForm.countries.length} countries selected`
                        }
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput placeholder="Search countries..." />
                        <CommandList>
                          <CommandEmpty>No countries found.</CommandEmpty>
                          <CommandGroup>
                            {countryOptions.map((country) => (
                              <CommandItem
                                key={country}
                                onSelect={() => {
                                  const isSelected = customSenderForm.countries.includes(country)
                                  setCustomSenderForm(prev => ({
                                    ...prev,
                                    countries: isSelected
                                      ? prev.countries.filter(c => c !== country)
                                      : [...prev.countries, country]
                                  }))
                                }}
                              >
                                <Checkbox
                                  checked={customSenderForm.countries.includes(country)}
                                  className="mr-2"
                                />
                                {country}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <p className="text-xs text-muted-foreground mt-1">
                    Note: Not all countries support alphanumeric senders. Check with Kudosity for availability.
                  </p>
                </div>
              )}

              <div>
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  placeholder="e.g., Marketing campaigns, Customer support"
                  value={customSenderForm.description}
                  onChange={(e) => setCustomSenderForm(prev => ({ ...prev, description: e.target.value }))}
                  rows={2}
                />
              </div>

              <div>
                <Label htmlFor="use_case">Use Case</Label>
                <Select
                  value={customSenderForm.use_case}
                  onValueChange={(value: 'marketing' | 'transactional' | 'private' | 'otp') => 
                    setCustomSenderForm(prev => ({ ...prev, use_case: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select use case" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="marketing">Marketing</SelectItem>
                    <SelectItem value="transactional">Transactional</SelectItem>
                    <SelectItem value="private">Private</SelectItem>
                    <SelectItem value="otp">OTP</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={addCustomSender}>
                  Add Sender
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Sender Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Sender</DialogTitle>
              <DialogDescription>
                Update the description and settings for this sender.
              </DialogDescription>
            </DialogHeader>
            {editingSender && (
              <div className="space-y-4">
                <div>
                  <Label>Sender ID</Label>
                  <Input value={editingSender.sender_id} disabled className="bg-muted" />
                </div>
                
                <div>
                  <Label htmlFor="edit_description">Description</Label>
                  <Textarea
                    id="edit_description"
                    placeholder="e.g., Marketing campaigns, Customer support"
                    value={editingSender.description || ''}
                    onChange={(e) => setEditingSender(prev => prev ? { ...prev, description: e.target.value } : null)}
                    rows={2}
                  />
                </div>

                <div>
                  <Label htmlFor="edit_use_case">Use Case</Label>
                  <Select
                    value={editingSender.use_case}
                    onValueChange={(value: 'marketing' | 'transactional' | 'private' | 'otp') => 
                      setEditingSender(prev => prev ? { ...prev, use_case: value } : null)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select use case" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="marketing">Marketing</SelectItem>
                      <SelectItem value="transactional">Transactional</SelectItem>
                      <SelectItem value="private">Private</SelectItem>
                      <SelectItem value="otp">OTP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {editingSender.type === 'alphanumeric' && (
                  <div>
                    <Label>Countries</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start">
                          {!editingSender.country || editingSender.country === '' 
                            ? "Select countries..."
                            : `${editingSender.country.split(',').length} countries selected`
                          }
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0">
                        <Command>
                          <CommandInput placeholder="Search countries..." />
                          <CommandList>
                            <CommandEmpty>No countries found.</CommandEmpty>
                            <CommandGroup>
                              {countryOptions.map((country) => {
                                const selectedCountries = editingSender.country ? editingSender.country.split(',') : []
                                const isSelected = selectedCountries.includes(country)
                                return (
                                  <CommandItem
                                    key={country}
                                    onSelect={() => {
                                      const newCountries = isSelected
                                        ? selectedCountries.filter(c => c !== country)
                                        : [...selectedCountries, country]
                                      setEditingSender(prev => prev ? { 
                                        ...prev, 
                                        country: newCountries.join(',') 
                                      } : null)
                                    }}
                                  >
                                    <Checkbox
                                      checked={isSelected}
                                      className="mr-2"
                                    />
                                    {country}
                                  </CommandItem>
                                )
                              })}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                )}

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={updateSender}>
                    Update Sender
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Add Virtual Number Dialog */}
        <Dialog open={addVirtualDialogOpen} onOpenChange={setAddVirtualDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Lease Virtual Number</DialogTitle>
              <DialogDescription>
                {leasingStep === 'select' && "Select an available virtual number from Kudosity"}
                {leasingStep === 'confirm' && "Review your selection and confirm the lease"}
                {leasingStep === 'lease' && "Leasing your virtual number..."}
              </DialogDescription>
            </DialogHeader>
            
            {leasingStep === 'select' && (
              <div className="space-y-4">
                {loadingAvailable ? (
                  <div className="text-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                    Loading available numbers...
                  </div>
                ) : (
                  <>
                    {availableNumbers.length > 0 ? (
                      <>
                        <div className="space-y-2">
                          <Label>Available Numbers ({availablePagination.total_numbers} total)</Label>
                          <div className="max-h-60 overflow-y-auto space-y-2 border rounded-lg p-2">
                            {availableNumbers.map((number) => (
                              <div 
                                key={number.number}
                                className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                                  selectedNumber?.number === number.number 
                                    ? 'border-primary bg-primary/5' 
                                    : 'border-muted hover:border-primary/50'
                                }`}
                                onClick={() => setSelectedNumber(number)}
                              >
                                <div className="flex justify-between items-center">
                                  <div>
                                    <div className="font-medium">{number.number}</div>
                                    {number.country && (
                                      <div className="text-sm text-muted-foreground">{number.country}</div>
                                    )}
                                  </div>
                                  <div className="text-right">
                                    <div className="font-semibold">${number.price}/month</div>
                                    <div className="text-xs text-muted-foreground">
                                      {number.capabilities?.join(', ') || 'SMS'}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Pagination */}
                        {availablePagination.total_pages > 1 && (
                          <div className="flex justify-between items-center">
                            <div className="text-sm text-muted-foreground">
                              Page {availablePagination.current_page} of {availablePagination.total_pages}
                            </div>
                            <div className="space-x-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                disabled={availablePagination.current_page <= 1}
                                onClick={() => fetchAvailableNumbers(availablePagination.current_page - 1)}
                              >
                                Previous
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                disabled={availablePagination.current_page >= availablePagination.total_pages}
                                onClick={() => fetchAvailableNumbers(availablePagination.current_page + 1)}
                              >
                                Next
                              </Button>
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        No available numbers found. Try checking a different country or contact Kudosity support.
                      </div>
                    )}
                  </>
                )}

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setAddVirtualDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={() => setLeasingStep('confirm')}
                    disabled={!selectedNumber}
                  >
                    Continue
                  </Button>
                </div>
              </div>
            )}

            {leasingStep === 'confirm' && selectedNumber && (
              <div className="space-y-4">
                <div className="p-4 border rounded-lg bg-muted/30">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-semibold text-lg">{selectedNumber.number}</h3>
                      {selectedNumber.country && (
                        <p className="text-sm text-muted-foreground">{selectedNumber.country}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-lg">${selectedNumber.price}/month</div>
                      <div className="text-xs text-muted-foreground">
                        {selectedNumber.capabilities?.join(', ') || 'SMS'}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-sm text-muted-foreground">
                    This number will be charged monthly to your Kudosity account. You can cancel anytime.
                  </div>
                </div>

                <div>
                  <Label htmlFor="forward_url">Forward URL (Optional)</Label>
                  <Input
                    id="forward_url"
                    placeholder="https://your-webhook.com/sms"
                    value={virtualNumberForm.forward_url}
                    onChange={(e) => setVirtualNumberForm(prev => ({ ...prev, forward_url: e.target.value }))}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    URL to receive inbound SMS messages. Leave blank if not needed.
                  </p>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setLeasingStep('select')}>
                    Back
                  </Button>
                  <Button onClick={leaseVirtualNumber}>
                    Lease Number (${selectedNumber.price}/month)
                  </Button>
                </div>
              </div>
            )}

            {leasingStep === 'lease' && (
              <div className="text-center py-8">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                <div className="font-medium">Leasing virtual number...</div>
                <div className="text-sm text-muted-foreground">This may take a moment</div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  )
}
