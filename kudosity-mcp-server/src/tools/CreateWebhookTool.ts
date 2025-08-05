
import { KudosityClient } from '../api/KudosityClient.js';
import { ToolResult } from '../types/index.js';
import { validateWebhookURL, validateWebhookEvents } from '../utils/validators.js';
import { logger } from '../utils/logger.js';

export class CreateWebhookTool {
  name = 'create_webhook';
  description = 'Create a new webhook to receive real-time notifications for SMS events like delivery confirmations and failures';

  inputSchema = {
    type: 'object' as const,
    properties: {
      url: {
        type: 'string',
        description: 'The HTTPS URL where webhook notifications will be sent. Must be publicly accessible.'
      },
      events: {
        type: 'array',
        items: {
          type: 'string'
        },
        description: 'Array of events to subscribe to. Available: "sms.sent", "sms.delivered", "sms.failed", "sms.bounced"'
      },
      name: {
        type: 'string',
        description: 'Optional name for the webhook to help identify it (default: "MCP Webhook")'
      },
      active: {
        type: 'boolean',
        description: 'Whether the webhook should be active immediately (default: true)'
      }
    },
    required: ['url', 'events']
  };

  constructor(private kudosityClient: KudosityClient) {}

  async execute(args: any): Promise<ToolResult> {
    try {
      // Validate webhook URL
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

      // Validate events
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

      // Create webhook
      const result = await this.kudosityClient.createWebhook({
        url: args.url,
        events: args.events,
        name: args.name,
        active: args.active
      });

      if (result.success) {
        let responseText = `✅ Webhook created successfully!\n\n`;
        responseText += `🆔 **Webhook ID:** ${result.webhook_id}\n`;
        responseText += `🔗 **URL:** ${args.url}\n`;
        responseText += `📡 **Events:** ${args.events.join(', ')}\n`;
        
        if (args.name) {
          responseText += `📝 **Name:** ${args.name}\n`;
        }
        
        responseText += `🟢 **Status:** ${args.active !== false ? 'Active' : 'Inactive'}\n\n`;
        
        responseText += `📋 **What happens next:**\n`;
        responseText += `• Your webhook will receive POST requests for the subscribed events\n`;
        responseText += `• Each request includes event data and authentication headers\n`;
        responseText += `• Your endpoint should respond with HTTP 200 to acknowledge receipt\n\n`;
        
        responseText += `🔧 **Webhook Management:**\n`;
        responseText += `• Use webhook ID "${result.webhook_id}" to update or delete this webhook\n`;
        responseText += `• Test your endpoint to ensure it can receive and process notifications\n`;
        
        if (result.data && result.data.secret) {
          responseText += `• Webhook secret: ${result.data.secret} (use this to verify requests)\n`;
        }

        return {
          content: [{
            type: 'text',
            text: responseText
          }]
        };
      } else {
        return {
          content: [{
            type: 'text',
            text: `❌ Webhook creation failed: ${result.error}\n\n💡 Please check that your URL is accessible and your API credentials are correct.`
          }],
          isError: true
        };
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Create webhook tool execution failed', { error: errorMessage });
      return {
        content: [{
          type: 'text',
          text: `❌ Unexpected error occurred:\n\n${errorMessage}\n\n💡 This might be a network issue or invalid parameters.`
        }],
        isError: true
      };
    }
  }
}

