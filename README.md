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

                        const eucDist = calculateEuclideanDistance({ p1: { x: x1, y: y1 }, p2: { x: x1, y: y1 } });

                        console.log(`'calculate-euclidean-distance' returned : `, eucDist);

                        return eucDist;
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
