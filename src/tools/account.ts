/**
 * Vast.ai account and billing tools.
 *
 * vastai_account_info     — GET /v0/users/current/
 * vastai_billing_invoices — GET /v1/invoices/
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { AccountInfoSchema, BillingInvoicesSchema } from "../schemas/account.js";
import { formatAccount, formatInvoices } from "../formatters/account.js";
import { vastaiFetch } from "../services/vastai.js";
import { handleApiError } from "../utils/errors.js";
import { truncateIfNeeded } from "../utils/pagination.js";

export function registerAccountTools(server: McpServer): void {
  // ─── Account info ──────────────────────────────────────────────

  server.tool(
    "vastai_account_info",
    "Get Vast.ai account information including balance and SSH key status.",
    AccountInfoSchema.shape,
    async () => {
      try {
        const res = await vastaiFetch("/v0/users/current/");
        const data = (await res.json()) as Record<string, unknown>;
        const formatted = formatAccount(data);

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

  // ─── Billing invoices ──────────────────────────────────────────

  server.tool(
    "vastai_billing_invoices",
    "Get Vast.ai billing history and invoices. Filter by date range and payment service.",
    BillingInvoicesSchema.shape,
    async (params) => {
      try {
        // Build date range filter — days back from now
        const now = Math.floor(Date.now() / 1000);
        const since = now - params.days * 86400;
        const selectFilters: Record<string, unknown> = {
          when: { gte: since },
        };
        if (params.service) {
          selectFilters.service = { eq: params.service };
        }

        const queryParts = [
          `select_filters=${encodeURIComponent(JSON.stringify(selectFilters))}`,
          `limit=${params.limit}`,
          `latest_first=true`,
        ];
        if (params.after_token) {
          queryParts.push(`after_token=${encodeURIComponent(params.after_token)}`);
        }

        const res = await vastaiFetch(`/v1/invoices/?${queryParts.join("&")}`);
        const data = (await res.json()) as {
          results: Record<string, unknown>[];
          total: number;
          next_token?: string | null;
        };
        const invoices = data.results || [];

        if (invoices.length === 0) {
          return {
            content: [
              {
                type: "text" as const,
                text: `No invoices found in the last ${params.days} days.`,
              },
            ],
          };
        }

        const formatted = formatInvoices(invoices);
        let text = `${data.total} total invoice(s), showing ${invoices.length}:\n\n${JSON.stringify(formatted, null, 2)}`;
        if (data.next_token) {
          text += `\n\nMore results available. Use after_token: "${data.next_token}" to get the next page.`;
        }

        return {
          content: [
            {
              type: "text" as const,
              text: truncateIfNeeded(text),
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
