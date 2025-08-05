import { KudosityClient } from '../api/KudosityClient.js';
import { ToolResult } from '../types/index.js';
export declare class ListSMSTool {
    private kudosityClient;
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            limit: {
                type: string;
                description: string;
            };
            offset: {
                type: string;
                description: string;
            };
            status: {
                type: string;
                description: string;
            };
            from_date: {
                type: string;
                description: string;
            };
            to_date: {
                type: string;
                description: string;
            };
        };
        required: never[];
    };
    constructor(kudosityClient: KudosityClient);
    execute(args: any): Promise<ToolResult>;
    private isValidDate;
    private getStatusEmoji;
}
//# sourceMappingURL=ListSMSTool.d.ts.map