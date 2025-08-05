import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { KudosityClient } from './api/KudosityClient.js';
import { configManager } from './utils/config.js';
import { logger } from './utils/logger.js';
// Import all tools
import { SendSMSTool } from './tools/SendSMSTool.js';
import { GetSMSTool } from './tools/GetSMSTool.js';
import { ListSMSTool } from './tools/ListSMSTool.js';
import { CreateWebhookTool } from './tools/CreateWebhookTool.js';
import { UpdateWebhookTool } from './tools/UpdateWebhookTool.js';
import { DeleteWebhookTool } from './tools/DeleteWebhookTool.js';
import { GetCampaignTool } from './tools/GetCampaignTool.js';
export class KudosityMCPServer {
    server;
    kudosityClient;
    tools;
    constructor() {
        // Initialize server
        this.server = new Server({
            name: 'kudosity-mcp-server',
            version: '1.0.0',
            capabilities: {
                tools: {}
            }
        });
        // Initialize Kudosity client
        const config = configManager.getConfig();
        this.kudosityClient = new KudosityClient(config);
        // Initialize tools
        this.tools = new Map();
        this.initializeTools();
        this.setupHandlers();
        logger.info('Kudosity MCP Server initialized', {
            toolCount: this.tools.size,
            tools: Array.from(this.tools.keys())
        });
    }
    initializeTools() {
        const toolInstances = [
            new SendSMSTool(this.kudosityClient),
            new GetSMSTool(this.kudosityClient),
            new ListSMSTool(this.kudosityClient),
            new CreateWebhookTool(this.kudosityClient),
            new UpdateWebhookTool(this.kudosityClient),
            new DeleteWebhookTool(this.kudosityClient),
            new GetCampaignTool(this.kudosityClient)
        ];
        toolInstances.forEach(tool => {
            this.tools.set(tool.name, tool);
            logger.debug('Tool registered', { name: tool.name });
        });
    }
    setupHandlers() {
        // List tools handler
        this.server.setRequestHandler(ListToolsRequestSchema, async () => {
            const tools = Array.from(this.tools.values()).map(tool => ({
                name: tool.name,
                description: tool.description,
                inputSchema: tool.inputSchema
            }));
            logger.debug('Tools listed', { count: tools.length });
            return { tools };
        });
        // Call tool handler
        this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
            const { name, arguments: args } = request.params;
            logger.info('Tool called', { name, hasArgs: !!args });
            const tool = this.tools.get(name);
            if (!tool) {
                const availableTools = Array.from(this.tools.keys()).join(', ');
                const errorMessage = `Unknown tool: ${name}. Available tools: ${availableTools}`;
                logger.error('Unknown tool called', { name, availableTools: Array.from(this.tools.keys()) });
                return {
                    content: [{
                            type: 'text',
                            text: `❌ ${errorMessage}`
                        }],
                    isError: true
                };
            }
            try {
                const result = await tool.execute(args || {});
                logger.info('Tool executed successfully', { name });
                return result;
            }
            catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                logger.error('Tool execution failed', { name, error: errorMessage });
                return {
                    content: [{
                            type: 'text',
                            text: `❌ Tool execution failed: ${errorMessage}`
                        }],
                    isError: true
                };
            }
        });
    }
    async start() {
        const transport = new StdioServerTransport();
        await this.server.connect(transport);
        logger.info('Kudosity MCP Server started and connected via stdio');
    }
    async stop() {
        await this.server.close();
        logger.info('Kudosity MCP Server stopped');
    }
}
//# sourceMappingURL=server.js.map