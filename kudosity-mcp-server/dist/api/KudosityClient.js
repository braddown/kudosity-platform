import axios from 'axios';
import { logger } from '../utils/logger.js';
export class KudosityClient {
    client;
    config;
    constructor(config) {
        this.config = config;
        // Initialize HTTP client for Modern API only
        this.client = axios.create({
            baseURL: 'https://api.transmitmessage.com',
            timeout: config.timeout || 30000,
            headers: {
                'User-Agent': 'Kudosity-MCP-Server/1.0.0',
                'X-API-KEY': config.apiKey,
                'Content-Type': 'application/json'
            }
        });
        this.setupInterceptors();
        logger.info('Kudosity API client initialized', { baseURL: 'https://api.transmitmessage.com' });
    }
    setupInterceptors() {
        // Request interceptor for logging
        this.client.interceptors.request.use((config) => {
            logger.debug('API Request', {
                method: config.method?.toUpperCase(),
                url: config.url,
                hasData: !!config.data
            });
            return config;
        }, (error) => {
            logger.error('Request interceptor error', { error: error.message });
            return Promise.reject(error);
        });
        // Response interceptor for logging
        this.client.interceptors.response.use((response) => {
            logger.debug('API Response', {
                status: response.status,
                url: response.config.url
            });
            return response;
        }, (error) => {
            logger.error('API Error', {
                status: error.response?.status,
                url: error.config?.url,
                error: error.response?.data || error.message
            });
            return Promise.reject(error);
        });
    }
    /**
     * Send SMS message
     */
    async sendSMS(params) {
        logger.info('Sending SMS', { recipient: params.recipient });
        try {
            // Use provided sender or fall back to default from config
            const sender = params.sender || this.config.defaultSender || 'Kudosity.js';
            const payload = {
                recipient: params.recipient,
                message: params.message,
                sender: sender,
                message_ref: params.message_ref || `sms_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                track_links: params.track_links !== false
            };
            logger.debug('SMS payload', { payload, usingDefaultSender: !params.sender && !!this.config.defaultSender });
            const response = await this.client.post('/v2/sms', payload);
            return {
                success: true,
                message_id: response.data.message_id || response.data.id,
                data: response.data
            };
        }
        catch (error) {
            const errorMessage = error.response?.data?.message || error.message;
            logger.error('SMS sending failed', { error: errorMessage });
            return {
                success: false,
                error: this.formatError(error)
            };
        }
    }
    /**
     * Get SMS by ID
     */
    async getSMS(messageId) {
        logger.info('Getting SMS', { messageId });
        try {
            const response = await this.client.get(`/v2/sms/${messageId}`);
            return {
                success: true,
                data: response.data
            };
        }
        catch (error) {
            logger.error('Get SMS failed', { messageId, error: error.message });
            return {
                success: false,
                error: this.formatError(error)
            };
        }
    }
    /**
     * List SMS messages
     */
    async listSMS(params = {}) {
        logger.info('Listing SMS messages', { params });
        try {
            const queryParams = new URLSearchParams();
            if (params.limit)
                queryParams.append('limit', params.limit.toString());
            if (params.offset)
                queryParams.append('offset', params.offset.toString());
            if (params.status)
                queryParams.append('status', params.status);
            if (params.from_date)
                queryParams.append('from_date', params.from_date);
            if (params.to_date)
                queryParams.append('to_date', params.to_date);
            const url = `/v2/sms${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
            const response = await this.client.get(url);
            return {
                success: true,
                data: response.data
            };
        }
        catch (error) {
            logger.error('List SMS failed', { error: error.message });
            return {
                success: false,
                error: this.formatError(error)
            };
        }
    }
    /**
     * Create webhook
     */
    async createWebhook(params) {
        logger.info('Creating webhook', { url: params.url, events: params.events });
        try {
            const payload = {
                url: params.url,
                events: params.events,
                name: params.name || 'MCP Webhook',
                active: params.active !== false
            };
            const response = await this.client.post('/v2/webhook', payload);
            return {
                success: true,
                webhook_id: response.data.webhook_id || response.data.id,
                data: response.data
            };
        }
        catch (error) {
            logger.error('Create webhook failed', { error: error.message });
            return {
                success: false,
                error: this.formatError(error)
            };
        }
    }
    /**
     * Update webhook
     */
    async updateWebhook(webhookId, params) {
        logger.info('Updating webhook', { webhookId, params });
        try {
            const response = await this.client.put(`/v2/webhook/${webhookId}`, params);
            return {
                success: true,
                webhook_id: webhookId,
                data: response.data
            };
        }
        catch (error) {
            logger.error('Update webhook failed', { webhookId, error: error.message });
            return {
                success: false,
                error: this.formatError(error)
            };
        }
    }
    /**
     * Delete webhook
     */
    async deleteWebhook(webhookId) {
        logger.info('Deleting webhook', { webhookId });
        try {
            const response = await this.client.delete(`/v2/webhook/${webhookId}`);
            return {
                success: true,
                webhook_id: webhookId,
                data: response.data
            };
        }
        catch (error) {
            logger.error('Delete webhook failed', { webhookId, error: error.message });
            return {
                success: false,
                error: this.formatError(error)
            };
        }
    }
    /**
     * Get campaign (or list all campaigns if no ID provided)
     */
    async getCampaign(campaignId) {
        const endpoint = campaignId ? `/v2/campaigns/${campaignId}` : '/v2/campaigns.js';
        logger.info('Getting campaign(s)', { campaignId, endpoint });
        try {
            const response = await this.client.get(endpoint);
            return {
                success: true,
                data: response.data
            };
        }
        catch (error) {
            logger.error('Get campaign failed', { campaignId, error: error.message });
            return {
                success: false,
                error: this.formatError(error)
            };
        }
    }
    /**
     * Format error messages for user-friendly display
     */
    formatError(error) {
        if (error.response?.status === 401) {
            return 'Authentication failed. Please check your API key is correct..js';
        }
        if (error.response?.status === 403) {
            return 'Access forbidden. Your API key may not have permission for this operation..js';
        }
        if (error.response?.status === 404) {
            return 'Resource not found. Please check the ID or endpoint is correct..js';
        }
        if (error.response?.status === 422) {
            const validationErrors = error.response?.data?.errors;
            if (validationErrors) {
                return `Validation failed: ${JSON.stringify(validationErrors)}`;
            }
            return 'Invalid request parameters..js';
        }
        if (error.code === 'ENOTFOUND') {
            return 'Could not connect to Kudosity API. Please check your internet connection..js';
        }
        if (error.code === 'ETIMEDOUT') {
            return 'Request timed out. Please try again..js';
        }
        return error.response?.data?.message || error.message || 'Unknown error occurred.js';
    }
}
//# sourceMappingURL=KudosityClient.js.map