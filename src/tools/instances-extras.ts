/**
 * Vast.ai instance extra tools.
 *
 * vastai_instance_logs       — PUT /v0/instances/request_logs/{id}
 * vastai_instance_label      — PUT /v0/instances/{id}/ {label}
 * vastai_instance_change_bid — PUT /v0/instances/bid_price/{id}/
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  InstanceLogsSchema,
  LabelInstanceSchema,
  ChangeBidSchema,
} from "../schemas/instances.js";
import { vastaiFetch } from "../services/vastai.js";
import { requireWrite } from "../utils/write-gate.js";
import { handleApiError } from "../utils/errors.js";
import { truncateIfNeeded } from "../utils/pagination.js";

export function registerInstanceExtrasTools(server: McpServer): void {
  // ─── Instance logs ─────────────────────────────────────────────

  server.tool(
    "vastai_instance_logs",
    "Request container or daemon logs from a Vast.ai instance. Returns a URL to fetch the logs.",
    InstanceLogsSchema.shape,
    async (params) => {
      try {
        const body: Record<string, unknown> = {
          tail: String(params.tail),
        };
        if (params.daemon_logs) {
          body.daemon_logs = "true";
        }

        const res = await vastaiFetch(`/v0/instances/request_logs/${params.id}`, {
          method: "PUT",
          body: JSON.stringify(body),
        });

        const data = (await res.json()) as {
          success: boolean;
          result_url?: string;
          msg?: string;
        };

        if (data.result_url) {
          // Fetch the actual logs from the S3 URL
          try {
            const logRes = await fetch(data.result_url);
            const logText = await logRes.text();
            return {
              content: [
                {
                  type: "text" as const,
                  text: truncateIfNeeded(
                    `Logs for instance ${params.id}:\n\n${logText}`
                  ),
                },
              ],
            };
          } catch {
            return {
              content: [
                {
                  type: "text" as const,
                  text: `Log request submitted. Fetch logs at: ${data.result_url}`,
                },
              ],
            };
          }
        }

        return {
          content: [
            {
              type: "text" as const,
              text: data.msg || "Log request submitted. Logs may take a moment to become available.",
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

  // ─── Label instance ────────────────────────────────────────────

  server.tool(
    "vastai_instance_label",
    "Set a descriptive label on a Vast.ai instance (max 1024 chars).",
    LabelInstanceSchema.shape,
    async (params) => {
      try {
        await vastaiFetch(`/v0/instances/${params.id}/`, {
          method: "PUT",
          body: JSON.stringify({ label: params.label }),
        });

        return {
          content: [
            {
              type: "text" as const,
              text: `Instance ${params.id} label set to "${params.label}".`,
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

  // ─── Change bid price ──────────────────────────────────────────

  server.tool(
    "vastai_instance_change_bid",
    "Change the bid price for an interruptible Vast.ai instance. Write-gated.",
    ChangeBidSchema.shape,
    async (params) => {
      const blocked = requireWrite(params.confirm, "vastai_instance_change_bid");
      if (blocked) {
        return { content: [{ type: "text" as const, text: blocked }], isError: true };
      }

      try {
        await vastaiFetch(`/v0/instances/bid_price/${params.id}/`, {
          method: "PUT",
          body: JSON.stringify({ client_id: "me", price: params.price }),
        });

        return {
          content: [
            {
              type: "text" as const,
              text: `Instance ${params.id} bid price changed to $${params.price.toFixed(4)}/hr.`,
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
