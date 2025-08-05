"use client"

import { useState, useEffect, useMemo } from "react"
import { KudosityTable, type KudosityTableColumn } from "@/components/KudosityTable"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Download, UserPlus, Trash2, ArrowUpIcon, ArrowDownIcon } from "lucide-react"
import { profilesApi } from "@/lib/profiles-api"

interface ProfileTableData {
  id: string
  firstName: string
  lastName: string
  email: string
  mobileNumber: string | null // This can stay as mobileNumber for display purposes
  role: string
  status: "Active" | "Inactive" | "Unsubscribed" | "Bounced" | "Spam Complaint"
  lastLogin: string | null
  teams: string[] | null
  dateAdded: string
  avatarUrl?: string
  timezone?: string
  performanceMetrics?: Record<string, any>
}

interface ProfilesTableProps {
  onProfileSelect?: (id: string) => void
}

// Helper function to extract country info from mobile number
const getCountryInfo = (mobileNumber?: string) => {
  if (!mobileNumber) return { code: "nz", name: "New Zealand" }

  // Simple country detection based on mobile number format
  if (mobileNumber.startsWith("+64") || mobileNumber.startsWith("64")) {
    return { code: "nz", name: "New Zealand" }
  } else if (mobileNumber.startsWith("+61") || mobileNumber.startsWith("61")) {
    return { code: "au", name: "Australia" }
  } else if (mobileNumber.startsWith("+1")) {
    return { code: "us", name: "United States" }
  } else if (mobileNumber.startsWith("+44")) {
    return { code: "gb", name: "United Kingdom" }
  }

  return { code: "nz", name: "New Zealand" }
}

// Transform database profile to table format
const transformProfileToTableData = (profile: any): ProfileTableData => {
  return {
    id: profile.id || "",
    firstName: profile.first_name || "",
    lastName: profile.last_name || "",
    email: profile.email || "",
    mobileNumber: profile.mobile || null, // Using 'mobile' from database
    role: "User", // Default since role doesn't exist in schema
    status: (profile.status as "Active" | "Inactive") || "Active",
    lastLogin: profile.last_login || null,
    teams: null, // Teams doesn't exist in schema
    dateAdded: profile.created_at || new Date().toISOString(),
    avatarUrl: profile.avatar_url,
    timezone: profile.timezone,
    performanceMetrics: profile.performance_metrics,
  }
}

export function ProfilesTable({ onProfileSelect }: ProfilesTableProps) {
  console.log("ProfilesTable component mounted/rendered")

  const [profiles, setProfiles] = useState<ProfileTableData[]>([])
  const [selectedProfiles, setSelectedProfiles] = useState<ProfileTableData[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sortConfig, setSortConfig] = useState<{ key: keyof ProfileTableData; direction: "asc" | "desc" } | null>(null)

  console.log("ProfilesTable state:", { profilesCount: profiles.length, loading, error })

  // Fetch profiles from Supabase
  useEffect(() => {
    console.log("useEffect triggered in ProfilesTable")

    async function fetchProfiles() {
      try {
        console.log("Starting to fetch profiles from Supabase...")
        setLoading(true)
        setError(null)

        const result = await profilesApi.getProfiles({ limit: 100 })

        console.log("API result:", result)

        if (result.error) {
          throw new Error(`API Error: ${result.error}`)
        }

        if (!result.data || result.data.length === 0) {
          console.warn("No profiles found in database")
          setProfiles([])
          return
        }

        console.log("Raw profile data:", result.data)
        const transformedData = result.data.map(transformProfileToTableData)
        console.log("Transformed profile data:", transformedData)

        setProfiles(transformedData)
      } catch (err) {
        console.error("Error fetching profiles:", err)
        setError(err instanceof Error ? err.message : "Failed to fetch profiles")
      } finally {
        setLoading(false)
      }
    }

    fetchProfiles()
  }, [])

  const getCountryFlag = (countryCode: string) => {
    const countryFlags: Record<string, string> = {
      us: "🇺🇸",
      gb: "🇬🇧",
      au: "🇦🇺",
      nz: "🇳🇿",
    }
    return countryFlags[countryCode] || "🏳️"
  }

  const getStatusBadge = (status: ProfileTableData["status"]) => {
    switch (status) {
      case "Active":
        return <Badge variant="translucent-green">Active</Badge>
      case "Inactive":
        return <Badge variant="translucent-gray">Inactive</Badge>
      case "Unsubscribed":
        return <Badge variant="translucent-orange">Unsubscribed</Badge>
      case "Bounced":
        return <Badge variant="translucent-orange">Bounced</Badge>
      case "Spam Complaint":
        return <Badge variant="translucent-orange">Spam Complaint</Badge>
      default:
        return <Badge variant="translucent-blue">{status}</Badge>
    }
  }

  const handleSort = (key: keyof ProfileTableData) => {
    let direction: "asc" | "desc" = "asc"
    if (sortConfig?.key === key && sortConfig.direction === "asc") {
      direction = "desc"
    }
    setSortConfig({ key, direction })
  }

  const sortedProfiles = useMemo(() => {
    if (!sortConfig) return profiles

    return [...profiles].sort((a, b) => {
      const key = sortConfig.key

      if (a[key] === null || a[key] === undefined) return sortConfig.direction === "asc" ? -1 : 1
      if (b[key] === null || b[key] === undefined) return sortConfig.direction === "asc" ? 1 : -1

      const aValue = typeof a[key] === "string" ? a[key]!.toString().toLowerCase() : a[key]
      const bValue = typeof b[key] === "string" ? b[key]!.toString().toLowerCase() : b[key]

      if (aValue < bValue) {
        return sortConfig.direction === "asc" ? -1 : 1
      }
      if (aValue > bValue) {
        return sortConfig.direction === "asc" ? 1 : -1
      }
      return 0
    })
  }, [profiles, sortConfig])

  const columns: KudosityTableColumn<ProfileTableData>[] = [
    {
      header: (
        <div onClick={() => handleSort("id")} className="flex items-center gap-1 cursor-pointer">
          Profile ID
          {sortConfig?.key === "id" &&
            (sortConfig.direction === "asc" ? (
              <ArrowUpIcon className="h-3 w-3" />
            ) : (
              <ArrowDownIcon className="h-3 w-3" />
            ))}
        </div>
      ),
      accessorKey: "id",
      width: "120px",
      cell: (row) => (
        <button
          onClick={() => {
            if (onProfileSelect) {
              onProfileSelect(row.id)
            } else {
              // Navigate to edit page if no callback provided
              window.location.href = `/profiles/edit/${row.id}`
            }
          }}
          className="text-blue-600 hover:text-blue-800 underline"
        >
          {row.id.substring(0, 8)}...
        </button>
      ),
    },
    {
      header: (
        <div onClick={() => handleSort("firstName")} className="flex items-center gap-1 cursor-pointer">
          First Name
          {sortConfig?.key === "firstName" &&
            (sortConfig.direction === "asc" ? (
              <ArrowUpIcon className="h-3 w-3" />
            ) : (
              <ArrowDownIcon className="h-3 w-3" />
            ))}
        </div>
      ),
      accessorKey: "firstName",
      width: "150px",
    },
    {
      header: (
        <div onClick={() => handleSort("lastName")} className="flex items-center gap-1 cursor-pointer">
          Last Name
          {sortConfig?.key === "lastName" &&
            (sortConfig.direction === "asc" ? (
              <ArrowUpIcon className="h-3 w-3" />
            ) : (
              <ArrowDownIcon className="h-3 w-3" />
            ))}
        </div>
      ),
      accessorKey: "lastName",
      width: "150px",
    },
    {
      header: (
        <div onClick={() => handleSort("email")} className="flex items-center gap-1 cursor-pointer">
          Email Address
          {sortConfig?.key === "email" &&
            (sortConfig.direction === "asc" ? (
              <ArrowUpIcon className="h-3 w-3" />
            ) : (
              <ArrowDownIcon className="h-3 w-3" />
            ))}
        </div>
      ),
      accessorKey: "email",
      width: "250px",
    },
    {
      header: (
        <div onClick={() => handleSort("mobileNumber")} className="flex items-center gap-1 cursor-pointer">
          Mobile Number
          {sortConfig?.key === "mobileNumber" &&
            (sortConfig.direction === "asc" ? (
              <ArrowUpIcon className="h-3 w-3" />
            ) : (
              <ArrowDownIcon className="h-3 w-3" />
            ))}
        </div>
      ),
      accessorKey: "mobileNumber",
      cell: (row) => {
        if (!row.mobileNumber) {
          return <span className="text-gray-400">Not provided</span>
        }
        const countryInfo = getCountryInfo(row.mobileNumber)
        return (
          <div className="flex items-center">
            <span className="mr-2">{getCountryFlag(countryInfo.code)}</span>
            {row.mobileNumber}
          </div>
        )
      },
      width: "200px",
    },
    {
      header: (
        <div onClick={() => handleSort("status")} className="flex items-center gap-1 cursor-pointer">
          Status
          {sortConfig?.key === "status" &&
            (sortConfig.direction === "asc" ? (
              <ArrowUpIcon className="h-3 w-3" />
            ) : (
              <ArrowDownIcon className="h-3 w-3" />
            ))}
        </div>
      ),
      accessorKey: "status",
      cell: (row) => getStatusBadge(row.status),
      width: "120px",
    },
    {
      header: (
        <div onClick={() => handleSort("lastLogin")} className="flex items-center gap-1 cursor-pointer">
          Last Login
          {sortConfig?.key === "lastLogin" &&
            (sortConfig.direction === "asc" ? (
              <ArrowUpIcon className="h-3 w-3" />
            ) : (
              <ArrowDownIcon className="h-3 w-3" />
            ))}
        </div>
      ),
      accessorKey: "lastLogin",
      width: "150px",
      cell: (row) => (row.lastLogin ? new Date(row.lastLogin).toLocaleDateString() : "Never"),
    },
    {
      header: (
        <div onClick={() => handleSort("dateAdded")} className="flex items-center gap-1 cursor-pointer">
          Date Added
          {sortConfig?.key === "dateAdded" &&
            (sortConfig.direction === "asc" ? (
              <ArrowUpIcon className="h-3 w-3" />
            ) : (
              <ArrowDownIcon className="h-3 w-3" />
            ))}
        </div>
      ),
      accessorKey: "dateAdded",
      width: "150px",
      cell: (row) => new Date(row.dateAdded).toLocaleDateString(),
    },
  ]

  const actions = [
    {
      label: "New Profile",
      icon: <UserPlus className="mr-2 h-4 w-4" />,
      onClick: () => {
        // Navigate to new profile page or open modal
        window.location.href = "/profiles/new"
      },
    },
    {
      label: "Export Data",
      icon: <Download className="mr-2 h-4 w-4" />,
      onClick: () => {
        // Export selected profiles or all profiles
        const dataToExport = selectedProfiles.length > 0 ? selectedProfiles : profiles
        console.log("Exporting profiles:", dataToExport)
        // Implement CSV export logic here
      },
    },
    {
      label: "Delete Selected",
      icon: <Trash2 className="mr-2 h-4 w-4" />,
      onClick: async () => {
        if (selectedProfiles.length === 0) return

        const confirmed = window.confirm(`Are you sure you want to delete ${selectedProfiles.length} profile(s)?`)
        if (confirmed) {
          // Implement bulk delete
          console.log(
            "Deleting profiles:",
            selectedProfiles.map((p) => p.id),
          )
          // Add actual delete logic here
        }
      },
      disabled: selectedProfiles.length === 0,
      variant: "destructive" as const,
    },
  ]

  const filterOptions = [
    { label: "All Profiles", value: "all" },
    { label: "Active", value: "Active" },
    { label: "Inactive", value: "Inactive" },
    { label: "Admin", value: "admin" },
    { label: "Manager", value: "manager" },
    { label: "User", value: "user" },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profiles...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <p className="text-red-600 mb-4">Error loading profiles:</p>
          <p className="text-sm text-gray-600 mb-4 bg-gray-100 p-3 rounded">{error}</p>
          <Button
            onClick={() => window.location.reload()}
            variant="default"
            className="mr-2"
          >
            Retry
          </Button>
          <Button
            onClick={() => {
              setError(null)
              setLoading(true)
              // Trigger refetch
              window.location.reload()
            }}
            variant="secondary"
          >
            Debug
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Debug info - remove this in production */}
      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded text-sm">
        <p className="font-medium text-blue-800">Database Connection Status</p>
        <p className="text-blue-700">{profiles.length} profile(s) loaded from Supabase database</p>
        {profiles.length > 0 && (
          <p className="text-blue-600 text-xs mt-1">
            Latest: {profiles[0].firstName} {profiles[0].lastName} ({profiles[0].email})
          </p>
        )}
      </div>

      <KudosityTable
        title="Team Profiles"
        data={sortedProfiles}
        columns={columns}
        selectable={true}
        onSelectionChange={setSelectedProfiles}
        onSearch={(term) => setSearchTerm(term)}
        searchPlaceholder="Search by name, email, or role..."
        actions={actions}
        filterOptions={filterOptions}
      />
    </div>
  )
}
