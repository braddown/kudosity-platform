import { KudosityClient } from '../api/KudosityClient.js';
import { ToolResult } from '../types/index.js';
export declare class GetCampaignTool {
    private kudosityClient;
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            campaign_id: {
                type: string;
                description: string;
            };
        };
        required: never[];
    };
    constructor(kudosityClient: KudosityClient);
    execute(args: any): Promise<ToolResult>;
    private formatSingleCampaign;
    private formatCampaignList;
    private getStatusEmoji;
}
//# sourceMappingURL=GetCampaignTool.d.ts.map