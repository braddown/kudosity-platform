import { KudosityConfig, SMSParams, SMSResponse, SMSListParams, WebhookParams, WebhookResponse, CampaignResponse } from '../types/index.js';
export declare class KudosityClient {
    private client;
    private config;
    constructor(config: KudosityConfig);
    private setupInterceptors;
    /**
     * Send SMS message
     */
    sendSMS(params: SMSParams): Promise<SMSResponse>;
    /**
     * Get SMS by ID
     */
    getSMS(messageId: string): Promise<SMSResponse>;
    /**
     * List SMS messages
     */
    listSMS(params?: SMSListParams): Promise<SMSResponse>;
    /**
     * Create webhook
     */
    createWebhook(params: WebhookParams): Promise<WebhookResponse>;
    /**
     * Update webhook
     */
    updateWebhook(webhookId: string, params: Partial<WebhookParams>): Promise<WebhookResponse>;
    /**
     * Delete webhook
     */
    deleteWebhook(webhookId: string): Promise<WebhookResponse>;
    /**
     * Get campaign (or list all campaigns if no ID provided)
     */
    getCampaign(campaignId?: string): Promise<CampaignResponse>;
    /**
     * Format error messages for user-friendly display
     */
    private formatError;
}
//# sourceMappingURL=KudosityClient.d.ts.map