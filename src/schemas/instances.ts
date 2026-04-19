import { z } from "zod";
import { PaginationSchema, ConfirmSchema } from "./common.js";

/** List instances — GET /v0/instances/ */
export const ListInstancesSchema = PaginationSchema;

/** Get single instance — GET /v0/instances/{id}/ */
export const GetInstanceSchema = z.object({
  id: z.number().int().describe("Instance ID."),
});

/** Create instance (accept offer) — PUT /v0/asks/{id}/ */
export const CreateInstanceSchema = ConfirmSchema.extend({
  offer_id: z
    .number()
    .int()
    .describe("Offer ID (ask_contract_id) to accept from search results."),
  image: z
    .string()
    .default("vastai/base-image:@vastai-automatic-tag")
    .describe("Docker image to launch. Default: vastai/base-image."),
  disk: z.number().optional().describe("Local disk partition size in GB."),
  label: z.string().optional().describe("Custom instance label."),
  runtype: z
    .enum(["ssh", "jupyter", "args", "ssh_proxy", "ssh_direct", "jupyter_proxy", "jupyter_direct"])
    .default("ssh")
    .describe('Launch mode (default: "ssh").'),
  price: z
    .number()
    .min(0.001)
    .max(128)
    .optional()
    .describe("Bid price per hour in $/hr. Only for interruptible (bid) instances."),
  onstart: z
    .string()
    .optional()
    .describe("Shell commands to execute at instance startup."),
  env: z
    .string()
    .optional()
    .describe('Environment variables in Docker flag format. Example: "-e KEY=VALUE -p 8080:8080".'),
  target_state: z
    .enum(["running", "stopped"])
    .default("running")
    .describe('Initial state (default: "running").'),
  use_jupyter_lab: z
    .boolean()
    .optional()
    .describe("Launch Jupyter Lab instead of classic notebook."),
  jupyter_dir: z.string().optional().describe("Jupyter working directory."),
  template_hash_id: z
    .string()
    .optional()
    .describe("Template hash ID to use as base configuration."),
});

/** Delete instance — DELETE /v0/instances/{id}/ */
export const DeleteInstanceSchema = ConfirmSchema.extend({
  id: z.number().int().describe("Instance ID to destroy."),
});

/** Start instance — PUT /v0/instances/{id}/ with state=running */
export const StartInstanceSchema = ConfirmSchema.extend({
  id: z.number().int().describe("Instance ID to start."),
});

/** Stop instance — PUT /v0/instances/{id}/ with state=stopped */
export const StopInstanceSchema = ConfirmSchema.extend({
  id: z.number().int().describe("Instance ID to stop."),
});

/** Reboot instance — PUT /v0/instances/reboot/{id}/ */
export const RebootInstanceSchema = ConfirmSchema.extend({
  id: z.number().int().describe("Instance ID to reboot."),
});

/** Instance logs — PUT /v0/instances/request_logs/{id} */
export const InstanceLogsSchema = z.object({
  id: z.number().int().describe("Instance ID."),
  tail: z
    .number()
    .int()
    .min(1)
    .max(1000)
    .default(100)
    .describe("Number of lines from end of logs (default: 100)."),
  daemon_logs: z
    .boolean()
    .default(false)
    .describe("Fetch daemon system logs instead of container logs."),
});

/** Label instance — PUT /v0/instances/{id}/ with label */
export const LabelInstanceSchema = z.object({
  id: z.number().int().describe("Instance ID."),
  label: z.string().max(1024).describe("New label for the instance."),
});

/** Change bid price — PUT /v0/instances/bid_price/{id}/ */
export const ChangeBidSchema = ConfirmSchema.extend({
  id: z.number().int().describe("Instance ID."),
  price: z
    .number()
    .min(0.001)
    .max(32)
    .describe("New bid price in $/hr."),
});
