## Welcome
This tutorial will guide you through writing your own MCP server in Node.js and connect it to your AI agent.
We will be specifically connecting it to an OpenAI agent, but it can be connected to any agent that accepts Streamable HTTP MCP.
This project can easily be extended to fit your use-case and you will learn how to add any new tools your agent may need.

### Project set-up and dependencies
Start by creating a new project and installing the dependencies. 

```
mkdir my-awesome-node-mcp-server
cd my-awesome-node-mcp-server
npm init -y
```

Be sure to set the `type: "module"` in your `package.json` to avoid the annoying warning message every time you run your server.

The package we will need to build our mcp server is called `@modelcontextprotocol/sdk`.
We will also use `@zod/3` to specify constraints on our tool parameters.

```
npm i @modelcontextprotocol/sdk zod@3
```

Another thing I like to do, although not strictly essential is to install `nodemon` for auto-restart on file changes.

```
npm i nodemon --save-dev
```

Then add this to your `package.json` under `scripts`.

```
"dev": "nodemon server.js"
```

We will create server.js shortly but now whenever you want to start your server, you can simply type in:

```
npm run dev
```

The last thing we will do is create the `server.js` file where we can start building our fresh MCP server.

```
vi server.js
```

### Imports
We will need the following imports to use in our server script.

```
/* imports */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { z } from "zod";
import { createMcpExpressApp } from '@modelcontextprotocol/sdk/server/express.js';
```

### Creating the MCP server
Next we will create the MCP server. You can choose any name and version number you like. This is mostly just for metadata for the language model.

```
/* create the MCP server */
const getServer = () => {
        const server = new McpServer(
                {
                        name: 'my-awesome-mcp-server',
                        version: '1.0.0'
                }
        );

		return server;
};
```

### Registering a tool
Next we will add a generic tool. I chose determining the distance between 2 points but you can replace this with any utility you want your agent to be able to call.
Add this just after your server definition.

```
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
```

Then you can define the function in the same file or import it from a different file.

```
/* helpers */
function calculateEuclideanDistance(p1, p2) {
        const eucDist = Math.sqrt(((p1.x - p2.x) ** 2) + ((p1.y - p2.y) ** 2));
        return eucDist;
}
```

We now have a minimal MCP server definition with just one tool. We will now create an app that will run and expose our MCP server.

### Running the MCP server
We will use the `express` library to create our app.

```
/* create an app to expose our MCP server */
const app = createMcpExpressApp();
```

Next, we will add a `post` endpoint at `/mcp` that will actually handle our MCP server requests. You can add GET and DELETE endpoints but that's not strictly necessarily.
It is just nice for defensiveness and human readability.

```
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
``` 

### Server start and shutdown
The very last thing we will want is to start the server and also define the shutdown behavior.
It is possible that the `PORT 8000` may already be in use if you are running other web applications. If that's the case, simple use a different port.

```
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
```

Hopefully, you should see a message that your server is running.

### Testing our server with an Agent
Now, we finally get to try out our MCP server. We will use OpenAI's Agent SDK to create an agent but you can hook up any agent that accepts
Streamable HTTP MCP server to your new server.

We will need to install the following dependencies:

```
npm i @openai/agents dotenv
```

Create a `.env` file and set your OpenAI API key as follows:

```
OPENAI_API_KEY=<api key>
```

*Note: If you are sharing your through `git` you should add an entry for your `.env` file in `.gitignore` to avoid your API keys getting leaked.*

We will create a new file called `agent.js`.

```
vi agent.js
```

```
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
```

Then, you can run your agent with:

```
node agent.js
```

And you should see the following in your `server.js` logs:

```
My Awesome MCP Streamable HTTP Server listening on port 8000
'calculate-euclidean-distance' was called with :  { x1: 0, y1: 0, x2: 13.21235, y2: 15.1565 }
'calculate-euclidean-distance' returned :  20.106856660664292
```

indicating that the agent was successfully able to find and use the tool.

### Conclusion and Next Steps
You have successfully built a Streamable HTTP MCP Server in Node.js, and built an OpenAI Agent with the Node.js SDK that connects to and calls a tool
from your MCP server.

From this point, you can add more tools, and more complex tools such as calling command line scripts, or running functions from other libraries. You
can also build your OpenAI Agent more to make it a conversational assistant that can call the tools from your MCP whenever it needs it.


