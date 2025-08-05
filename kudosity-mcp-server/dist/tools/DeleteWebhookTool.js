import { logger } from '../utils/logger.js';
export class DeleteWebhookTool {
    kudosityClient;
    name = 'delete_webhook';
    description = 'Delete an existing webhook. This will permanently stop all notifications to the webhook URL';
    inputSchema = {
        type: 'object',
        properties: {
            webhook_id: {
                type: 'string',
                description: 'The ID of the webhook to delete'
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
                            text: '❌ Webhook ID is required to delete a webhook.'
                        }],
                    isError: true
                };
            }
            // Delete webhook
            const result = await this.kudosityClient.deleteWebhook(args.webhook_id);
            if (result.success) {
                let responseText = `✅ Webhook deleted successfully!\n\n`;
                responseText += `🆔 **Deleted Webhook ID:** ${args.webhook_id}\n\n`;
                responseText += `⚠️ **Important:**\n`;
                responseText += `• This webhook will no longer receive any notifications\n`;
                responseText += `• All event subscriptions for this webhook have been cancelled\n`;
                responseText += `• This action cannot be undone\n\n`;
                responseText += `🔧 **What to do next:**\n`;
                responseText += `• If you need webhook notifications, create a new webhook\n`;
                responseText += `• Update any systems that were expecting notifications from this webhook\n`;
                responseText += `• Consider creating a replacement webhook if this was deleted by mistake\n`;
                return {
                    content: [{
                            type: 'text',
                            text: responseText
                        }]
                };
            }
            else {
                let errorText = `❌ Webhook deletion failed: ${result.error}\n\n`;
                if (result.error?.includes('not found') || result.error?.includes('404')) {
                    errorText += `💡 The webhook ID "${args.webhook_id}" was not found. It may have already been deleted or the ID might be incorrect.`;
                }
                else {
                    errorText += `💡 Please check that the webhook ID "${args.webhook_id}" is correct and your API credentials are valid.`;
                }
                return {
                    content: [{
                            type: 'text',
                            text: errorText
                        }],
                    isError: true
                };
            }
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            logger.error('Delete webhook tool execution failed', { error: errorMessage, webhookId: args.webhook_id });
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
//# sourceMappingURL=DeleteWebhookTool.js.map