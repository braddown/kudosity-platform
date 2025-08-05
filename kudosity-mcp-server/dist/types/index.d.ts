export interface KudosityConfig {
    apiKey: string;
    defaultSender?: string;
    logLevel?: 'error' | 'warn' | 'info' | 'debug';
    timeout?: number;
    retryAttempts?: number;
}
export interface SMSParams {
    recipient: string;
    message: string;
    sender?: string;
    message_ref?: string;
    track_links?: boolean;
}
export interface SMSResponse {
    success: boolean;
    message_id?: string;
    data?: any;
    error?: string;
}
export interface SMSListParams {
    limit?: number;
    offset?: number;
    status?: string;
    from_date?: string;
    to_date?: string;
}
export interface WebhookParams {
    url: string;
    events: string[];
    name?: string;
    active?: boolean;
}
export interface WebhookResponse {
    success: boolean;
    webhook_id?: string;
    data?: any;
    error?: string;
}
export interface CampaignResponse {
    success: boolean;
    data?: any;
    error?: string;
}
export interface ToolResult {
    content: Array<{
        type: 'text';
        text: string;
    }>;
    isError?: boolean;
}
//# sourceMappingURL=index.d.ts.map