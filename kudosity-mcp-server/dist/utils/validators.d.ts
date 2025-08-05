/**
 * Validate and format phone number to E.164 format
 * Accepts numbers with or without + prefix
 */
export declare function validatePhoneNumber(phone: string): {
    isValid: boolean;
    formatted: string;
    error?: string;
};
/**
 * Validate SMS message content
 */
export declare function validateSMSMessage(message: string): {
    isValid: boolean;
    info: any;
    error?: string;
};
/**
 * Validate sender ID
 */
export declare function validateSenderID(sender?: string): {
    isValid: boolean;
    error?: string;
};
/**
 * Validate webhook URL
 */
export declare function validateWebhookURL(url: string): {
    isValid: boolean;
    error?: string;
};
/**
 * Validate webhook events
 */
export declare function validateWebhookEvents(events: string[]): {
    isValid: boolean;
    error?: string;
};
//# sourceMappingURL=validators.d.ts.map