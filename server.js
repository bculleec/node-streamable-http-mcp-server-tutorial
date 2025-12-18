/* imports */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import * as z from "zod";
import { createMcpExpressApp } from '@modelcontextprotocol/sdk/server/express.js';

/* create the MCP server */
const getServer = () => {
	const server = new McpServer(
		{
			name: 'my-awesome-mcp-server',
			version: '1.0.0'
		}
	);

	/* register a tool for our MCP server */
	server.registerTool(
		'calculate-euclidean-distance',
		{
			description: 'Find the euclidean distance between 2 two-dimensional points',
			inputSchema: {
				x1: z.number().describe('x coordinate of first point'),
				y1: z.number().describe('y coordinate of first point'),
				x2: z.number().describe('x coordinate of second point'),
				y2: z.number().describe('y coordinate of second point'),
			}
		},
		async ({ x1, y1, x2, y2 }) => {
			console.log(`'calculate-euclidean-distance' was called with : `, { x1, y1, x2, y2 });

			/* do other operations you may need here */

			let eucDist;
			try {
				eucDist = calculateEuclideanDistance({ p1: { x: x1, y: y1 }, p2: { x: x2, y: y2 } });
			} catch (error) {
				console.log(`'calculate-euclidean-distance' error : `, error);
				return false;
			}
			

			console.log(`'calculate-euclidean-distance' returned : `, eucDist);

			return { content: [ { type: 'text', text: eucDist.toString() } ] };
		}
	);

	return server;
	
};

/* create an app to expose our MCP server */
const app = createMcpExpressApp();

/* create a POST route */
app.post('/mcp', async (req, res) => {
	const server = getServer();
	try {
		const transport = new StreamableHTTPServerTransport();
		await server.connect(transport);
		await transport.handleRequest(req, res, req.body);
		res.on('close', () => {
			transport.close();
			server.close();
		});
	} catch (error) {
		console.error('Error handling MCP request:', error);
		if (!res.headersSent) {
			res.status(500).json({
				jsonrpc: '2.0',
				error: {
					code: -32603,
					message: 'Internal server error'
				},
				id: null
			});
		}
	}
});

/* start the server */
const PORT = 8000;
app.listen(PORT, error => {
	if (error) {
		console.error('Failed to start server:', error);
		process.exit(1);
	}
	console.log(`My Awesome MCP Streamable HTTP Server listening on port ${PORT}`);
});

/* handle server shutdown */
process.on('SIGINT', async () => {
	console.log('Shutting down server...');
	process.exit(0);
});

/* helpers */
function calculateEuclideanDistance({ p1, p2 }) {
	const eucDist = Math.sqrt(((p1.x - p2.x) ** 2) + ((p1.y - p2.y) ** 2));
	return eucDist;
}
