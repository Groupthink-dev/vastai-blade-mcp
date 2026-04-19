import { z } from "zod";
import { DEFAULT_PER_PAGE, DEFAULT_OFFER_LIMIT } from "../constants.js";

/** Pagination schema for list operations. Vast.ai uses keyset (token) pagination. */
export const PaginationSchema = z.object({
  limit: z
    .number()
    .int()
    .min(1)
    .max(25)
    .default(DEFAULT_PER_PAGE)
    .describe(`Results per page (default: ${DEFAULT_PER_PAGE}, max: 25).`),
  after_token: z
    .string()
    .optional()
    .describe("Pagination token from a previous response's next_token."),
});

/** Offer search limit (separate from pagination — offers use POST with limit). */
export const OfferLimitSchema = z.object({
  limit: z
    .number()
    .int()
    .min(1)
    .max(100)
    .default(DEFAULT_OFFER_LIMIT)
    .describe(`Maximum offers to return (default: ${DEFAULT_OFFER_LIMIT}, max: 100).`),
});

/** Confirmation gate for write operations. */
export const ConfirmSchema = z.object({
  confirm: z
    .literal(true)
    .describe("Safety gate: must be explicitly set to true to proceed with this write operation."),
});
