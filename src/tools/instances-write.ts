/**
 * Vast.ai instance write tools (all write-gated).
 *
 * vastai_instance_create — PUT /v0/asks/{id}/
 * vastai_instance_delete — DELETE /v0/instances/{id}/
 * vastai_instance_start  — PUT /v0/instances/{id}/ {state:"running"}
 * vastai_instance_stop   — PUT /v0/instances/{id}/ {state:"stopped"}
 * vastai_instance_reboot — PUT /v0/instances/reboot/{id}/
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  CreateInstanceSchema,
  DeleteInstanceSchema,
  StartInstanceSchema,
  StopInstanceSchema,
  RebootInstanceSchema,
} from "../schemas/instances.js";
import { vastaiFetch } from "../services/vastai.js";
import { requireWrite } from "../utils/write-gate.js";
import { handleApiError } from "../utils/errors.js";

export function registerInstanceWriteTools(server: McpServer): void {
  // ─── Create instance (accept offer) ───────────────────────────

  server.tool(
    "vastai_instance_create",
    "Accept a Vast.ai GPU offer to create an instance. Requires an offer_id from vastai_search_offers. Write-gated: requires VASTAI_WRITE_ENABLED=true and confirm=true.",
    CreateInstanceSchema.shape,
    async (params) => {
      const blocked = requireWrite(params.confirm, "vastai_instance_create");
      if (blocked) {
        return { content: [{ type: "text" as const, text: blocked }], isError: true };
      }

      try {
        const {
          offer_id,
          confirm: _confirm,
          image,
          disk,
          label,
          runtype,
          price,
          onstart,
          env,
          target_state,
          use_jupyter_lab,
          jupyter_dir,
          template_hash_id,
        } = params;

        const body: Record<string, unknown> = { image, runtype, target_state };
        if (disk != null) body.disk = disk;
        if (label) body.label = label;
        if (price != null) body.price = price;
        if (onstart) body.onstart = onstart;
        if (env) body.env = env;
        if (use_jupyter_lab != null) body.use_jupyter_lab = use_jupyter_lab;
        if (jupyter_dir) body.jupyter_dir = jupyter_dir;
        if (template_hash_id) body.template_hash_id = template_hash_id;

        const res = await vastaiFetch(`/v0/asks/${offer_id}/`, {
          method: "PUT",
          body: JSON.stringify(body),
        });

        const data = (await res.json()) as {
          success: boolean;
          new_contract: number;
        };

        return {
          content: [
            {
              type: "text" as const,
              text: `Instance created successfully.\nContract ID: ${data.new_contract}\nUse vastai_instance_get with the contract ID to check status.`,
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

  // ─── Delete instance ───────────────────────────────────────────

  server.tool(
    "vastai_instance_delete",
    "Permanently destroy a Vast.ai instance. This is irreversible — all data on the instance is lost. Write-gated.",
    DeleteInstanceSchema.shape,
    async (params) => {
      const blocked = requireWrite(params.confirm, "vastai_instance_delete");
      if (blocked) {
        return { content: [{ type: "text" as const, text: blocked }], isError: true };
      }

      try {
        await vastaiFetch(`/v0/instances/${params.id}/`, { method: "DELETE" });
        return {
          content: [
            {
              type: "text" as const,
              text: `Instance ${params.id} destroyed successfully.`,
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

  // ─── Start instance ────────────────────────────────────────────

  server.tool(
    "vastai_instance_start",
    "Start a stopped Vast.ai instance. Write-gated.",
    StartInstanceSchema.shape,
    async (params) => {
      const blocked = requireWrite(params.confirm, "vastai_instance_start");
      if (blocked) {
        return { content: [{ type: "text" as const, text: blocked }], isError: true };
      }

      try {
        await vastaiFetch(`/v0/instances/${params.id}/`, {
          method: "PUT",
          body: JSON.stringify({ state: "running" }),
        });
        return {
          content: [
            {
              type: "text" as const,
              text: `Instance ${params.id} start requested. Use vastai_instance_get to check status.`,
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

  // ─── Stop instance ─────────────────────────────────────────────

  server.tool(
    "vastai_instance_stop",
    "Stop a running Vast.ai instance. The instance retains its GPU reservation. Write-gated.",
    StopInstanceSchema.shape,
    async (params) => {
      const blocked = requireWrite(params.confirm, "vastai_instance_stop");
      if (blocked) {
        return { content: [{ type: "text" as const, text: blocked }], isError: true };
      }

      try {
        await vastaiFetch(`/v0/instances/${params.id}/`, {
          method: "PUT",
          body: JSON.stringify({ state: "stopped" }),
        });
        return {
          content: [
            {
              type: "text" as const,
              text: `Instance ${params.id} stop requested. Use vastai_instance_get to check status.`,
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

  // ─── Reboot instance ──────────────────────────────────────────

  server.tool(
    "vastai_instance_reboot",
    "Reboot a Vast.ai instance without losing GPU priority. Write-gated.",
    RebootInstanceSchema.shape,
    async (params) => {
      const blocked = requireWrite(params.confirm, "vastai_instance_reboot");
      if (blocked) {
        return { content: [{ type: "text" as const, text: blocked }], isError: true };
      }

      try {
        await vastaiFetch(`/v0/instances/reboot/${params.id}/`, {
          method: "PUT",
          body: JSON.stringify({}),
        });
        return {
          content: [
            {
              type: "text" as const,
              text: `Instance ${params.id} reboot requested. Use vastai_instance_get to check status.`,
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
