import { validatePhoneNumber, validateSMSMessage, validateSenderID } from '../utils/validators.js';
import { logger } from '../utils/logger.js';
export class SendSMSTool {
    kudosityClient;
    name = 'send_sms';
    description = 'Send an SMS message to a recipient. Automatically handles phone number formatting (accepts +61412345678 or 61412345678), uses default sender if configured, and provides delivery tracking';
    inputSchema = {
        type: 'object',
        properties: {
            recipient: {
                type: 'string',
                description: 'Phone number in international format. Accepts formats like +61412345678, 61412345678, +1234567890, or 1234567890. Will be automatically formatted to E.164.'
            },
            message: {
                type: 'string',
                description: 'Message content to send. Maximum 1600 characters for GSM encoding, 800 for Unicode. Will be automatically segmented if longer.'
            },
            sender: {
                type: 'string',
                description: 'Optional sender ID (up to 11 characters). If not provided, uses the configured default sender or account default.'
            },
            message_ref: {
                type: 'string',
                description: 'Optional reference ID for tracking this message. If not provided, one will be generated automatically.'
            },
            track_links: {
                type: 'boolean',
                description: 'Whether to track link clicks in the message. Defaults to true.'
            }
        },
        required: ['recipient', 'message']
    };
    constructor(kudosityClient) {
        this.kudosityClient = kudosityClient;
    }
    async execute(args) {
        try {
            // Validate phone number
            const phoneValidation = validatePhoneNumber(args.recipient);
            if (!phoneValidation.isValid) {
                return {
                    content: [{
                            type: 'text',
                            text: `❌ Invalid phone number: ${phoneValidation.error}\n\n💡 Please use international format like +61412345678, 61412345678, +1234567890, or 1234567890`
                        }],
                    isError: true
                };
            }
            // Validate message
            const messageValidation = validateSMSMessage(args.message);
            if (!messageValidation.isValid) {
                return {
                    content: [{
                            type: 'text',
                            text: `❌ Invalid message: ${messageValidation.error}`
                        }],
                    isError: true
                };
            }
            // Validate sender ID
            const senderValidation = validateSenderID(args.sender);
            if (!senderValidation.isValid) {
                return {
                    content: [{
                            type: 'text',
                            text: `❌ Invalid sender ID: ${senderValidation.error}`
                        }],
                    isError: true
                };
            }
            // Send SMS
            const result = await this.kudosityClient.sendSMS({
                recipient: phoneValidation.formatted,
                message: args.message,
                sender: args.sender,
                message_ref: args.message_ref,
                track_links: args.track_links
            });
            if (result.success) {
                const messageInfo = messageValidation.info;
                let responseText = `✅ SMS sent successfully!\n\n`;
                responseText += `📱 **Recipient:** ${phoneValidation.formatted}\n`;
                responseText += `📨 **Message ID:** ${result.message_id}\n`;
                responseText += `📝 **Message:** "${args.message}"\n\n`;
                responseText += `📊 **Message Analysis:**\n`;
                responseText += `• Length: ${messageInfo.length} characters\n`;
                responseText += `• Encoding: ${messageInfo.encoding}\n`;
                responseText += `• Segments: ${messageInfo.segments}\n`;
                if (args.sender) {
                    responseText += `• Sender: ${args.sender}\n`;
                }
                if (result.message_id) {
                    responseText += `\n💡 Use the message ID "${result.message_id}" to check delivery status with the get_sms tool.`;
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
                            text: `❌ SMS sending failed: ${result.error}\n\n💡 Please check your API credentials and try again. Use the explain_authentication tool if you need help with setup.`
                        }],
                    isError: true
                };
            }
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            logger.error('SMS tool execution failed', { error: errorMessage });
            return {
                content: [{
                        type: 'text',
                        text: `❌ Unexpected error occurred:\n\n${errorMessage}\n\n💡 This might be a configuration or network issue. Please check your setup and try again.`
                    }],
                isError: true
            };
        }
    }
}
//# sourceMappingURL=SendSMSTool.js.map