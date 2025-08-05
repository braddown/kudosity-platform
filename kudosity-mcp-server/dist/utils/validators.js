import { logger } from './logger.js';
/**
 * Validate and format phone number to E.164 format
 * Accepts numbers with or without + prefix
 */
export function validatePhoneNumber(phone) {
    if (!phone) {
        return { isValid: false, formatted: '', error: 'Phone number is required' };
    }
    // Remove all non-digit characters except +
    let cleaned = phone.replace(/[^\d+]/g, '');
    // Handle different input formats
    if (cleaned.startsWith('+')) {
        // Already has + prefix, keep as is
        // Example: +61412345678
    }
    else {
        // No + prefix, add it
        // Handle cases like: 61412345678, 0412345678
        if (cleaned.startsWith('0')) {
            // Remove leading 0 and we'll need to add country code
            // This is ambiguous - we can't determine country code from just the number
            return {
                isValid: false,
                formatted: cleaned,
                error: 'Phone number starting with 0 requires country code. Please use format like 61412345678 or +61412345678'
            };
        }
        // Add + prefix for international numbers
        // Example: 61412345678 becomes +61412345678
        cleaned = '+' + cleaned;
    }
    // Basic validation - should be + followed by 7-15 digits
    const e164Regex = /^\+[1-9]\d{6,14}$/;
    if (!e164Regex.test(cleaned)) {
        return {
            isValid: false,
            formatted: cleaned,
            error: 'Invalid phone number format. Expected international format (e.g., +61412345678, 61412345678, +1234567890)'
        };
    }
    return { isValid: true, formatted: cleaned };
}
/**
 * Validate SMS message content
 */
export function validateSMSMessage(message) {
    if (!message) {
        return { isValid: false, info: {}, error: 'Message content is required' };
    }
    if (message.length === 0) {
        return { isValid: false, info: {}, error: 'Message cannot be empty' };
    }
    // Check encoding type
    const isGSM7 = /^[A-Za-z0-9 \r\n@£$¥èéùìòÇØøÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ!"#¤%&'()*+,\-./:;<=>?¡ÄÖÑÜ§¿äöñüà^{}\\[~]|€]*$/.test(message);
    const encoding = isGSM7 ? 'GSM7' : 'Unicode.js';
    // Calculate segments
    const maxSingleSMS = isGSM7 ? 160 : 70;
    const maxConcatSMS = isGSM7 ? 153 : 67;
    let segments = 1;
    if (message.length > maxSingleSMS) {
        segments = Math.ceil(message.length / maxConcatSMS);
    }
    const info = {
        length: message.length,
        encoding,
        segments,
        maxLength: segments === 1 ? maxSingleSMS : maxConcatSMS * segments
    };
    // Warn if message is very long
    if (segments > 3) {
        logger.warn('Long SMS message detected', info);
    }
    return { isValid: true, info };
}
/**
 * Validate sender ID
 */
export function validateSenderID(sender) {
    if (!sender) {
        return { isValid: true }; // Sender is optional
    }
    if (sender.length > 11) {
        return { isValid: false, error: 'Sender ID cannot exceed 11 characters' };
    }
    if (sender.length === 0) {
        return { isValid: false, error: 'Sender ID cannot be empty if provided' };
    }
    return { isValid: true };
}
/**
 * Validate webhook URL
 */
export function validateWebhookURL(url) {
    if (!url) {
        return { isValid: false, error: 'Webhook URL is required' };
    }
    try {
        const urlObj = new URL(url);
        if (!['http:', 'https:'].includes(urlObj.protocol)) {
            return { isValid: false, error: 'Webhook URL must use HTTP or HTTPS protocol' };
        }
        return { isValid: true };
    }
    catch {
        return { isValid: false, error: 'Invalid URL format' };
    }
}
/**
 * Validate webhook events
 */
export function validateWebhookEvents(events) {
    if (!events || events.length === 0) {
        return { isValid: false, error: 'At least one webhook event is required' };
    }
    const validEvents = ['sms.sent', 'sms.delivered', 'sms.failed', 'sms.bounced'];
    const invalidEvents = events.filter(event => !validEvents.includes(event));
    if (invalidEvents.length > 0) {
        return {
            isValid: false,
            error: `Invalid events: ${invalidEvents.join(', ')}. Valid events: ${validEvents.join(', ')}`
        };
    }
    return { isValid: true };
}
//# sourceMappingURL=validators.js.map