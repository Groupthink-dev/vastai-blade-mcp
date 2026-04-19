import { z } from "zod";
import { DEFAULT_OFFER_LIMIT } from "../constants.js";

/** GPU filter operators — Vast.ai uses {op: value} objects. */
const FilterOp = z.union([
  z.number(),
  z.string(),
  z.object({ eq: z.union([z.number(), z.string()]).optional() }),
  z.object({ neq: z.union([z.number(), z.string()]).optional() }),
  z.object({ gt: z.number().optional() }),
  z.object({ gte: z.number().optional() }),
  z.object({ lt: z.number().optional() }),
  z.object({ lte: z.number().optional() }),
  z.object({ in: z.array(z.union([z.number(), z.string()])).optional() }),
  z.object({ notin: z.array(z.union([z.number(), z.string()])).optional() }),
]);

/** Search offers — POST /v0/bundles/ */
export const SearchOffersSchema = z.object({
  gpu_name: FilterOp.optional().describe(
    'GPU model filter. String for exact match, or operator object: {eq:"RTX_4090"}, {in:["A100","H100"]}.'
  ),
  num_gpus: FilterOp.optional().describe(
    "Number of GPUs filter. Number for exact match, or operator: {gte:2}, {in:[1,2,4]}."
  ),
  gpu_ram: FilterOp.optional().describe(
    "Per-GPU VRAM in GB. Example: {gte:24} for 24GB+ cards."
  ),
  gpu_total_ram: FilterOp.optional().describe(
    "Total GPU VRAM across all GPUs in GB."
  ),
  cpu_cores: FilterOp.optional().describe("Minimum CPU cores. Example: {gte:8}."),
  cpu_ram: FilterOp.optional().describe("Minimum system RAM in GB. Example: {gte:32}."),
  disk_space: FilterOp.optional().describe("Minimum disk space in GB. Example: {gte:100}."),
  dph_total: FilterOp.optional().describe(
    "Price per hour filter in $/hr. Example: {lte:1.5} for offers under $1.50/hr."
  ),
  inet_down: FilterOp.optional().describe("Minimum download speed in Mbps."),
  inet_up: FilterOp.optional().describe("Minimum upload speed in Mbps."),
  reliability: FilterOp.optional().describe(
    "Host reliability score 0-1. Example: {gte:0.95}."
  ),
  geolocation: FilterOp.optional().describe(
    'Geographic filter. Example: {in:["US","EU"]}.'
  ),
  cuda_max_good: FilterOp.optional().describe("CUDA version. Example: {gte:12.0}."),
  verified: FilterOp.optional().describe("Verification status filter."),
  rentable: FilterOp.optional().describe("Whether the machine is rentable."),
  type: z
    .enum(["ondemand", "bid", "reserved"])
    .default("ondemand")
    .describe('Offer type: "ondemand" (default), "bid" (interruptible), or "reserved".'),
  allocated_storage: z
    .number()
    .optional()
    .describe("Requested disk allocation in GB (default: 8)."),
  order: z
    .array(z.tuple([z.string(), z.enum(["asc", "desc"])]))
    .optional()
    .describe('Sort order as [field, direction] pairs. Example: [["dph_total","asc"]].'),
  limit: z
    .number()
    .int()
    .min(1)
    .max(100)
    .default(DEFAULT_OFFER_LIMIT)
    .describe(`Maximum offers to return (default: ${DEFAULT_OFFER_LIMIT}, max: 100).`),
});

/** Search templates — GET /v0/template/ */
export const SearchTemplatesSchema = z.object({
  name: FilterOp.optional().describe("Template name filter."),
  image: FilterOp.optional().describe("Docker image filter."),
  recommended: FilterOp.optional().describe("Recommended templates filter. Use {eq:true}."),
  limit: z
    .number()
    .int()
    .min(1)
    .max(100)
    .default(DEFAULT_OFFER_LIMIT)
    .describe(`Maximum templates to return (default: ${DEFAULT_OFFER_LIMIT}, max: 100).`),
});
