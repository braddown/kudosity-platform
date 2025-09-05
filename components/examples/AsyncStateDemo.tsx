"use client"

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useApiState, useMutationState } from "@/hooks/use-async-state"
import { LoadingState, ErrorState, EmptyState, AsyncStateWrapper } from "@/components/ui/async-states"
import { Badge } from "@/components/ui/badge"
import { RefreshCw, Plus } from "lucide-react"
import { logger } from "@/lib/utils/logger"

// Demo data interface
interface User {
  id: string
  name: string
  email: string
  status: 'active' | 'inactive'
}

/**
 * Demo component showing the old manual approach vs new async state patterns
 */
export function AsyncStateDemo() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Async State Patterns Demo</h2>
        <p className="text-muted-foreground">
          Demonstration of the new standardized async state patterns.
        </p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>✅ New Standardized Approach</CardTitle>
          </CardHeader>
          <CardContent>
            <NewApproachDemo />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Individual Components</CardTitle>
          </CardHeader>
          <CardContent>
            <IndividualComponentsDemo />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Mutations Example</CardTitle>
          </CardHeader>
          <CardContent>
            <MutationsDemo />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

/**
 * Demo using the new useApiState hook with automatic state management
 */
function NewApproachDemo() {
  const { render } = useApiState<User[]>('/api/demo-users', {
    loadingMessage: 'Loading users...',
    emptyState: {
      title: 'No users found',
      description: 'Add some users to get started.',
      action: {
        label: 'Add User',
        onClick: () => logger.debug('Add user clicked')
      }
    },
    // Simulate API call with setTimeout
    transform: () => {
      // Mock data for demo
      return [
        { id: '1', name: 'John Doe', email: 'john@example.com', status: 'active' },
        { id: '2', name: 'Jane Smith', email: 'jane@example.com', status: 'inactive' },
        { id: '3', name: 'Bob Johnson', email: 'bob@example.com', status: 'active' },
      ]
    }
  })

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        With <code>useApiState</code>, loading, error, and empty states are handled automatically:
      </p>
      
      {render((users) => (
        <div className="space-y-2">
          <p className="font-medium">Users ({users.length})</p>
          {users.map((user) => (
            <div key={user.id} className="flex items-center justify-between p-3 border rounded">
              <div>
                <p className="font-medium">{user.name}</p>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
              <Badge variant={user.status === 'active' ? 'default' : 'secondary'}>
                {user.status}
              </Badge>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

/**
 * Demo showing individual async state components
 */
function IndividualComponentsDemo() {
  const [demoState, setDemoState] = React.useState<'loading' | 'error' | 'empty' | 'success'>('loading')

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Loading States
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => setDemoState('loading')}
            >
              Show
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {demoState === 'loading' && (
            <LoadingState message="Loading users..." variant="spinner" />
          )}
          {demoState !== 'loading' && (
            <div className="space-y-2">
              <LoadingState size="sm" message="Small spinner" />
              <LoadingState variant="skeleton" message="Skeleton loading" />
              <LoadingState variant="dots" message="Dots animation" />
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Error States
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => setDemoState('error')}
            >
              Show
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {demoState === 'error' && (
            <ErrorState
              error={{ message: "Failed to load users", code: 500 }}
              onRetry={() => logger.debug('Retry clicked')}
              variant="default"
            />
          )}
          {demoState !== 'error' && (
            <div className="space-y-2">
              <ErrorState
                error="Network error"
                variant="inline"
                onRetry={() => logger.debug('Retry')}
              />
              <ErrorState
                error="Validation failed"
                variant="minimal"
              />
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Empty States  
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => setDemoState('empty')}
            >
              Show
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {demoState === 'empty' && (
            <EmptyState
              title="No data available"
              description="There's nothing to show here yet."
              action={{
                label: "Add Data",
                onClick: () => logger.debug('Add data clicked')
              }}
            />
          )}
          {demoState !== 'empty' && (
            <EmptyState
              title="Search results"
              description="No items match your criteria."
              variant="minimal"
            />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Combined Wrapper
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => setDemoState('success')}
            >
              Show
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AsyncStateWrapper
            loading={demoState === 'loading'}
            error={demoState === 'error' ? { message: "Something went wrong" } : null}
            data={demoState === 'success' ? ['item1', 'item2'] : null}
            isEmpty={demoState === 'empty'}
            onRetry={() => logger.debug('Wrapper retry')}
          >
            <div className="p-4 bg-green-50 rounded border border-green-200">
              ✅ Success state - your content goes here!
            </div>
          </AsyncStateWrapper>
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * Demo showing mutation handling
 */
function MutationsDemo() {
  const { mutate, loading, error, data } = useMutationState<User, { name: string; email: string }>(
    async (userData) => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      return {
        id: Date.now().toString(),
        ...userData,
        status: 'active' as const
      }
    },
    {
      onSuccess: (user) => {
        logger.debug('User created:', user)
      }
    }
  )

  const handleCreateUser = () => {
    mutate({
      name: 'New User',
      email: 'newuser@example.com'
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button onClick={handleCreateUser} disabled={loading}>
          {loading && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
          Create User
        </Button>
      </div>

      {error && (
        <ErrorState error={error} variant="inline" />
      )}

      {data && (
        <div className="p-4 bg-green-50 rounded border border-green-200">
          <p className="font-medium text-green-800">User created successfully!</p>
          <p className="text-sm text-green-600">
            {data.name} ({data.email})
          </p>
        </div>
      )}
    </div>
  )
}

export default AsyncStateDemo