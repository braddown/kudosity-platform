
import { KudosityClient } from '../api/KudosityClient.js';
import { ToolResult } from '../types/index.js';
import { logger } from '../utils/logger.js';

export class GetCampaignTool {
  name = 'get_campaign';
  description = 'Get details of a specific campaign by ID, or list all campaigns if no ID is provided. Shows campaign status, metrics, and configuration';

  inputSchema = {
    type: 'object' as const,
    properties: {
      campaign_id: {
        type: 'string',
        description: 'Optional campaign ID. If provided, returns details for that specific campaign. If omitted, returns all campaigns.'
      }
    },
    required: []
  };

  constructor(private kudosityClient: KudosityClient) {}

  async execute(args: any): Promise<ToolResult> {
    try {
      const result = await this.kudosityClient.getCampaign(args.campaign_id);

      if (result.success && result.data) {
        if (args.campaign_id) {
          // Single campaign details
          return this.formatSingleCampaign(result.data, args.campaign_id);
        } else {
          // Multiple campaigns list
          return this.formatCampaignList(result.data);
        }
      } else {
        const errorContext = args.campaign_id 
          ? `campaign "${args.campaign_id}"` 
          : 'campaigns.js';
        
        return {
          content: [{
            type: 'text',
            text: `❌ Failed to retrieve ${errorContext}: ${result.error}\n\n💡 Please check your API credentials and try again.`
          }],
          isError: true
        };
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Get campaign tool execution failed', { error: errorMessage, campaignId: args.campaign_id });
      return {
        content: [{
          type: 'text',
          text: `❌ Unexpected error occurred:\n\n${errorMessage}\n\n💡 This might be a network issue or invalid campaign ID.`
        }],
        isError: true
      };
    }
  }

  private formatSingleCampaign(campaign: any, campaignId: string): ToolResult {
    let responseText = `📊 **Campaign Details**\n\n`;
    
    responseText += `🆔 **Campaign ID:** ${campaignId}\n`;
    
    if (campaign.account_id) {
      responseText += `👤 **Account ID:** ${campaign.account_id}\n`;
    }
    
    if (campaign.message_type) {
      responseText += `📱 **Message Type:** ${campaign.message_type.toUpperCase()}\n`;
    }
    
    if (campaign.sender) {
      responseText += `👤 **Sender:** ${campaign.sender}\n`;
    }
    
    if (campaign.subject) {
      responseText += `📝 **Subject:** ${campaign.subject}\n`;
    }
    
    if (campaign.message_text) {
      const truncatedMessage = campaign.message_text.length > 100 
        ? campaign.message_text.substring(0, 100) + '...' 
        : campaign.message_text;
      responseText += `💬 **Message:** "${truncatedMessage}"\n`;
    }
    
    // Status and state
    if (campaign.status || campaign.state) {
      responseText += `\n📊 **Status & State:**\n`;
      if (campaign.status) {
        const statusEmoji = this.getStatusEmoji(campaign.status);
        responseText += `• Status: ${statusEmoji} ${campaign.status}\n`;
      }
      if (campaign.state) {
        responseText += `• State: ${campaign.state}\n`;
      }
    }
    
    // Delivery metrics
    responseText += `\n📈 **Delivery Metrics:**\n`;
    responseText += `• Sending: ${campaign.sending || 0}\n`;
    responseText += `• Delivered: ${campaign.delivered || 0}\n`;
    responseText += `• Failed: ${campaign.failed || 0}\n`;
    responseText += `• Opted Out: ${campaign.optout || 0}\n`;
    responseText += `• Filtered: ${campaign.filtered || 0}\n`;
    
    if (campaign.segment_size) {
      responseText += `• Segment Size: ${campaign.segment_size}\n`;
    }
    
    // Engagement metrics
    if (campaign.link_hits_total !== undefined) {
      responseText += `\n🔗 **Engagement:**\n`;
      responseText += `• Link Hits: ${campaign.link_hits_total}\n`;
      responseText += `• Link Tracking: ${campaign.track_links ? 'Enabled' : 'Disabled'}\n`;
    }
    
    // Cost and timing
    if (campaign.campaign_cost !== undefined) {
      responseText += `\n💰 **Cost:** $${campaign.campaign_cost}\n`;
    }
    
    if (campaign.schedule_type) {
      responseText += `\n⏰ **Scheduling:**\n`;
      responseText += `• Type: ${campaign.schedule_type}\n`;
      if (campaign.schedule_timezone) {
        responseText += `• Timezone: ${campaign.schedule_timezone}\n`;
      }
      if (campaign.schedule_date_time) {
        responseText += `• Scheduled: ${campaign.schedule_date_time}\n`;
      }
    }
    
    // Timestamps
    if (campaign.created_at || campaign.updated_at) {
      responseText += `\n🕐 **Timestamps:**\n`;
      if (campaign.created_at) {
        responseText += `• Created: ${new Date(campaign.created_at).toLocaleString()}\n`;
      }
      if (campaign.updated_at) {
        responseText += `• Updated: ${new Date(campaign.updated_at).toLocaleString()}\n`;
      }
    }
    
    // Additional details
    if (campaign.contact_list_id) {
      responseText += `\n📋 **Contact List ID:** ${campaign.contact_list_id}\n`;
    }
    
    if (campaign.transmitsms_message_id) {
      responseText += `📨 **Message ID:** ${campaign.transmitsms_message_id}\n`;
    }
    
    if (campaign.is_test) {
      responseText += `🧪 **Test Campaign:** Yes\n`;
    }

    return {
      content: [{
        type: 'text',
        text: responseText
      }]
    };
  }

  private formatCampaignList(campaigns: any): ToolResult {
    const campaignArray = Array.isArray(campaigns) ? campaigns : [campaigns];
    
    let responseText = `📊 **Campaigns List**\n\n`;
    responseText += `📈 **Total Campaigns:** ${campaignArray.length}\n\n`;
    
    if (campaignArray.length === 0) {
      responseText += `📭 No campaigns found.\n\n`;
      responseText += `💡 Create your first campaign to start sending messages to your contact lists.`;
    } else {
      responseText += `**Campaigns:**\n\n`;
      
      campaignArray.forEach((campaign: any, index: number) => {
        responseText += `**${index + 1}.** `;
        
        if (campaign.campaign_id) {
          responseText += `ID: ${campaign.campaign_id} | `;
        }
        
        if (campaign.message_type) {
          responseText += `${campaign.message_type.toUpperCase()} | `;
        }
        
        if (campaign.status) {
          const statusEmoji = this.getStatusEmoji(campaign.status);
          responseText += `${statusEmoji} ${campaign.status}`;
        }
        
        responseText += `\n`;
        
        if (campaign.subject) {
          responseText += `   📝 Subject: "${campaign.subject}"\n`;
        }
        
        // Quick metrics
        const delivered = campaign.delivered || 0;
        const failed = campaign.failed || 0;
        const total = delivered + failed + (campaign.sending || 0);
        
        if (total > 0) {
          responseText += `   📊 Delivered: ${delivered}, Failed: ${failed}, Total: ${total}\n`;
        }
        
        if (campaign.created_at) {
          responseText += `   🕐 Created: ${new Date(campaign.created_at).toLocaleDateString()}\n`;
        }
        
        responseText += `\n`;
      });
      
      responseText += `💡 Use get_campaign with a specific campaign_id to see detailed metrics and configuration.`;
    }

    return {
      content: [{
        type: 'text',
        text: responseText
      }]
    };
  }

  private getStatusEmoji(status?: string): string {
    if (!status) return '❓.js';
    
    const statusLower = status.toLowerCase();
    
    if (statusLower.includes('sent') || statusLower.includes('completed')) return '✅.js';
    if (statusLower.includes('sending') || statusLower.includes('active')) return '📤.js';
    if (statusLower.includes('pending') || statusLower.includes('scheduled')) return '⏳.js';
    if (statusLower.includes('failed') || statusLower.includes('error')) return '❌.js';
    if (statusLower.includes('paused') || statusLower.includes('stopped')) return '⏸️.js';
    if (statusLower.includes('draft')) return '📝.js';
    
    return '📊.js';
  }
}

