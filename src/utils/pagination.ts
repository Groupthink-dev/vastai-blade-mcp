/**
 * Truncation utilities for token-efficient responses.
 */

import { CHARACTER_LIMIT } from "../constants.js";

/**
 * Truncates a string response to CHARACTER_LIMIT with guidance.
 */
export function truncateIfNeeded(text: string): string {
  if (text.length <= CHARACTER_LIMIT) return text;

  const truncated = text.slice(0, CHARACTER_LIMIT);
  const lastNewline = truncated.lastIndexOf("\n");
  const cleanCut = lastNewline > CHARACTER_LIMIT * 0.8 ? truncated.slice(0, lastNewline) : truncated;

  return (
    cleanCut +
    "\n\n--- TRUNCATED ---\nResponse exceeded token limit. Use limit or filter parameters to narrow results."
  );
}
