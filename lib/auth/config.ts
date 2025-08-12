// Authentication configuration
export const authConfig = {
  // Session configuration
  session: {
    cookieName: 'kudosity-auth-token',
    maxAge: 60 * 60 * 24 * 30, // 30 days
    updateAge: 60 * 60 * 24, // 24 hours
  },

  // Password requirements
  password: {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: false,
  },

  // OAuth providers configuration
  providers: {
    google: {
      enabled: process.env.NEXT_PUBLIC_GOOGLE_OAUTH_ENABLED === 'true',
      clientId: process.env.GOOGLE_CLIENT_ID,
      redirectUrl: '/auth/callback',
    },
    github: {
      enabled: process.env.NEXT_PUBLIC_GITHUB_OAUTH_ENABLED === 'true',
      clientId: process.env.GITHUB_CLIENT_ID,
      redirectUrl: '/auth/callback',
    },
  },

  // Email configuration
  email: {
    confirmationRequired: true,
    passwordResetExpiry: 60 * 60, // 1 hour
    magicLinkExpiry: 60 * 5, // 5 minutes
  },

  // Redirect URLs
  redirects: {
    afterLogin: '/overview',
    afterLogout: '/auth/login',
    afterSignup: '/auth/verify-email',
    afterPasswordReset: '/auth/login',
    afterEmailConfirmation: '/overview',
  },

  // Rate limiting
  rateLimiting: {
    maxLoginAttempts: 5,
    lockoutDuration: 60 * 15, // 15 minutes
    maxPasswordResetRequests: 3,
    passwordResetWindow: 60 * 60, // 1 hour
  },
}

// Role permissions configuration
export const rolePermissions = {
  owner: [
    'organization:delete',
    'organization:update',
    'organization:billing',
    'members:manage',
    'members:invite',
    'members:remove',
    'settings:manage',
    'profiles:manage',
    'profiles:delete',
    'campaigns:manage',
    'api:full_access',
  ],
  admin: [
    'organization:update',
    'members:manage',
    'members:invite',
    'members:remove',
    'settings:manage',
    'profiles:manage',
    'profiles:delete',
    'campaigns:manage',
    'api:full_access',
  ],
  manager: [
    'members:invite',
    'profiles:manage',
    'profiles:create',
    'profiles:update',
    'campaigns:manage',
    'api:read_write',
  ],
  member: [
    'profiles:create',
    'profiles:update',
    'campaigns:create',
    'campaigns:update',
    'api:read_write',
  ],
  viewer: [
    'profiles:view',
    'campaigns:view',
    'api:read_only',
  ],
}

// Get user permissions based on role
export function getUserPermissions(role: string): string[] {
  return rolePermissions[role as keyof typeof rolePermissions] || []
}

// Check if user has specific permission
export function hasPermission(userRole: string, permission: string): boolean {
  const permissions = getUserPermissions(userRole)
  return permissions.includes(permission)
}

