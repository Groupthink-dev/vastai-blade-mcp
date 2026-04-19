/**
 * Vast.ai offer search tools.
 *
 * vastai_search_offers  — POST /v0/bundles/ (GPU marketplace search)
 * vastai_search_templates — GET /v0/template/ (pre-built image templates)
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SearchOffersSchema, SearchTemplatesSchema } from "../schemas/offers.js";
import { formatOffers, formatTemplates } from "../formatters/offer.js";
import { vastaiFetch } from "../services/vastai.js";
import { handleApiError } from "../utils/errors.js";
import { truncateIfNeeded } from "../utils/pagination.js";

export function registerOfferTools(server: McpServer): void {
  // ─── Search GPU offers ─────────────────────────────────────────

  server.tool(
    "vastai_search_offers",
    "Search the Vast.ai GPU marketplace for available offers. Filter by GPU model, VRAM, price, location, and more. Returns token-efficient summaries.",
    SearchOffersSchema.shape,
    async (params) => {
      try {
        const { limit, type, allocated_storage, order, ...filters } = params;

        // Build the request body with Vast.ai filter format
        const body: Record<string, unknown> = {
          limit,
          type,
          ...(allocated_storage != null ? { allocated_storage } : {}),
          ...(order ? { order } : {}),
        };

        // Add filters directly — they use {op: value} format natively
        for (const [key, value] of Object.entries(filters)) {
          if (value !== undefined) {
            body[key] = value;
          }
        }

        const res = await vastaiFetch("/v0/bundles/", {
          method: "POST",
          body: JSON.stringify(body),
        });

        const data = (await res.json()) as { offers: Record<string, unknown>[] };
        const offers = data.offers || [];

        if (offers.length === 0) {
          return {
            content: [
              {
                type: "text" as const,
                text: "No offers found matching your filters. Try broadening your search criteria.",
              },
            ],
          };
        }

        const formatted = formatOffers(offers);
        return {
          content: [
            {
              type: "text" as const,
              text: truncateIfNeeded(
                `Found ${offers.length} offer(s):\n\n${JSON.stringify(formatted, null, 2)}`
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

  // ─── Search templates ──────────────────────────────────────────

  server.tool(
    "vastai_search_templates",
    "Search Vast.ai pre-built templates (Docker images with pre-configured environments). Filter by name or image.",
    SearchTemplatesSchema.shape,
    async (params) => {
      try {
        const { limit, ...filters } = params;

        // Build query params for GET request
        const selectFilters: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(filters)) {
          if (value !== undefined) {
            selectFilters[key] = value;
          }
        }

        const queryParts: string[] = [];
        if (Object.keys(selectFilters).length > 0) {
          queryParts.push(`select_filters=${encodeURIComponent(JSON.stringify(selectFilters))}`);
        }
        queryParts.push(`select_cols=${encodeURIComponent(JSON.stringify(["*"]))}`);

        const res = await vastaiFetch(`/v0/template/?${queryParts.join("&")}`);
        const data = (await res.json()) as {
          templates: Record<string, unknown>[];
          templates_found: number;
        };
        const templates = (data.templates || []).slice(0, limit);

        if (templates.length === 0) {
          return {
            content: [
              {
                type: "text" as const,
                text: "No templates found matching your filters.",
              },
            ],
          };
        }

        const formatted = formatTemplates(templates);
        return {
          content: [
            {
              type: "text" as const,
              text: truncateIfNeeded(
                `Found ${data.templates_found} template(s) (showing ${formatted.length}):\n\n${JSON.stringify(formatted, null, 2)}`
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
}
