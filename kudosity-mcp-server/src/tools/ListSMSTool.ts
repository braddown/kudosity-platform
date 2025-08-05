
import { KudosityClient } from '../api/KudosityClient.js';
import { ToolResult } from '../types/index.js';
import { logger } from '../utils/logger.js';

export class ListSMSTool {
  name = 'list_sms';
  description = 'List SMS messages with optional filtering by status, date range, and pagination';

  inputSchema = {
    type: 'object' as const,
    properties: {
      limit: {
        type: 'number',
        description: 'Maximum number of messages to return (default: 20, max: 100)'
      },
      offset: {
        type: 'number',
        description: 'Number of messages to skip for pagination (default: 0)'
      },
      status: {
        type: 'string',
        description: 'Filter by message status (e.g., "sent", "delivered", "failed")'
      },
      from_date: {
        type: 'string',
        description: 'Filter messages from this date (ISO format: YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss)'
      },
      to_date: {
        type: 'string',
        description: 'Filter messages to this date (ISO format: YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss)'
      }
    },
    required: []
  };

  constructor(private kudosityClient: KudosityClient) {}

  async execute(args: any): Promise<ToolResult> {
    try {
      // Validate and set defaults
      const params = {
        limit: Math.min(args.limit || 20, 100),
        offset: args.offset || 0,
        status: args.status,
        from_date: args.from_date,
        to_date: args.to_date
      };

      // Validate date formats if provided
      if (params.from_date && !this.isValidDate(params.from_date)) {
        return {
          content: [{
            type: 'text',
            text: '❌ Invalid from_date format. Please use ISO format like "2024-01-01" or "2024-01-01T10:00:00"'
          }],
          isError: true
        };
      }

      if (params.to_date && !this.isValidDate(params.to_date)) {
        return {
          content: [{
            type: 'text',
            text: '❌ Invalid to_date format. Please use ISO format like "2024-01-01" or "2024-01-01T10:00:00"'
          }],
          isError: true
        };
      }

      const result = await this.kudosityClient.listSMS(params);

      if (result.success && result.data) {
        const messages = Array.isArray(result.data) ? result.data : result.data.messages || [];
        const total = result.data.total || messages.length;
        
        let responseText = `📨 **SMS Messages List**\n\n`;
        
        // Add filter summary
        responseText += `📊 **Results:** Showing ${messages.length} of ${total} messages`;
        if (params.offset > 0) {
          responseText += ` (offset: ${params.offset})`;
        }
        responseText += `\n`;
        
        if (params.status) {
          responseText += `🔍 **Filtered by status:** ${params.status}\n`;
        }
        
        if (params.from_date || params.to_date) {
          responseText += `📅 **Date range:** ${params.from_date || 'start'} to ${params.to_date || 'now'}\n`;
        }
        
        responseText += `\n`;

        if (messages.length === 0) {
          responseText += `📭 No messages found matching your criteria.\n\n`;
          responseText += `💡 Try adjusting your filters or check if you have sent any messages recently.`;
        } else {
          responseText += `**Messages:**\n\n`;
          
          messages.forEach((sms: any, index: number) => {
            responseText += `**${index + 1}.** `;
            
            if (sms.message_id || sms.id) {
              responseText += `ID: ${sms.message_id || sms.id} | `;
            }
            
            if (sms.recipient) {
              responseText += `To: ${sms.recipient} | `;
            }
            
            if (sms.status) {
              const statusEmoji = this.getStatusEmoji(sms.status);
              responseText += `${statusEmoji} ${sms.status}`;
            }
            
            responseText += `\n`;
            
            if (sms.message) {
              const truncatedMessage = sms.message.length > 50 
                ? sms.message.substring(0, 50) + '...' 
                : sms.message;
              responseText += `   📝 "${truncatedMessage}"\n`;
            }
            
            if (sms.created_at) {
              responseText += `   🕐 ${new Date(sms.created_at).toLocaleString()}\n`;
            }
            
            responseText += `\n`;
          });

          // Add pagination info
          if (total > params.limit + params.offset) {
            const remaining = total - (params.limit + params.offset);
            responseText += `📄 **Pagination:** ${remaining} more messages available. `;
            responseText += `Use offset=${params.limit + params.offset} to see the next page.`;
          }
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
            text: `❌ Failed to list SMS messages: ${result.error}\n\n💡 Please check your API credentials and try again.`
          }],
          isError: true
        };
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('List SMS tool execution failed', { error: errorMessage });
      return {
        content: [{
          type: 'text',
          text: `❌ Unexpected error occurred:\n\n${errorMessage}\n\n💡 This might be a network issue or invalid parameters.`
        }],
        isError: true
      };
    }
  }

  private isValidDate(dateString: string): boolean {
    // Check for ISO date formats
    const isoDateRegex = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?)?$/;
    if (!isoDateRegex.test(dateString)) {
      return false;
    }
    
    const date = new Date(dateString);
    return !isNaN(date.getTime());
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

