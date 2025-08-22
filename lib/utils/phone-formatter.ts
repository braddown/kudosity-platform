/**
 * Phone number formatting utilities for different countries
 */

export interface CountryPhoneFormat {
  country: string
  countryCode: string
  phoneCode: string
  format: string
  regex: RegExp
  example: string
  maxLength: number
}

// Define phone formats for supported countries
export const COUNTRY_FORMATS: Record<string, CountryPhoneFormat> = {
  US: {
    country: 'United States',
    countryCode: 'US',
    phoneCode: '+1',
    format: '(XXX) XXX-XXXX',
    regex: /^(\+?1)?[-.\s]?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})$/,
    example: '+1 (555) 123-4567',
    maxLength: 10,
  },
  GB: {
    country: 'United Kingdom',
    countryCode: 'GB',
    phoneCode: '+44',
    format: 'XXXX XXX XXXX',
    regex: /^(\+?44)?[-.\s]?0?([0-9]{4})[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})$/,
    example: '+44 7700 900123',
    maxLength: 10,
  },
  AU: {
    country: 'Australia',
    countryCode: 'AU',
    phoneCode: '+61',
    format: 'XXX XXX XXXX',
    regex: /^(\+?61)?[-.\s]?0?([0-9]{3})[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})$/,
    example: '+61 412 345 678',
    maxLength: 9,
  },
  CA: {
    country: 'Canada',
    countryCode: 'CA',
    phoneCode: '+1',
    format: '(XXX) XXX-XXXX',
    regex: /^(\+?1)?[-.\s]?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})$/,
    example: '+1 (416) 123-4567',
    maxLength: 10,
  },
  NZ: {
    country: 'New Zealand',
    countryCode: 'NZ',
    phoneCode: '+64',
    format: 'XX XXX XXXX',
    regex: /^(\+?64)?[-.\s]?0?([0-9]{2})[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})$/,
    example: '+64 21 123 4567',
    maxLength: 9,
  },
  IE: {
    country: 'Ireland',
    countryCode: 'IE',
    phoneCode: '+353',
    format: 'XX XXX XXXX',
    regex: /^(\+?353)?[-.\s]?0?([0-9]{2})[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})$/,
    example: '+353 85 123 4567',
    maxLength: 9,
  },
  SG: {
    country: 'Singapore',
    countryCode: 'SG',
    phoneCode: '+65',
    format: 'XXXX XXXX',
    regex: /^(\+?65)?[-.\s]?([0-9]{4})[-.\s]?([0-9]{4})$/,
    example: '+65 9123 4567',
    maxLength: 8,
  },
  ZA: {
    country: 'South Africa',
    countryCode: 'ZA',
    phoneCode: '+27',
    format: 'XX XXX XXXX',
    regex: /^(\+?27)?[-.\s]?0?([0-9]{2})[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})$/,
    example: '+27 82 123 4567',
    maxLength: 9,
  },
  IN: {
    country: 'India',
    countryCode: 'IN',
    phoneCode: '+91',
    format: 'XXXXX XXXXX',
    regex: /^(\+?91)?[-.\s]?([0-9]{5})[-.\s]?([0-9]{5})$/,
    example: '+91 98765 43210',
    maxLength: 10,
  },
  PH: {
    country: 'Philippines',
    countryCode: 'PH',
    phoneCode: '+63',
    format: 'XXX XXX XXXX',
    regex: /^(\+?63)?[-.\s]?0?([0-9]{3})[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})$/,
    example: '+63 917 123 4567',
    maxLength: 10,
  },
}

/**
 * Get country format by country code
 */
export function getCountryFormat(countryCode: string): CountryPhoneFormat | null {
  return COUNTRY_FORMATS[countryCode.toUpperCase()] || null
}

/**
 * Format phone number based on country
 */
export function formatPhoneNumber(phone: string, countryCode: string): string {
  const format = getCountryFormat(countryCode)
  if (!format) {
    // Default to E.164 format
    return formatToE164(phone)
  }

  // Remove all non-digit characters
  let digits = phone.replace(/\D/g, '')
  
  // Remove country code if present
  if (digits.startsWith(format.phoneCode.substring(1))) {
    digits = digits.substring(format.phoneCode.length - 1)
  }
  
  // Remove leading 0 if present (common in many countries)
  if (digits.startsWith('0')) {
    digits = digits.substring(1)
  }
  
  // Ensure we have the right number of digits
  if (digits.length > format.maxLength) {
    digits = digits.substring(digits.length - format.maxLength)
  }
  
  // Format according to country pattern
  let formatted = format.phoneCode + ' '
  let digitIndex = 0
  
  for (let i = 0; i < format.format.length && digitIndex < digits.length; i++) {
    if (format.format[i] === 'X') {
      formatted += digits[digitIndex]
      digitIndex++
    } else if (format.format[i] !== ' ') {
      formatted += format.format[i]
    } else {
      formatted += ' '
    }
  }
  
  return formatted.trim()
}

/**
 * Format to E.164 standard
 */
export function formatToE164(phone: string): string {
  // Remove all non-digit characters except +
  let cleaned = phone.replace(/[^\d+]/g, '')
  
  // Ensure it starts with +
  if (!cleaned.startsWith('+')) {
    // Try to detect country code
    if (cleaned.length === 10 && (cleaned.startsWith('2') || cleaned.startsWith('3') || cleaned.startsWith('4') || cleaned.startsWith('5') || cleaned.startsWith('6') || cleaned.startsWith('7') || cleaned.startsWith('8') || cleaned.startsWith('9'))) {
      // Likely US/Canada number without country code
      cleaned = '+1' + cleaned
    } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
      // US/Canada with country code
      cleaned = '+' + cleaned
    } else if (cleaned.length === 11 && cleaned.startsWith('44')) {
      // UK number
      cleaned = '+' + cleaned
    } else if (cleaned.length === 11 && cleaned.startsWith('61')) {
      // Australian number
      cleaned = '+' + cleaned
    } else {
      // Default to adding + if not present
      cleaned = '+' + cleaned
    }
  }
  
  return cleaned
}

/**
 * Validate phone number for a specific country
 */
export function validatePhoneNumber(phone: string, countryCode: string): {
  isValid: boolean
  formatted: string
  error?: string
} {
  const format = getCountryFormat(countryCode)
  
  if (!format) {
    // Default validation - just check it has enough digits
    const digits = phone.replace(/\D/g, '')
    if (digits.length < 7) {
      return {
        isValid: false,
        formatted: phone,
        error: 'Phone number too short',
      }
    }
    
    return {
      isValid: true,
      formatted: formatToE164(phone),
    }
  }
  
  // Clean the phone number
  let cleaned = phone.replace(/\D/g, '')
  
  // Remove country code if present
  if (cleaned.startsWith(format.phoneCode.substring(1))) {
    cleaned = cleaned.substring(format.phoneCode.length - 1)
  }
  
  // Remove leading 0
  if (cleaned.startsWith('0')) {
    cleaned = cleaned.substring(1)
  }
  
  // Check length
  if (cleaned.length !== format.maxLength) {
    return {
      isValid: false,
      formatted: phone,
      error: `${format.country} phone numbers should be ${format.maxLength} digits (excluding country code)`,
    }
  }
  
  // Format and return
  return {
    isValid: true,
    formatted: formatPhoneNumber(phone, countryCode),
  }
}

/**
 * Get phone input placeholder for a country
 */
export function getPhonePlaceholder(countryCode: string): string {
  const format = getCountryFormat(countryCode)
  return format ? format.example : '+1234567890'
}

/**
 * Parse phone number to extract country code and number
 */
export function parsePhoneNumber(phone: string): {
  countryCode?: string
  nationalNumber?: string
  e164?: string
} {
  const cleaned = phone.replace(/[^\d+]/g, '')
  
  // Try to match known country codes
  for (const [code, format] of Object.entries(COUNTRY_FORMATS)) {
    if (cleaned.startsWith(format.phoneCode.substring(1))) {
      return {
        countryCode: code,
        nationalNumber: cleaned.substring(format.phoneCode.length - 1),
        e164: formatToE164(phone),
      }
    }
  }
  
  return {
    e164: formatToE164(phone),
  }
}
