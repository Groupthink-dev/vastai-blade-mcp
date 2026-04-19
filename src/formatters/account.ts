/**
 * Token-efficient formatters for Vast.ai account, SSH keys, and billing.
 */

interface AccountSummary {
  id: number;
  email: string;
  balance: string;
  has_ssh_key: boolean;
}

interface SshKeySummary {
  id: number;
  key_preview: string;
  created_at: string;
}

interface InvoiceSummary {
  date: string;
  type: string;
  source: string;
  amount: string;
  description: string;
}

export function formatAccount(raw: Record<string, unknown>): AccountSummary {
  return {
    id: raw.id as number,
    email: (raw.email as string) || "",
    balance: `$${((raw.balance as number) || 0).toFixed(2)}`,
    has_ssh_key: !!(raw.ssh_key as string),
  };
}

export function formatSshKey(raw: Record<string, unknown>): SshKeySummary {
  const key = (raw.key as string) || (raw.public_key as string) || "";
  const parts = key.split(" ");
  const preview =
    parts.length >= 2
      ? `${parts[0]} ${parts[1].slice(0, 20)}...${parts.length > 2 ? ` ${parts[2]}` : ""}`
      : key.slice(0, 40) + "...";

  return {
    id: raw.id as number,
    key_preview: preview,
    created_at: (raw.created_at as string) || "unknown",
  };
}

export function formatSshKeys(raw: Record<string, unknown>[]): SshKeySummary[] {
  return raw.map(formatSshKey);
}

export function formatInvoice(raw: Record<string, unknown>): InvoiceSummary {
  const amount = (raw.amount as number) || 0;
  return {
    date: formatEpoch(raw.start as number),
    type: (raw.type as string) || "unknown",
    source: (raw.source as string) || "unknown",
    amount: amount >= 0 ? `+$${amount.toFixed(2)}` : `-$${Math.abs(amount).toFixed(2)}`,
    description: (raw.description as string) || "",
  };
}

export function formatInvoices(raw: Record<string, unknown>[]): InvoiceSummary[] {
  return raw.map(formatInvoice);
}

function formatEpoch(epoch: number | undefined | null): string {
  if (!epoch) return "n/a";
  return new Date(epoch * 1000).toISOString().slice(0, 10);
}
