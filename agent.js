import { Agent, run, MCPServerStreamableHttp } from '@openai/agents';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
	const mcpServer = new MCPServerStreamableHttp({
		url: 'http://localhost:8000/mcp',
		name: 'My Awesome MCP Server'
	});
	const agent = new Agent({
		name: 'MCP Assistant',
		instructions: `
Use the tools to respond to user requests. Always dump the output from the tool verbatim, no processing, no rounding.
`,
		mcpServers: [mcpServer],
	});
	try {
		await mcpServer.connect();
		const result = await run(agent, "What is the distance between origin and (13.21235, 15.1565)?");
		console.log(result.finalOutput);
	} catch (error) {
		console.error(error);
	} finally {
		await mcpServer.close();
	}
}

main().catch(console.error);

