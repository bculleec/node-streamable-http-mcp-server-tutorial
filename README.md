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
```

### Creating the server

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
