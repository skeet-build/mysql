# MySQL

A Model Context Protocol server that provides read-only access to MySQL databases. This server enables LLMs to inspect database schemas and execute read-only queries.

To learn more about MCP Servers see:
- [What is MCP](https://skeet.build/docs/guides/what-is-mcp)
- [Model Context Protocol](https://modelcontextprotocol.io/)

This MySQL MCP Server was designed for seamless integration with [skeet.build](https://skeet.build)

## Components

### Tools

- **query**
  - Execute read-only SQL queries against the connected database
  - Input: `sql` (string): The SQL query to execute
  - All queries are executed within a READ ONLY transaction

### Resources

The server provides schema information for each table in the database:

- **Table Schemas** (`mysql://<host>/<table>/schema`)
  - JSON schema information for each table
  - Includes column names and data types
  - Automatically discovered from database metadata

## Usage with Claude Desktop

To use this server with the Claude Desktop app, add the following configuration to the "mcpServers" section of your `claude_desktop_config.json`:

### NPX

```json
{
  "mcpServers": {
    "mysql": {
      "command": "npx",
      "args": [
        "-y",
        "@skeetbuild/mysql",
        "mysql://localhost:3306/mydb"
      ]
    }
  }
}
```

Replace `/mydb` with your database name.

## Usage with Cursor

To use this server with [Cursor](https://skeet.build/docs/apps/cursor#what-is-model-context-protocol), add the following configuration to your global (`~/.cursor/mcp.json`) or project-specific (`.cursor/mcp.json`) configuration file:

### Global Configuration

```json
{
  "mcpServers": {
    "mysql": {
      "command": "npx",
      "args": [
        "-y",
        "@skeetbuild/mysql",
        "mysql://localhost:3306/mydb"
      ]
    }
  }
}
```

For more details on setting up MCP with Cursor, see the [Cursor MCP documentation](https://skeet.build/docs/apps/cursor#what-is-model-context-protocol).

## Usage with GitHub Copilot in VS Code

To use this server with [GitHub Copilot in VS Code](https://skeet.build/docs/apps/github-copilot), add a new MCP server using the VS Code command palette:

1. Press `Cmd+Shift+P` and search for "Add MCP Server"
2. Select "SSE MCP Server" and use the following configuration:

```json
{
  "mcp": {
    "servers": {
      "mysql": {
        "command": "npx",
        "args": [
          "-y",
          "@skeetbuild/mysql",
          "mysql://localhost:3306/mydb"
        ]
      }
    }
  }
}
```

For detailed setup instructions, see the [GitHub Copilot MCP documentation](https://skeet.build/docs/apps/github-copilot).

## Usage with Windsurf

To use this server with [Windsurf](https://skeet.build/docs/apps/windsurf), add the following configuration to your Windsurf MCP settings:

```json
{
  "mcpServers": {
    "mysql": {
      "command": "npx",
      "args": [
        "-y",
        "@skeetbuild/mysql",
        "mysql://localhost:3306/mydb"
      ]
    }
  }
}
```

For more information on configuring MCP with Windsurf, refer to the [Windsurf MCP documentation](https://skeet.build/docs/apps/windsurf).

## Acknowledgements

This server is based on the MySQL MCP server from the [modelcontextprotocol project](https://github.com/modelcontextprotocol/servers/blob/main/src/postgres).

## License

This MCP server is licensed under the MIT License. This means you are free to use, modify, and distribute the software, subject to the terms and conditions of the MIT License. For more details, please see the LICENSE file in the project repository.