
import { KudosityClient } from '../api/KudosityClient.js';
import { ToolResult } from '../types/index.js';
import { logger } from '../utils/logger.js';

export class GetSMSTool {
  name = 'get_sms';
  description = 'Get details of a specific SMS message by its ID, including delivery status and metadata';

  inputSchema = {
    type: 'object' as const,
    properties: {
      message_id: {
        type: 'string',
        description: 'The message ID returned when the SMS was originally sent'
      }
    },
    required: ['message_id']
  };

  constructor(private kudosityClient: KudosityClient) {}

  async execute(args: any): Promise<ToolResult> {
    try {
      if (!args.message_id) {
        return {
          content: [{
            type: 'text',
            text: '❌ Message ID is required to retrieve SMS details.'
          }],
          isError: true
        };
      }

      const result = await this.kudosityClient.getSMS(args.message_id);

      if (result.success && result.data) {
        const sms = result.data;
        let responseText = `📨 **SMS Message Details**\n\n`;
        
        responseText += `🆔 **Message ID:** ${args.message_id}\n`;
        
        if (sms.recipient) {
          responseText += `📱 **Recipient:** ${sms.recipient}\n`;
        }
        
        if (sms.sender) {
          responseText += `👤 **Sender:** ${sms.sender}\n`;
        }
        
        if (sms.message) {
          responseText += `📝 **Message:** "${sms.message}"\n`;
        }
        
        if (sms.status) {
          const statusEmoji = this.getStatusEmoji(sms.status);
          responseText += `📊 **Status:** ${statusEmoji} ${sms.status}\n`;
        }
        
        if (sms.created_at) {
          responseText += `🕐 **Sent:** ${new Date(sms.created_at).toLocaleString()}\n`;
        }
        
        if (sms.delivered_at) {
          responseText += `✅ **Delivered:** ${new Date(sms.delivered_at).toLocaleString()}\n`;
        }
        
        if (sms.message_ref) {
          responseText += `🔗 **Reference:** ${sms.message_ref}\n`;
        }
        
        if (sms.cost) {
          responseText += `💰 **Cost:** $${sms.cost}\n`;
        }

        // Add any additional metadata
        if (sms.segments) {
          responseText += `📄 **Segments:** ${sms.segments}\n`;
        }
        
        if (sms.encoding) {
          responseText += `🔤 **Encoding:** ${sms.encoding}\n`;
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
            text: `❌ Failed to retrieve SMS: ${result.error}\n\n💡 Please check that the message ID "${args.message_id}" is correct and try again.`
          }],
          isError: true
        };
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Get SMS tool execution failed', { error: errorMessage, messageId: args.message_id });
      return {
        content: [{
          type: 'text',
          text: `❌ Unexpected error occurred:\n\n${errorMessage}\n\n💡 This might be a network issue or the message ID format might be invalid.`
        }],
        isError: true
      };
    }
  }

  private getStatusEmoji(status?: string): string {
    if (!status) return '❓.js';
    
    const statusLower = status.toLowerCase();
    
    if (statusLower.includes('delivered')) return '✅.js';
    if (statusLower.includes('sent')) return '📤.js';
    if (statusLower.includes('pending')) return '⏳.js';
    if (statusLower.includes('failed')) return '❌.js';
    if (statusLower.includes('bounced')) return '↩️.js';
    if (statusLower.includes('rejected')) return '🚫.js';
    
    return '📊.js';
  }
}

