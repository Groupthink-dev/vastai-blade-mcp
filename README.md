# Vast.ai Blade MCP

A GPU marketplace MCP server for Vast.ai. 16 tools for searching GPU offers, provisioning instances, managing bids, and billing — with token-efficient defaults and dual safety gates on every write operation.

Implements the [`virtualisation-v1`](https://github.com/Groupthink-dev/stallari-pack-spec) service contract.

## Why Blade MCP?

The `-blade-mcp` suffix identifies this as part of the [Blade MCP](https://github.com/Groupthink-dev) family — purpose-built MCP servers with:

- **Service contracts** — implements `virtualisation-v1` so agentic platforms can swap between GPU providers (Vultr, Vast.ai, RunPod) without rewriting prompts.
- **Token efficiency** — formatters strip ~60% of raw API response. An offer summary shows GPU model, VRAM, price/hr, and reliability — not 50+ fields of metadata.
- **Dual write gates** — environment variable + per-call confirmation on all destructive operations. Accepting GPU offers incurs charges immediately; accidental invocations are expensive.
- **Dual transport** — stdio for local use, Streamable HTTP for remote and always-on deployment.

Other blades: [vultr-blade-mcp](https://github.com/Groupthink-dev/vultr-blade-mcp) (50 tools), [cloudflare-blade-mcp](https://github.com/Groupthink-dev/cloudflare-blade-mcp) (53 tools), [fastmail-blade-mcp](https://github.com/Groupthink-dev/fastmail-blade-mcp) (20 tools), and more.

## Quick Start

### Install

```bash
git clone https://github.com/Groupthink-dev/vastai-blade-mcp.git
cd vastai-blade-mcp
npm install && npm run build
```

### Configure

```bash
# Required — get your API key at https://cloud.vast.ai/cli/
export VASTAI_API_KEY="your-api-key"

# Required for write operations (create, delete, start, stop, reboot, change bid)
export VASTAI_WRITE_ENABLED="true"
```

### Run

```bash
# stdio (default — for Claude Code, Claude Desktop)
node dist/index.js

# HTTP (for remote access, tunnels, always-on deployment)
TRANSPORT=http PORT=8783 node dist/index.js
```

### Claude Desktop config

```json
{
  "mcpServers": {
    "vastai": {
      "command": "node",
      "args": ["/path/to/vastai-blade-mcp/dist/index.js"],
      "env": {
        "VASTAI_API_KEY": "your-api-key",
        "VASTAI_WRITE_ENABLED": "true"
      }
    }
  }
}
```

## Tools (16)

### Offers (2)

| Tool | Description |
|------|-------------|
| `vastai_search_offers` | Search the GPU marketplace. Filter by GPU model, VRAM, price, location, reliability |
| `vastai_search_templates` | Browse pre-built Docker image templates |

### Instances (7)

| Tool | Description |
|------|-------------|
| `vastai_instance_list` | List your GPU instances with status, GPU spec, pricing, SSH connectivity |
| `vastai_instance_get` | Get detailed instance info including GPU utilisation and temperature |
| `vastai_instance_create` | Accept a GPU offer to create an instance (write-gated) |
| `vastai_instance_delete` | Permanently destroy an instance (write-gated, irreversible) |
| `vastai_instance_start` | Start a stopped instance (write-gated) |
| `vastai_instance_stop` | Stop a running instance, retaining GPU reservation (write-gated) |
| `vastai_instance_reboot` | Reboot without losing GPU priority (write-gated) |

### Instance Extras (3)

| Tool | Description |
|------|-------------|
| `vastai_instance_logs` | Fetch container or daemon logs |
| `vastai_instance_label` | Set a descriptive label on an instance |
| `vastai_instance_change_bid` | Change bid price for interruptible instances (write-gated) |

### SSH Keys (2)

| Tool | Description |
|------|-------------|
| `vastai_ssh_key_list` | List SSH keys on your account |
| `vastai_ssh_key_create` | Add a new SSH public key (write-gated) |

### Account (2)

| Tool | Description |
|------|-------------|
| `vastai_account_info` | Account details and balance |
| `vastai_billing_invoices` | Billing history with date range and service filters |

## Architecture

```
src/
├── index.ts              # Entry point (stdio/HTTP dual transport)
├── server.ts             # McpServer creation, registers all 16 tools
├── constants.ts          # API base URL, defaults, env var names
├── services/
│   ├── vastai.ts         # API client, key validation
│   └── auth.ts           # Bearer token middleware for HTTP transport
├── schemas/
│   ├── common.ts         # Pagination, ConfirmSchema
│   ├── offers.ts         # Search offers/templates schemas
│   ├── instances.ts      # Instance CRUD + extras schemas
│   └── account.ts        # SSH keys, account, billing schemas
├── formatters/
│   ├── offer.ts          # GPU offer → token-efficient summary
│   ├── instance.ts       # Instance → token-efficient summary
│   └── account.ts        # Account, SSH key, invoice formatters
├── tools/
│   ├── offers.ts         # Marketplace search tools
│   ├── instances-read.ts # List, get instance
│   ├── instances-write.ts # Create, delete, start, stop, reboot
│   ├── instances-extras.ts # Logs, label, change bid
│   ├── ssh-keys.ts       # SSH key management
│   └── account.ts        # Account info, billing
└── utils/
    ├── errors.ts         # API error → actionable message
    ├── write-gate.ts     # Dual write gate (env var + confirm)
    └── pagination.ts     # Response truncation
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `VASTAI_API_KEY` | Yes | Vast.ai API key |
| `VASTAI_WRITE_ENABLED` | For writes | Set to `true` to enable write operations |
| `MCP_API_TOKEN` | No | Bearer token for HTTP transport auth |
| `TRANSPORT` | No | `stdio` (default) or `http` |
| `PORT` | No | HTTP port (default: 8783) |

## Write Safety

Every destructive operation is double-gated:

1. **Environment gate**: `VASTAI_WRITE_ENABLED=true` must be set
2. **Per-call gate**: `confirm: true` must be passed in the tool input

Both gates must pass. This prevents accidental GPU provisioning (which incurs charges immediately) while keeping read operations frictionless.

## Vast.ai Concepts

Unlike traditional IaaS (Vultr, DigitalOcean), Vast.ai is a **GPU marketplace**:

- **Offers** are available GPU machines from P2P hosts. You search offers with filters (GPU model, VRAM, price).
- **Instances** are created by accepting an offer (`vastai_instance_create` with an `offer_id`).
- **Bid pricing** — interruptible instances can be cheaper with bid-based pricing. Change bids dynamically with `vastai_instance_change_bid`.
- **Container-native** — instances run Docker images. No cloud-init. Use `onstart` for shell commands and `image` for the Docker image.
- **Templates** are pre-configured Docker images (PyTorch, TensorFlow, etc.) that can be used as base configurations.

## Development

```bash
npm run dev          # tsx watch (stdio)
npm run dev:http     # tsx watch (HTTP on port 8783)
npm run typecheck    # tsc --noEmit
npm test             # vitest (33 tests)
```

## License

MIT
