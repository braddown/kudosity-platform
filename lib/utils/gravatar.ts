
import { simpleMD5 } from './simple-md5'
import { logger } from "@/lib/utils/logger"

/**
 * Get Gravatar URL with proper MD5 hashing
 * This fetches real Gravatar images when they exist
 */
export function getGravatarUrlSimple(
  email: string | null | undefined,
  size: number = 200
): string {
  if (!email || typeof email !== 'string') {
    return `https://ui-avatars.com/api/?name=User&size=${size}&background=6366f1&color=fff&rounded=true`
  }

  try {
    // Normalize the email for Gravatar (trim and lowercase)
    const normalizedEmail = email.trim().toLowerCase()
    
    // Generate MD5 hash of the email
    const emailHash = simpleMD5(normalizedEmail)
    
    // Build the proper Gravatar URL
    // Using 'retro' as fallback for a nice geometric pattern if no Gravatar exists
    const gravatarUrl = `https://www.gravatar.com/avatar/${emailHash}?s=${size}&d=retro&r=g`
    
    return gravatarUrl
  } catch (error) {
    // If MD5 fails, fallback to UI Avatars
    logger.warn('Failed to generate Gravatar hash:', error)
    const name = email.split('@')[0].replace(/[._-]/g, ' ')
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=${size}&background=6366f1&color=fff&rounded=true`
  }
}

/**
 * Get initials from a name or email
 */
export function getInitials(name?: string | null, email?: string | null): string {
  if (name) {
    const parts = name.trim().split(/\s+/)
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
    }
    return name.substring(0, 2).toUpperCase()
  }
  
  if (email) {
    const username = email.split('@')[0]
    return username.substring(0, 2).toUpperCase()
  }
  
  return 'U'
}
