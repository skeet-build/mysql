#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import * as mysql from "mysql2/promise";

const server = new Server(
  {
    name: "example-servers/mysql",
    version: "0.1.0",
  },
  {
    capabilities: {
      resources: {},
      tools: {},
    },
  }
);

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error("Please provide a database URL as a command-line argument");
  process.exit(1);
}

let databaseUrl = args[0];

// Check if the connection string has a username, password, and database
try {
  const url = new URL(databaseUrl);
  if (!url.pathname || url.pathname === "/") {
    // Add a default database name if not provided
    console.log(
      "No database specified in the connection string, using 'mysql' as default"
    );
    url.pathname = "/mysql";
    databaseUrl = url.toString();
  }

  // If no username is provided, add a default one
  if (!url.username) {
    console.log(
      "No username specified in the connection string, using 'root' as default"
    );
    const tempUrl = new URL(databaseUrl);
    tempUrl.username = "root";
    databaseUrl = tempUrl.toString();
  }
} catch (error) {
  console.error(
    "Invalid database URL format. Please use: mysql://[username[:password]@]hostname[:port]/database"
  );
  process.exit(1);
}

const resourceBaseUrl = new URL(databaseUrl);
resourceBaseUrl.protocol = "mysql:";
resourceBaseUrl.password = "";

// Parse the URL for MySQL connection
const url = new URL(databaseUrl);
const connectionConfig = {
  host: url.hostname,
  port: url.port ? parseInt(url.port, 10) : 3306,
  user: url.username,
  password: url.password,
  database: url.pathname.replace(/^\//, ""),
};

// Create a connection pool
const pool = mysql.createPool(connectionConfig);

const SCHEMA_PATH = "schema";

server.setRequestHandler(ListResourcesRequestSchema, async () => {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.query(
      "SELECT TABLE_NAME as table_name FROM information_schema.tables WHERE table_schema = ?",
      [connectionConfig.database]
    );

    return {
      resources: (rows as any[]).map((row) => ({
        uri: new URL(`${row.table_name}/${SCHEMA_PATH}`, resourceBaseUrl).href,
        mimeType: "application/json",
        name: `"${row.table_name}" database schema`,
      })),
    };
  } finally {
    connection.release();
  }
});

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const resourceUrl = new URL(request.params.uri);

  const pathComponents = resourceUrl.pathname.split("/");
  const schema = pathComponents.pop();
  const tableName = pathComponents.pop();

  if (schema !== SCHEMA_PATH) {
    throw new Error("Invalid resource URI");
  }

  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.query(
      "SELECT COLUMN_NAME as column_name, DATA_TYPE as data_type FROM information_schema.columns WHERE table_name = ? AND table_schema = ?",
      [tableName, connectionConfig.database]
    );

    return {
      contents: [
        {
          uri: request.params.uri,
          mimeType: "application/json",
          text: JSON.stringify(rows, null, 2),
        },
      ],
    };
  } finally {
    connection.release();
  }
});

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "query",
        description: "Run a read-only SQL query",
        inputSchema: {
          type: "object",
          properties: {
            sql: { type: "string" },
          },
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === "query") {
    const sql = request.params.arguments?.sql as string;

    const connection = await pool.getConnection();
    try {
      // Set session to read only
      await connection.query("SET SESSION TRANSACTION READ ONLY");
      await connection.beginTransaction();

      const [rows] = await connection.query(sql);

      return {
        content: [{ type: "text", text: JSON.stringify(rows, null, 2) }],
        isError: false,
      };
    } catch (error) {
      throw error;
    } finally {
      try {
        await connection.rollback();
      } catch (error) {
        console.warn("Could not roll back transaction:", error);
      }
      connection.release();
    }
  }
  throw new Error(`Unknown tool: ${request.params.name}`);
});

async function runServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

runServer().catch(console.error);
