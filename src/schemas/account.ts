import { z } from "zod";
import { PaginationSchema } from "./common.js";

/** List SSH keys — GET /v0/ssh/ */
export const ListSshKeysSchema = z.object({});

/** Create SSH key — POST /v0/ssh/ */
export const CreateSshKeySchema = z.object({
  ssh_key: z
    .string()
    .describe("SSH public key content (from .pub file)."),
});

/** Account info — GET /v0/users/current/ (no params) */
export const AccountInfoSchema = z.object({});

/** Billing invoices — GET /v1/invoices/ */
export const BillingInvoicesSchema = PaginationSchema.extend({
  days: z
    .number()
    .int()
    .min(1)
    .max(365)
    .default(30)
    .describe("Number of days of billing history to retrieve (default: 30)."),
  service: z
    .enum(["transfer", "stripe_payments", "bitpay", "coinbase", "instance_prepay", "paypal_manual", "wise_manual"])
    .optional()
    .describe("Filter by payment service type."),
});
