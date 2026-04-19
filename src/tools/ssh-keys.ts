/**
 * Vast.ai SSH key tools.
 *
 * vastai_ssh_key_list   — GET /v0/ssh/
 * vastai_ssh_key_create — POST /v0/ssh/
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ListSshKeysSchema, CreateSshKeySchema } from "../schemas/account.js";
import { formatSshKeys } from "../formatters/account.js";
import { vastaiFetch } from "../services/vastai.js";
import { requireWrite } from "../utils/write-gate.js";
import { handleApiError } from "../utils/errors.js";

export function registerSshKeyTools(server: McpServer): void {
  // ─── List SSH keys ─────────────────────────────────────────────

  server.tool(
    "vastai_ssh_key_list",
    "List SSH keys associated with your Vast.ai account.",
    ListSshKeysSchema.shape,
    async () => {
      try {
        const res = await vastaiFetch("/v0/ssh/");
        const data = (await res.json()) as {
          ssh_keys: Record<string, unknown>[];
        };
        const keys = data.ssh_keys || (Array.isArray(data) ? data as unknown as Record<string, unknown>[] : []);

        if (keys.length === 0) {
          return {
            content: [
              {
                type: "text" as const,
                text: "No SSH keys found. Add one with vastai_ssh_key_create to enable SSH access to instances.",
              },
            ],
          };
        }

        const formatted = formatSshKeys(keys);
        return {
          content: [
            {
              type: "text" as const,
              text: `${keys.length} SSH key(s):\n\n${JSON.stringify(formatted, null, 2)}`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [{ type: "text" as const, text: handleApiError(error) }],
          isError: true,
        };
      }
    }
  );

  // ─── Create SSH key ────────────────────────────────────────────

  server.tool(
    "vastai_ssh_key_create",
    "Add a new SSH public key to your Vast.ai account. Write-gated: requires VASTAI_WRITE_ENABLED=true.",
    CreateSshKeySchema.shape,
    async (params) => {
      // SSH key creation is a write op but doesn't use ConfirmSchema (low risk)
      // Still gate it behind VASTAI_WRITE_ENABLED for consistency
      const blocked = requireWrite(true, "vastai_ssh_key_create");
      if (blocked) {
        return { content: [{ type: "text" as const, text: blocked }], isError: true };
      }

      try {
        const res = await vastaiFetch("/v0/ssh/", {
          method: "POST",
          body: JSON.stringify({ ssh_key: params.ssh_key }),
        });

        const data = (await res.json()) as {
          success: boolean;
          key: { id: number; public_key: string };
        };

        return {
          content: [
            {
              type: "text" as const,
              text: `SSH key added successfully (ID: ${data.key?.id || "unknown"}).`,
            },
          ],
        };
      } catch (error) {
        return {
          content: [{ type: "text" as const, text: handleApiError(error) }],
          isError: true,
        };
      }
    }
  );
}
