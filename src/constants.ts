/** Vast.ai API base URL */
export const VASTAI_API_BASE = "https://console.vast.ai/api";

/** Default items per page (Vast.ai max is 25 for v1 endpoints) */
export const DEFAULT_PER_PAGE = 25;

/** Default offer search limit */
export const DEFAULT_OFFER_LIMIT = 20;

/** Maximum response characters before truncation */
export const CHARACTER_LIMIT = 4000;

/** Environment variable names */
export const ENV = {
  API_KEY: "VASTAI_API_KEY",
  WRITE_ENABLED: "VASTAI_WRITE_ENABLED",
  MCP_API_TOKEN: "MCP_API_TOKEN",
  TRANSPORT: "TRANSPORT",
  PORT: "PORT",
} as const;

/** Default HTTP port for Hono transport */
export const DEFAULT_PORT = 8783;
