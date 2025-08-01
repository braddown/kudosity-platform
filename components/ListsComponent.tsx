"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, Users, Mail } from "lucide-react"

interface List {
  id: string
  name: string
  description?: string
  member_count: number
  created_at: string
  updated_at: string
}

export default function ListsComponent() {
  const [lists, setLists] = useState<List[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchLists()
  }, [])

  const fetchLists = async () => {
    try {
      setLoading(true)
      setError(null)

      // For now, we'll use mock data since the lists table structure isn't fully defined
      const mockLists: List[] = [
        {
          id: "1",
          name: "Newsletter Subscribers",
          description: "Users who subscribed to our newsletter",
          member_count: 1250,
          created_at: "2024-01-15T10:00:00Z",
          updated_at: "2024-01-20T15:30:00Z",
        },
        {
          id: "2",
          name: "Premium Customers",
          description: "Customers with premium subscriptions",
          member_count: 89,
          created_at: "2024-01-10T09:00:00Z",
          updated_at: "2024-01-18T11:45:00Z",
        },
        {
          id: "3",
          name: "Trial Users",
          description: "Users currently on trial",
          member_count: 342,
          created_at: "2024-01-20T14:00:00Z",
          updated_at: "2024-01-22T16:20:00Z",
        },
      ]

      setLists(mockLists)
    } catch (err) {
      console.error("Error fetching lists:", err)
      setError("Failed to load lists")
    } finally {
      setLoading(false)
    }
  }

  const filteredLists = lists.filter(
    (list) =>
      list.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (list.description && list.description.toLowerCase().includes(searchTerm.toLowerCase())),
  )

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Lists</h1>
            <p className="text-muted-foreground">Manage your contact lists and segments</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-3 bg-gray-200 rounded w-full"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Lists</h1>
            <p className="text-muted-foreground">Manage your contact lists and segments</p>
          </div>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={fetchLists}>Try Again</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Lists</h1>
          <p className="text-muted-foreground">Manage your contact lists and segments</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create List
        </Button>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search lists..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredLists.map((list) => (
          <Card key={list.id} className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="truncate">{list.name}</span>
                <Badge variant="secondary" className="ml-2">
                  <Users className="h-3 w-3 mr-1" />
                  {list.member_count.toLocaleString()}
                </Badge>
              </CardTitle>
              {list.description && <CardDescription className="line-clamp-2">{list.description}</CardDescription>}
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Updated {new Date(list.updated_at).toLocaleDateString()}</span>
                <Button variant="ghost" size="sm">
                  <Mail className="h-4 w-4 mr-1" />
                  Send
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredLists.length === 0 && searchTerm && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-muted-foreground">No lists found matching "{searchTerm}"</p>
            </div>
          </CardContent>
        </Card>
      )}

      {lists.length === 0 && !searchTerm && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No lists yet</h3>
              <p className="text-muted-foreground mb-4">Create your first list to start organizing your contacts</p>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First List
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
