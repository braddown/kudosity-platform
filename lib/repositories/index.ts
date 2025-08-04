/**
 * Repository Pattern - Central Export
 * 
 * Provides centralized access to all repository classes and types.
 * Import repositories from this file to maintain consistency.
 */

// Base classes and types
export { BaseRepository } from './BaseRepository'
export * from './types'

// Core repositories
export { ProfilesRepository, profilesRepository, type Profile, type ProfileInsert, type ProfileUpdate } from './ProfilesRepository'
export { ListsRepository, listsRepository, type List, type ListInsert, type ListUpdate, type ListMembership } from './ListsRepository'

// Business entity repositories
export { CampaignsRepository, campaignsRepository, type Campaign } from './CampaignsRepository'
export { ContactsRepository, contactsRepository, type Contact } from './ContactsRepository'
export { TemplatesRepository, templatesRepository, type Template } from './TemplatesRepository'
export { SegmentsRepository, segmentsRepository, type Segment } from './SegmentsRepository'

// Import repository instances for service locator
import { profilesRepository } from './ProfilesRepository'
import { listsRepository } from './ListsRepository'
import { campaignsRepository } from './CampaignsRepository'
import { contactsRepository } from './ContactsRepository'
import { templatesRepository } from './TemplatesRepository'
import { segmentsRepository } from './SegmentsRepository'

// Service locator for dependency injection
export class RepositoryService {
  private static instance: RepositoryService
  private repositories: Map<string, any> = new Map()

  private constructor() {
    // Repositories will be registered lazily to avoid circular dependencies
  }

  public static getInstance(): RepositoryService {
    if (!RepositoryService.instance) {
      RepositoryService.instance = new RepositoryService()
    }
    return RepositoryService.instance
  }

  public getRepository<T>(name: string): T {
    // Check if repository is already cached
    let repository = this.repositories.get(name)
    
    // If not cached, create it lazily
    if (!repository) {
      switch (name) {
        case 'profiles':
          repository = profilesRepository
          break
        case 'lists':
          repository = listsRepository
          break
        case 'campaigns':
          repository = campaignsRepository
          break
        case 'contacts':
          repository = contactsRepository
          break
        case 'templates':
          repository = templatesRepository
          break
        case 'segments':
          repository = segmentsRepository
          break
        default:
          throw new Error(`Repository '${name}' not found`)
      }
      this.repositories.set(name, repository)
    }
    
    return repository as T
  }

  public registerRepository(name: string, repository: any): void {
    this.repositories.set(name, repository)
  }

  public hasRepository(name: string): boolean {
    return this.repositories.has(name)
  }

  public listRepositories(): string[] {
    return Array.from(this.repositories.keys())
  }
}

// Export service instance
export const repositoryService = RepositoryService.getInstance()

// Convenience function for getting repositories
export function getRepository<T>(name: string): T {
  return repositoryService.getRepository<T>(name)
}

// Type-safe repository getters using lazy loading
export const repositories = {
  get profiles() {
    return repositoryService.getRepository('profiles')
  },
  get lists() {
    return repositoryService.getRepository('lists')
  },
  get campaigns() {
    return repositoryService.getRepository('campaigns')
  },
  get contacts() {
    return repositoryService.getRepository('contacts')
  },
  get templates() {
    return repositoryService.getRepository('templates')
  },
  get segments() {
    return repositoryService.getRepository('segments')
  },
} as const

export type RepositoryName = keyof typeof repositories