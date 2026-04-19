import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerOfferTools } from "./tools/offers.js";
import { registerInstanceReadTools } from "./tools/instances-read.js";
import { registerInstanceWriteTools } from "./tools/instances-write.js";
import { registerInstanceExtrasTools } from "./tools/instances-extras.js";
import { registerSshKeyTools } from "./tools/ssh-keys.js";
import { registerAccountTools } from "./tools/account.js";

/**
 * Creates and configures the MCP server with all Vast.ai tools registered.
 *
 * 16 tools total:
 *   Offers (2):     vastai_search_offers, vastai_search_templates
 *   Instances (7):  vastai_instance_list, vastai_instance_get, vastai_instance_create,
 *                   vastai_instance_delete, vastai_instance_start, vastai_instance_stop,
 *                   vastai_instance_reboot
 *   Extras (3):     vastai_instance_logs, vastai_instance_label, vastai_instance_change_bid
 *   SSH Keys (2):   vastai_ssh_key_list, vastai_ssh_key_create
 *   Account (2):    vastai_account_info, vastai_billing_invoices
 */
export function createServer(): McpServer {
  const server = new McpServer({
    name: "vastai-blade-mcp",
    version: "0.1.0",
  });

  // Offers — marketplace search
  registerOfferTools(server);

  // Instances — read
  registerInstanceReadTools(server);

  // Instances — write (gated)
  registerInstanceWriteTools(server);

  // Instances — extras (logs, label, bid)
  registerInstanceExtrasTools(server);

  // SSH keys
  registerSshKeyTools(server);

  // Account + billing
  registerAccountTools(server);

  return server;
}
