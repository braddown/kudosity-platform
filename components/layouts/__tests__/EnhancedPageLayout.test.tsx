/**
 * EnhancedPageLayout Component Tests
 * 
 * Tests for the EnhancedPageLayout component using React Testing Library.
 * This demonstrates the testing patterns for our layout components.
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import EnhancedPageLayout from '../EnhancedPageLayout'
import { usePageHeader } from '../../PageHeaderContext'
import { useEnhancedNavigation } from '@/hooks/useEnhancedNavigation'

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(() => '/test'),
  useSearchParams: jest.fn(() => new URLSearchParams()),
}))

// Mock page header context
jest.mock('../../PageHeaderContext', () => ({
  usePageHeader: jest.fn(),
}))

// Mock enhanced navigation hook
jest.mock('@/hooks/useEnhancedNavigation', () => ({
  useEnhancedNavigation: jest.fn(),
}))

const mockRouter = {
  push: jest.fn(),
  back: jest.fn(),
}

const mockSetPageHeader = jest.fn()
const mockGoBack = jest.fn()
const mockCanGoBack = true

const mockDynamicBreadcrumbs = [
  { label: 'Home', path: '/' },
  { label: 'Test Page', path: '/test' },
]

describe('EnhancedPageLayout', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    ;(useRouter as jest.Mock).mockReturnValue(mockRouter)
    ;(usePageHeader as jest.Mock).mockReturnValue({
      setPageHeader: mockSetPageHeader,
    })
    ;(useEnhancedNavigation as jest.Mock).mockReturnValue({
      dynamicBreadcrumbs: mockDynamicBreadcrumbs,
      goBack: mockGoBack,
      canGoBack: mockCanGoBack,
    })
  })

  describe('basic rendering', () => {
    it('should render with title and children', () => {
      render(
        <EnhancedPageLayout title="Test Page">
          <div>Test Content</div>
        </EnhancedPageLayout>
      )

      expect(screen.getByText('Test Page')).toBeInTheDocument()
      expect(screen.getByText('Test Content')).toBeInTheDocument()
    })

    it('should render with description', () => {
      render(
        <EnhancedPageLayout title="Test Page" description="This is a test page">
          <div>Test Content</div>
        </EnhancedPageLayout>
      )

      expect(screen.getByText('This is a test page')).toBeInTheDocument()
    })

    it('should render with subtitle and badge', () => {
      render(
        <EnhancedPageLayout
          title="Test Page"
          subtitle="Test Subtitle"
          badge={{ text: "New", variant: "default" }}
        >
          <div>Test Content</div>
        </EnhancedPageLayout>
      )

      expect(screen.getByText('Test Subtitle')).toBeInTheDocument()
      expect(screen.getByText('New')).toBeInTheDocument()
    })
  })

  describe('loading states', () => {
    it('should show loading spinner', () => {
      render(
        <EnhancedPageLayout
          title="Test Page"
          loading={{ loading: true, message: "Loading test data..." }}
        >
          <div>Test Content</div>
        </EnhancedPageLayout>
      )

      expect(screen.getByText('Loading test data...')).toBeInTheDocument()
      expect(screen.queryByText('Test Content')).not.toBeInTheDocument()
    })

    it('should show skeleton loading', () => {
      render(
        <EnhancedPageLayout
          title="Test Page"
          loading={{
            loading: true,
            showSkeleton: true,
            skeletonCount: 3,
          }}
        >
          <div>Test Content</div>
        </EnhancedPageLayout>
      )

      // Should show skeleton cards instead of spinner
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
      expect(screen.queryByText('Test Content')).not.toBeInTheDocument()
    })
  })

  describe('error states', () => {
    it('should show error message', () => {
      const mockError = new Error('Test error message')

      render(
        <EnhancedPageLayout
          title="Test Page"
          error={{
            error: mockError,
            errorTitle: "Custom Error Title",
            errorDetails: "Additional error details",
          }}
        >
          <div>Test Content</div>
        </EnhancedPageLayout>
      )

      expect(screen.getByText('Custom Error Title')).toBeInTheDocument()
      expect(screen.getByText('Test error message')).toBeInTheDocument()
      expect(screen.getByText('Additional error details')).toBeInTheDocument()
      expect(screen.queryByText('Test Content')).not.toBeInTheDocument()
    })

    it('should show retry button for recoverable errors', () => {
      const mockRetry = jest.fn()

      render(
        <EnhancedPageLayout
          title="Test Page"
          error={{
            error: "Test error",
            recoverable: true,
            onRetry: mockRetry,
          }}
        >
          <div>Test Content</div>
        </EnhancedPageLayout>
      )

      const retryButton = screen.getByText('Try Again')
      expect(retryButton).toBeInTheDocument()

      fireEvent.click(retryButton)
      expect(mockRetry).toHaveBeenCalled()
    })
  })

  describe('empty states', () => {
    it('should show empty state', () => {
      render(
        <EnhancedPageLayout
          title="Test Page"
          empty={{
            isEmpty: true,
            emptyTitle: "No data found",
            emptyDescription: "Try adding some items",
            emptyActions: [
              { label: "Add Item", onClick: jest.fn() }
            ]
          }}
        >
          <div>Test Content</div>
        </EnhancedPageLayout>
      )

      expect(screen.getByText('No data found')).toBeInTheDocument()
      expect(screen.getByText('Try adding some items')).toBeInTheDocument()
      expect(screen.getByText('Add Item')).toBeInTheDocument()
      expect(screen.queryByText('Test Content')).not.toBeInTheDocument()
    })

    it('should call empty action handlers', () => {
      const mockAction = jest.fn()

      render(
        <EnhancedPageLayout
          title="Test Page"
          empty={{
            isEmpty: true,
            emptyActions: [
              { label: "Test Action", onClick: mockAction }
            ]
          }}
        >
          <div>Test Content</div>
        </EnhancedPageLayout>
      )

      const actionButton = screen.getByText('Test Action')
      fireEvent.click(actionButton)
      expect(mockAction).toHaveBeenCalled()
    })
  })

  describe('breadcrumbs', () => {
    it('should show breadcrumbs when enabled', () => {
      render(
        <EnhancedPageLayout
          title="Test Page"
          breadcrumbs={{ showBreadcrumbs: true }}
        >
          <div>Test Content</div>
        </EnhancedPageLayout>
      )

      expect(screen.getByText('Home')).toBeInTheDocument()
      expect(screen.getByText('Test Page')).toBeInTheDocument()
    })

    it('should use custom breadcrumbs', () => {
      render(
        <EnhancedPageLayout
          title="Test Page"
          breadcrumbs={{
            showBreadcrumbs: true,
            customBreadcrumbs: [
              { label: 'Custom Home', path: '/' },
              { label: 'Custom Page', path: '/custom' },
            ]
          }}
        >
          <div>Test Content</div>
        </EnhancedPageLayout>
      )

      expect(screen.getByText('Custom Home')).toBeInTheDocument()
      expect(screen.getByText('Custom Page')).toBeInTheDocument()
    })
  })

  describe('actions', () => {
    it('should render action buttons', () => {
      const mockAction = jest.fn()

      render(
        <EnhancedPageLayout
          title="Test Page"
          actions={[
            {
              label: "Test Action",
              onClick: mockAction,
              variant: "default"
            }
          ]}
        >
          <div>Test Content</div>
        </EnhancedPageLayout>
      )

      const actionButton = screen.getByText('Test Action')
      expect(actionButton).toBeInTheDocument()

      fireEvent.click(actionButton)
      expect(mockAction).toHaveBeenCalled()
    })

    it('should handle loading actions', () => {
      render(
        <EnhancedPageLayout
          title="Test Page"
          actions={[
            {
              label: "Saving...",
              loading: true,
              disabled: true,
            }
          ]}
        >
          <div>Test Content</div>
        </EnhancedPageLayout>
      )

      const actionButton = screen.getByText('Saving...')
      expect(actionButton).toBeDisabled()
    })
  })

  describe('navigation', () => {
    it('should show back button when enabled', () => {
      render(
        <EnhancedPageLayout
          title="Test Page"
          showBackButton={true}
        >
          <div>Test Content</div>
        </EnhancedPageLayout>
      )

      const backButton = screen.getByText('Back')
      expect(backButton).toBeInTheDocument()
    })

    it('should handle back button click', () => {
      const mockOnBack = jest.fn()

      render(
        <EnhancedPageLayout
          title="Test Page"
          showBackButton={true}
          onBack={mockOnBack}
        >
          <div>Test Content</div>
        </EnhancedPageLayout>
      )

      const backButton = screen.getByText('Back')
      fireEvent.click(backButton)
      expect(mockOnBack).toHaveBeenCalled()
    })

    it('should use router.back when no custom back handler', () => {
      render(
        <EnhancedPageLayout
          title="Test Page"
          showBackButton={true}
        >
          <div>Test Content</div>
        </EnhancedPageLayout>
      )

      const backButton = screen.getByText('Back')
      fireEvent.click(backButton)
      expect(mockRouter.back).toHaveBeenCalled()
    })
  })

  describe('sidebar layout', () => {
    it('should render with sidebar', () => {
      render(
        <EnhancedPageLayout
          title="Test Page"
          withSidebar={true}
          sidebar={<div>Test Sidebar</div>}
        >
          <div>Test Content</div>
        </EnhancedPageLayout>
      )

      expect(screen.getByText('Test Content')).toBeInTheDocument()
      expect(screen.getByText('Test Sidebar')).toBeInTheDocument()
    })
  })

  describe('page header integration', () => {
    it('should set page header on mount', () => {
      render(
        <EnhancedPageLayout
          title="Test Page"
          description="Test Description"
          actions={[{ label: "Test Action" }]}
        >
          <div>Test Content</div>
        </EnhancedPageLayout>
      )

      expect(mockSetPageHeader).toHaveBeenCalledWith({
        title: "Test Page",
        description: "Test Description",
        actions: [{ label: "Test Action" }],
        showBackButton: false,
        backHref: undefined,
      })
    })

    it('should clear page header on unmount', () => {
      const { unmount } = render(
        <EnhancedPageLayout title="Test Page">
          <div>Test Content</div>
        </EnhancedPageLayout>
      )

      unmount()

      expect(mockSetPageHeader).toHaveBeenCalledWith(null)
    })
  })
})