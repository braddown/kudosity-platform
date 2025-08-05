// Kudosity MCP Server Types

export interface KudosityConfig {
  apiKey: string;
  defaultSender?: string;
  logLevel?: 'error' | 'warn' | 'info' | 'debug';
  timeout?: number;
  retryAttempts?: number;
}

// SMS Types
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

// Webhook Types
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

// Campaign Types
export interface CampaignResponse {
  success: boolean;
  data?: any;
  error?: string;
}

// Tool Result Types
export interface ToolResult {
  content: Array<{
    type: 'text';
    text: string;
  }>;
  isError?: boolean;
}

