import { KudosityClient } from '../api/KudosityClient.js';
import { ToolResult } from '../types/index.js';
export declare class SendSMSTool {
    private kudosityClient;
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            recipient: {
                type: string;
                description: string;
            };
            message: {
                type: string;
                description: string;
            };
            sender: {
                type: string;
                description: string;
            };
            message_ref: {
                type: string;
                description: string;
            };
            track_links: {
                type: string;
                description: string;
            };
        };
        required: string[];
    };
    constructor(kudosityClient: KudosityClient);
    execute(args: any): Promise<ToolResult>;
}
//# sourceMappingURL=SendSMSTool.d.ts.map