/**
 * Vast.ai instance read tools.
 *
 * vastai_instance_list — GET /v0/instances/
 * vastai_instance_get  — GET /v0/instances/{id}/
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ListInstancesSchema, GetInstanceSchema } from "../schemas/instances.js";
import { formatInstances, formatInstance } from "../formatters/instance.js";
import { vastaiFetch } from "../services/vastai.js";
import { handleApiError } from "../utils/errors.js";
import { truncateIfNeeded } from "../utils/pagination.js";

export function registerInstanceReadTools(server: McpServer): void {
  // ─── List instances ────────────────────────────────────────────

  server.tool(
    "vastai_instance_list",
    "List your Vast.ai GPU instances with status, GPU spec, pricing, and SSH connectivity.",
    ListInstancesSchema.shape,
    async (params) => {
      try {
        const queryParts: string[] = [];
        if (params.limit) queryParts.push(`limit=${params.limit}`);
        if (params.after_token) queryParts.push(`after_token=${encodeURIComponent(params.after_token)}`);
        const qs = queryParts.length > 0 ? `?${queryParts.join("&")}` : "";

        const res = await vastaiFetch(`/v0/instances/${qs}`);
        const data = (await res.json()) as {
          instances: Record<string, unknown>[];
          instances_found?: number;
        };
        const instances = data.instances || [];

        if (instances.length === 0) {
          return {
            content: [
              {
                type: "text" as const,
                text: "No instances found. Use vastai_search_offers to find and rent GPU instances.",
              },
            ],
          };
        }

        const formatted = formatInstances(instances);
        return {
          content: [
            {
              type: "text" as const,
              text: truncateIfNeeded(
                `${instances.length} instance(s):\n\n${JSON.stringify(formatted, null, 2)}`
              ),
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

  // ─── Get single instance ───────────────────────────────────────

  server.tool(
    "vastai_instance_get",
    "Get detailed information about a specific Vast.ai instance including GPU utilisation, SSH connectivity, and pricing.",
    GetInstanceSchema.shape,
    async (params) => {
      try {
        const res = await vastaiFetch(`/v0/instances/${params.id}/`);
        const data = (await res.json()) as { instances: Record<string, unknown>[] };

        // Single instance endpoint may return in instances array or as top-level
        const raw = data.instances?.[0] || (data as unknown as Record<string, unknown>);
        const formatted = formatInstance(raw);

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(formatted, null, 2),
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
