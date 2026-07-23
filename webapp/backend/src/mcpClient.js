/**
 * mcpClient.js
 *
 * Thin wrapper for calling out to the MCP servers registered in
 * ../../mcp/.mcp.json — this is the seam where a skill stops returning
 * mock data and starts calling a real tool (GitHub, Slack, Microsoft 365,
 * Atlassian, local Excel/Word).
 *
 * Status: functional scaffold, not battle-tested. The @modelcontextprotocol/sdk
 * client API has moved fast across 2025-2026 — verify method names
 * (`client.connect`, `client.callTool`, transport constructors) against
 * whatever SDK version you actually install before relying on this in
 * anything real. Treat this file as "the shape of the solution," not a
 * guarantee it runs unmodified.
 *
 * Each skill's real (non-mock) path should import `callMcpTool` and pass
 * the server config block straight from mcp/.mcp.json plus a tool name —
 * run `/mcp` in a Claude Code session against the same config to see the
 * exact tool names each server actually registers, since those aren't
 * standardized across servers.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MCP_CONFIG_PATH = path.resolve(__dirname, "../../../mcp/.mcp.json");

function loadServerConfig(serverName) {
  const raw = JSON.parse(fs.readFileSync(MCP_CONFIG_PATH, "utf-8"));
  const cfg = raw.mcpServers?.[serverName];
  if (!cfg) {
    throw new Error(
      `No "${serverName}" entry in mcp/.mcp.json — check the server name matches exactly.`
    );
  }
  return cfg;
}

function expandEnvVars(value) {
  if (typeof value !== "string") return value;
  return value.replace(/\$\{([A-Z0-9_]+)\}/g, (_, name) => process.env[name] ?? "");
}

function expandEnvBlock(env = {}) {
  return Object.fromEntries(Object.entries(env).map(([k, v]) => [k, expandEnvVars(v)]));
}

/**
 * Call a tool on a named MCP server (as registered in mcp/.mcp.json).
 * Supports stdio servers (command/args/env) and http/streamable-http
 * servers (url/headers). Lazily imports the SDK so MOCK_MODE=true never
 * requires it to be installed.
 */
export async function callMcpTool(serverName, toolName, toolArgs = {}) {
  const cfg = loadServerConfig(serverName);
  const { Client } = await import("@modelcontextprotocol/sdk/client/index.js");

  let transport;
  if (cfg.type === "http" || cfg.url) {
    const { StreamableHTTPClientTransport } = await import(
      "@modelcontextprotocol/sdk/client/streamableHttp.js"
    );
    transport = new StreamableHTTPClientTransport(new URL(expandEnvVars(cfg.url)), {
      requestInit: { headers: Object.fromEntries(
        Object.entries(cfg.headers ?? {}).map(([k, v]) => [k, expandEnvVars(v)])
      ) },
    });
  } else {
    const { StdioClientTransport } = await import(
      "@modelcontextprotocol/sdk/client/stdio.js"
    );
    transport = new StdioClientTransport({
      command: cfg.command,
      args: (cfg.args ?? []).map(expandEnvVars),
      env: { ...process.env, ...expandEnvBlock(cfg.env) },
    });
  }

  const client = new Client({ name: "tpm-agent-backend", version: "0.1.0" });
  await client.connect(transport);
  try {
    return await client.callTool({ name: toolName, arguments: toolArgs });
  } finally {
    await client.close();
  }
}
