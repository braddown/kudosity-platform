import { KudosityClient } from '../api/KudosityClient.js';
import { ToolResult } from '../types/index.js';
export declare class DeleteWebhookTool {
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
        };
        required: string[];
    };
    constructor(kudosityClient: KudosityClient);
    execute(args: any): Promise<ToolResult>;
}
//# sourceMappingURL=DeleteWebhookTool.d.ts.map