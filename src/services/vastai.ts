/**
 * Vast.ai API client — thin fetch wrapper with auth and base URL.
 *
 * API key is read from VASTAI_API_KEY env var. Never logged or included
 * in error messages.
 */

import { VASTAI_API_BASE, ENV } from "../constants.js";

let _apiKey: string | null = null;

function getApiKey(): string {
  if (_apiKey) return _apiKey;
  const key = (process.env[ENV.API_KEY] || "").trim();
  if (!key) {
    throw new Error(
      `${ENV.API_KEY} environment variable is not set. ` +
        "Get your API key at https://cloud.vast.ai/cli/"
    );
  }
  _apiKey = key;
  return _apiKey;
}

/**
 * Validate the API key by hitting GET /v0/users/current/.
 * Throws if the key is invalid or the API is unreachable.
 */
export async function validateApiKey(): Promise<{ email: string; id: number }> {
  const res = await vastaiFetch("/v0/users/current/");
  const data = (await res.json()) as { email: string; id: number };
  return data;
}

/**
 * Fetch wrapper for Vast.ai API.
 * Adds Authorization header, base URL, and content-type.
 * Throws on non-2xx responses with actionable messages.
 */
export async function vastaiFetch(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const url = `${VASTAI_API_BASE}${path}`;
  const headers: Record<string, string> = {
    Authorization: `Bearer ${getApiKey()}`,
    "Content-Type": "application/json",
    Accept: "application/json",
    ...(options.headers as Record<string, string> || {}),
  };

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15_000);

      const res = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!res.ok) {
        const body = await res.text().catch(() => "");
        let message = "";
        try {
          const json = JSON.parse(body);
          message = json.error || json.msg || json.message || body;
        } catch {
          message = body;
        }
        throw new VastaiApiError(res.status, message, path);
      }

      return res;
    } catch (error) {
      if (error instanceof VastaiApiError) throw error;
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt === 0) {
        await new Promise((r) => setTimeout(r, 1_000));
      }
    }
  }

  throw lastError!;
}

/**
 * Typed error for Vast.ai API responses.
 */
export class VastaiApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly detail: string,
    public readonly path: string
  ) {
    super(`Vast.ai API error ${status}: ${detail}`);
    this.name = "VastaiApiError";
  }
}
