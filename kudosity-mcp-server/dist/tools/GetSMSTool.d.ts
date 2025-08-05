import { KudosityClient } from '../api/KudosityClient.js';
import { ToolResult } from '../types/index.js';
export declare class GetSMSTool {
    private kudosityClient;
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            message_id: {
                type: string;
                description: string;
            };
        };
        required: string[];
    };
    constructor(kudosityClient: KudosityClient);
    execute(args: any): Promise<ToolResult>;
    private getStatusEmoji;
}
//# sourceMappingURL=GetSMSTool.d.ts.map