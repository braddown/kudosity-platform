import { KudosityClient } from '../api/KudosityClient.js';
import { ToolResult } from '../types/index.js';
export declare class UpdateWebhookTool {
    private kudosityClient;
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            webhook_id: {
                type: string;
                description: string;
            };
            url: {
                type: string;
                description: string;
            };
            events: {
                type: string;
                items: {
                    type: string;
                };
                description: string;
            };
            name: {
                type: string;
                description: string;
            };
            active: {
                type: string;
                description: string;
            };
        };
        required: string[];
    };
    constructor(kudosityClient: KudosityClient);
    execute(args: any): Promise<ToolResult>;
}
//# sourceMappingURL=UpdateWebhookTool.d.ts.map