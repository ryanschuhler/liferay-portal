---

allowed-tools: [Bash, Read, Edit, Write]
argument-hint: "[email:password]"
description: Configure the Liferay MCP server for the liferay-one-workspace. Use when the user asks to set up or enable the Liferay MCP, or invokes /one-mcp.
name: one-mcp

---

# Configure Liferay MCP

Configure Claude Code to connect to the local Liferay instance as an MCP server. Run the commands from `workspaces/liferay-one-workspace/`.

## 1. Resolve Credentials

Read the credentials from `${ARGUMENTS}` in the `email:password` form. Ask the user for the local Liferay administrator email and password when `${ARGUMENTS}` holds no credentials.

## 2. Enable the Feature Flag

Read `configs/local/portal-env.properties`. Add `feature.flag.LPD-63311=true` to the end of the file when the file does not hold it. This property enables the `/o/mcp` endpoint on the Liferay instance.

## 3. Compute the Auth Token

Run this command:

```bash
echo -n "email:password" | base64
```

## 4. Update `settings.local.json`

Read `.claude/settings.local.json`. Merge the `mcpServers` block below into the file. Keep every other key in the file. Replace the `liferay` entry under `mcpServers` when the file holds one.

```json
{
	"mcpServers": {
		"liferay": {
			"args": [
				"-y",
				"mcp-remote",
				"http://localhost:8080/o/mcp",
				"--header",
				"Authorization: Basic <base64-token>"
			],
			"command": "npx"
		}
	}
}
```

## 5. Report Next Steps

Tell the user:

- Restart Liferay with `docker compose restart liferay` when step 2 added the feature flag. The flag then takes effect.
- Restart Claude Code, or run `/mcp`, to load the new MCP server.
- The `liferay` MCP tools are available while Liferay runs. The server is not available while Liferay is stopped, and it reports no error. Nothing else changes.