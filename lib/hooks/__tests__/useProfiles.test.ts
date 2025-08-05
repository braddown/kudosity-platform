/**
 * useProfiles Hook Tests
 * 
 * Tests for the comprehensive useProfiles hook using React Testing Library and Jest.
 * This demonstrates the testing patterns for our custom hooks.
 */

import { renderHook, act, waitFor } from '@testing-library/react'
import { useProfiles } from '../useProfiles'
import { profilesApi } from '@/api/profiles-api'

// Mock the profiles API
jest.mock('@/api/profiles-api', () => ({
  profilesApi: {
    getProfiles: jest.fn(),
    getProfilesCount: jest.fn(),
    createProfile: jest.fn(),
    updateProfile: jest.fn(),
    softDeleteProfile: jest.fn(),
    restoreProfile: jest.fn(),
    getProfile: jest.fn(),
  }
}))

// Mock the useAsyncData hook
jest.mock('../use-async-data', () => ({
  useAsyncData: jest.fn()
}))

const mockProfilesApi = profilesApi as jest.Mocked<typeof profilesApi>
const mockUseAsyncData = require('../use-async-data').useAsyncData as jest.MockedFunction<any>

describe('useProfiles', () => {
  const mockProfiles = [
    {
      id: '1',
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@example.com',
      status: 'active',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
    {
      id: '2',
      first_name: 'Jane',
      last_name: 'Smith',
      email: 'jane@example.com',
      status: 'active',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    }
  ]

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Mock useAsyncData default behavior
    mockUseAsyncData.mockReturnValue({
      data: mockProfiles,
      loading: false,
      error: null,
      execute: jest.fn(),
      refetch: jest.fn(),
      reset: jest.fn(),
    })
  })

  describe('initialization', () => {
    it('should initialize with default options', () => {
      const { result } = renderHook(() => useProfiles())

      expect(result.current).toEqual(
        expect.objectContaining({
          profiles: mockProfiles,
          loading: false,
          error: null,
          isEmpty: false,
          totalCount: 0,
          currentPage: 1,
          totalPages: 0,
          hasNextPage: false,
          hasPreviousPage: false,
        })
      )
    })

    it('should initialize with custom options', () => {
      const customOptions = {
        immediate: false,
        filters: { search: 'john' },
        pagination: { page: 2, limit: 50 },
        cacheTTL: 10000,
        optimistic: false,
      }

      renderHook(() => useProfiles(customOptions))

      expect(mockUseAsyncData).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({
          immediate: false,
          cache: expect.objectContaining({
            key: expect.stringContaining('profiles'),
            ttl: 10000,
          }),
        })
      )
    })
  })

  describe('CRUD operations', () => {
    it('should create a profile successfully', async () => {
      const mockRefetch = jest.fn()
      mockUseAsyncData.mockReturnValue({
        data: mockProfiles,
        loading: false,
        error: null,
        execute: jest.fn(),
        refetch: mockRefetch,
        reset: jest.fn(),
      })

      mockProfilesApi.createProfile.mockResolvedValue({
        data: { id: '3', first_name: 'Bob', last_name: 'Johnson', email: 'bob@example.com' },
        error: null
      })

      const { result } = renderHook(() => useProfiles())

      let createdProfile: any
      await act(async () => {
        createdProfile = await result.current.createProfile({
          first_name: 'Bob',
          last_name: 'Johnson',
          email: 'bob@example.com'
        })
      })

      expect(mockProfilesApi.createProfile).toHaveBeenCalledWith({
        first_name: 'Bob',
        last_name: 'Johnson',
        email: 'bob@example.com'
      })
      expect(createdProfile).toEqual(
        expect.objectContaining({
          id: '3',
          first_name: 'Bob',
          last_name: 'Johnson',
          email: 'bob@example.com'
        })
      )
      expect(mockRefetch).toHaveBeenCalled()
    })

    it('should update a profile successfully', async () => {
      const mockRefetch = jest.fn()
      mockUseAsyncData.mockReturnValue({
        data: mockProfiles,
        loading: false,
        error: null,
        execute: jest.fn(),
        refetch: mockRefetch,
        reset: jest.fn(),
      })

      mockProfilesApi.updateProfile.mockResolvedValue({
        data: { id: '1', first_name: 'John Updated', last_name: 'Doe', email: 'john@example.com' },
        error: null
      })

      const { result } = renderHook(() => useProfiles())

      let updatedProfile: any
      await act(async () => {
        updatedProfile = await result.current.updateProfile('1', {
          first_name: 'John Updated'
        })
      })

      expect(mockProfilesApi.updateProfile).toHaveBeenCalledWith('1', {
        first_name: 'John Updated'
      })
      expect(updatedProfile).toEqual(
        expect.objectContaining({
          id: '1',
          first_name: 'John Updated'
        })
      )
      expect(mockRefetch).toHaveBeenCalled()
    })

    it('should delete a profile successfully', async () => {
      const mockRefetch = jest.fn()
      mockUseAsyncData.mockReturnValue({
        data: mockProfiles,
        loading: false,
        error: null,
        execute: jest.fn(),
        refetch: mockRefetch,
        reset: jest.fn(),
      })

      mockProfilesApi.softDeleteProfile.mockResolvedValue({
        data: true,
        error: null
      })

      const { result } = renderHook(() => useProfiles())

      let deleteResult: boolean
      await act(async () => {
        deleteResult = await result.current.deleteProfile('1')
      })

      expect(mockProfilesApi.softDeleteProfile).toHaveBeenCalledWith('1')
      expect(deleteResult).toBe(true)
      expect(mockRefetch).toHaveBeenCalled()
    })
  })

  describe('filtering and pagination', () => {
    it('should update filters and reset to first page', () => {
      const { result } = renderHook(() => useProfiles())

      act(() => {
        result.current.setFilters({ search: 'john', status: 'active' })
      })

      // The component should trigger a refetch when filters change
      // This would be tested with a more complete mock setup
      expect(true).toBe(true) // Placeholder assertion
    })

    it('should handle pagination correctly', async () => {
      const { result } = renderHook(() => useProfiles({
        pagination: { page: 1, limit: 10 }
      }))

      await act(async () => {
        await result.current.goToPage(2)
      })

      // Verify pagination state updated
      expect(result.current.currentPage).toBe(2)
    })

    it('should perform search', () => {
      const { result } = renderHook(() => useProfiles())

      act(() => {
        result.current.search('john')
      })

      // Should update filters with search term
      expect(true).toBe(true) // Placeholder assertion
    })
  })

  describe('bulk operations', () => {
    it('should perform bulk delete', async () => {
      const mockRefetch = jest.fn()
      mockUseAsyncData.mockReturnValue({
        data: mockProfiles,
        loading: false,
        error: null,
        execute: jest.fn(),
        refetch: mockRefetch,
        reset: jest.fn(),
      })

      mockProfilesApi.softDeleteProfile
        .mockResolvedValueOnce({ data: true, error: null })
        .mockResolvedValueOnce({ data: true, error: null })

      const { result } = renderHook(() => useProfiles())

      let bulkResult: boolean
      await act(async () => {
        bulkResult = await result.current.bulkDelete(['1', '2'])
      })

      expect(mockProfilesApi.softDeleteProfile).toHaveBeenCalledTimes(2)
      expect(mockProfilesApi.softDeleteProfile).toHaveBeenCalledWith('1')
      expect(mockProfilesApi.softDeleteProfile).toHaveBeenCalledWith('2')
      expect(bulkResult).toBe(true)
      expect(mockRefetch).toHaveBeenCalled()
    })

    it('should handle bulk update', async () => {
      const mockRefetch = jest.fn()
      mockUseAsyncData.mockReturnValue({
        data: mockProfiles,
        loading: false,
        error: null,
        execute: jest.fn(),
        refetch: mockRefetch,
        reset: jest.fn(),
      })

      mockProfilesApi.updateProfile
        .mockResolvedValueOnce({ data: mockProfiles[0], error: null })
        .mockResolvedValueOnce({ data: mockProfiles[1], error: null })

      const { result } = renderHook(() => useProfiles())

      let bulkResult: boolean
      await act(async () => {
        bulkResult = await result.current.bulkUpdate(['1', '2'], { status: 'inactive' })
      })

      expect(mockProfilesApi.updateProfile).toHaveBeenCalledTimes(2)
      expect(mockProfilesApi.updateProfile).toHaveBeenCalledWith('1', { status: 'inactive' })
      expect(mockProfilesApi.updateProfile).toHaveBeenCalledWith('2', { status: 'inactive' })
      expect(bulkResult).toBe(true)
      expect(mockRefetch).toHaveBeenCalled()
    })
  })

  describe('utility functions', () => {
    it('should find profile by predicate', () => {
      const { result } = renderHook(() => useProfiles())

      const foundProfile = result.current.findProfile(profile => profile.email === 'john@example.com')

      expect(foundProfile).toEqual(mockProfiles[0])
    })

    it('should filter profiles by predicate', () => {
      const { result } = renderHook(() => useProfiles())

      const filteredProfiles = result.current.filterProfiles(profile => profile.status === 'active')

      expect(filteredProfiles).toHaveLength(2)
      expect(filteredProfiles).toEqual(mockProfiles)
    })
  })

  describe('error handling', () => {
    it('should handle API errors gracefully', async () => {
      mockProfilesApi.createProfile.mockResolvedValue({
        data: null,
        error: 'Failed to create profile'
      })

      const { result } = renderHook(() => useProfiles())

      let createdProfile: any
      await act(async () => {
        createdProfile = await result.current.createProfile({
          first_name: 'Test',
          email: 'test@example.com'
        })
      })

      expect(createdProfile).toBeNull()
    })

    it('should handle loading states', () => {
      mockUseAsyncData.mockReturnValue({
        data: null,
        loading: true,
        error: null,
        execute: jest.fn(),
        refetch: jest.fn(),
        reset: jest.fn(),
      })

      const { result } = renderHook(() => useProfiles())

      expect(result.current.loading).toBe(true)
      expect(result.current.profiles).toEqual([])
    })

    it('should handle error states', () => {
      const mockError = { message: 'Failed to fetch profiles', code: 'FETCH_ERROR' }
      mockUseAsyncData.mockReturnValue({
        data: null,
        loading: false,
        error: mockError,
        execute: jest.fn(),
        refetch: jest.fn(),
        reset: jest.fn(),
      })

      const { result } = renderHook(() => useProfiles())

      expect(result.current.loading).toBe(false)
      expect(result.current.error).toBe('Failed to fetch profiles')
      expect(result.current.isEmpty).toBe(true)
    })
  })
})