import { validateWebhookURL, validateWebhookEvents } from '../utils/validators.js';
import { logger } from '../utils/logger.js';
export class UpdateWebhookTool {
    kudosityClient;
    name = 'update_webhook';
    description = 'Update an existing webhook configuration including URL, events, name, or active status';
    inputSchema = {
        type: 'object',
        properties: {
            webhook_id: {
                type: 'string',
                description: 'The ID of the webhook to update'
            },
            url: {
                type: 'string',
                description: 'New HTTPS URL for webhook notifications (optional)'
            },
            events: {
                type: 'array',
                items: {
                    type: 'string'
                },
                description: 'New array of events to subscribe to (optional). Available: "sms.sent", "sms.delivered", "sms.failed", "sms.bounced"'
            },
            name: {
                type: 'string',
                description: 'New name for the webhook (optional)'
            },
            active: {
                type: 'boolean',
                description: 'Whether the webhook should be active (optional)'
            }
        },
        required: ['webhook_id']
    };
    constructor(kudosityClient) {
        this.kudosityClient = kudosityClient;
    }
    async execute(args) {
        try {
            if (!args.webhook_id) {
                return {
                    content: [{
                            type: 'text',
                            text: '❌ Webhook ID is required to update a webhook.'
                        }],
                    isError: true
                };
            }
            // Build update parameters
            const updateParams = {};
            const changes = [];
            // Validate and add URL if provided
            if (args.url) {
                const urlValidation = validateWebhookURL(args.url);
                if (!urlValidation.isValid) {
                    return {
                        content: [{
                                type: 'text',
                                text: `❌ Invalid webhook URL: ${urlValidation.error}\n\n💡 Please provide a valid HTTPS URL that is publicly accessible.`
                            }],
                        isError: true
                    };
                }
                updateParams.url = args.url;
                changes.push(`URL updated to ${args.url}`);
            }
            // Validate and add events if provided
            if (args.events) {
                const eventsValidation = validateWebhookEvents(args.events);
                if (!eventsValidation.isValid) {
                    return {
                        content: [{
                                type: 'text',
                                text: `❌ Invalid webhook events: ${eventsValidation.error}`
                            }],
                        isError: true
                    };
                }
                updateParams.events = args.events;
                changes.push(`Events updated to: ${args.events.join(', ')}`);
            }
            // Add name if provided
            if (args.name !== undefined) {
                updateParams.name = args.name;
                changes.push(`Name updated to "${args.name}"`);
            }
            // Add active status if provided
            if (args.active !== undefined) {
                updateParams.active = args.active;
                changes.push(`Status updated to ${args.active ? 'Active' : 'Inactive'}`);
            }
            // Check if any updates were provided
            if (Object.keys(updateParams).length === 0) {
                return {
                    content: [{
                            type: 'text',
                            text: '❌ No update parameters provided. Please specify at least one field to update (url, events, name, or active).'
                        }],
                    isError: true
                };
            }
            // Update webhook
            const result = await this.kudosityClient.updateWebhook(args.webhook_id, updateParams);
            if (result.success) {
                let responseText = `✅ Webhook updated successfully!\n\n`;
                responseText += `🆔 **Webhook ID:** ${args.webhook_id}\n\n`;
                responseText += `📝 **Changes made:**\n`;
                changes.forEach(change => {
                    responseText += `• ${change}\n`;
                });
                responseText += `\n🔧 **Next steps:**\n`;
                responseText += `• Your webhook will immediately use the new configuration\n`;
                responseText += `• Test your endpoint if you changed the URL or events\n`;
                responseText += `• Monitor webhook delivery to ensure it's working correctly\n`;
                if (result.data) {
                    responseText += `\n📊 **Current webhook details:**\n`;
                    if (result.data.url)
                        responseText += `• URL: ${result.data.url}\n`;
                    if (result.data.events)
                        responseText += `• Events: ${result.data.events.join(', ')}\n`;
                    if (result.data.name)
                        responseText += `• Name: ${result.data.name}\n`;
                    if (result.data.active !== undefined)
                        responseText += `• Status: ${result.data.active ? 'Active' : 'Inactive'}\n`;
                }
                return {
                    content: [{
                            type: 'text',
                            text: responseText
                        }]
                };
            }
            else {
                return {
                    content: [{
                            type: 'text',
                            text: `❌ Webhook update failed: ${result.error}\n\n💡 Please check that the webhook ID "${args.webhook_id}" is correct and your API credentials are valid.`
                        }],
                    isError: true
                };
            }
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            logger.error('Update webhook tool execution failed', { error: errorMessage, webhookId: args.webhook_id });
            return {
                content: [{
                        type: 'text',
                        text: `❌ Unexpected error occurred:\n\n${errorMessage}\n\n💡 This might be a network issue or the webhook ID format might be invalid.`
                    }],
                isError: true
            };
        }
    }
}
//# sourceMappingURL=UpdateWebhookTool.js.map