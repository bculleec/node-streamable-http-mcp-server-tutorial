/* imports */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { z } from "zod";
import { createMcpExpressApp } from '@modelcontextprotocol/sdk/server/express.js';

/* create the MCP server */
const getServer = () => {
	const server = new McpServer(
		{
			name: 'my-awesome-mcp-server',
			version: '1.0.0'
		}
	);
};

/* create an app to expose our MCP server */
const app = createMcpExpressApp();

