import { describe, it, expect } from "vitest";
import {
  formatAccount,
  formatSshKey,
  formatSshKeys,
  formatInvoice,
  formatInvoices,
} from "../../src/formatters/account.js";

const RAW_USER = {
  id: 42,
  email: "user@example.com",
  balance: 125.789,
  ssh_key: "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAAB... user@laptop",
  key_id: 99,
  sid: "abc123",
};

describe("formatAccount", () => {
  it("extracts essential fields", () => {
    const result = formatAccount(RAW_USER);
    expect(result.id).toBe(42);
    expect(result.email).toBe("user@example.com");
    expect(result.balance).toBe("$125.79");
    expect(result.has_ssh_key).toBe(true);
  });

  it("strips verbose fields", () => {
    const result = formatAccount(RAW_USER) as Record<string, unknown>;
    expect(result.key_id).toBeUndefined();
    expect(result.sid).toBeUndefined();
    expect(result.ssh_key).toBeUndefined();
  });

  it("handles no SSH key", () => {
    const result = formatAccount({ ...RAW_USER, ssh_key: "" });
    expect(result.has_ssh_key).toBe(false);
  });

  it("handles missing fields gracefully", () => {
    const result = formatAccount({});
    expect(result.email).toBe("");
    expect(result.balance).toBe("$0.00");
    expect(result.has_ssh_key).toBe(false);
  });
});

const RAW_SSH_KEY = {
  id: 1,
  user_id: 42,
  key: "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQCwhatever user@laptop",
  created_at: "2026-03-15T10:00:00Z",
  deleted_at: null,
};

describe("formatSshKey", () => {
  it("truncates key content for token efficiency", () => {
    const result = formatSshKey(RAW_SSH_KEY);
    expect(result.id).toBe(1);
    expect(result.key_preview).toContain("ssh-rsa");
    expect(result.key_preview).toContain("...");
    expect(result.key_preview.length).toBeLessThan(RAW_SSH_KEY.key.length);
    expect(result.created_at).toBe("2026-03-15T10:00:00Z");
  });

  it("includes comment in preview if present", () => {
    const result = formatSshKey(RAW_SSH_KEY);
    expect(result.key_preview).toContain("user@laptop");
  });

  it("strips verbose fields", () => {
    const result = formatSshKey(RAW_SSH_KEY) as Record<string, unknown>;
    expect(result.user_id).toBeUndefined();
    expect(result.deleted_at).toBeUndefined();
  });

  it("uses public_key field as fallback", () => {
    const result = formatSshKey({ id: 2, public_key: "ssh-ed25519 AAAAC3NzaC test@host" });
    expect(result.key_preview).toContain("ssh-ed25519");
  });
});

describe("formatSshKeys", () => {
  it("maps array of keys", () => {
    const results = formatSshKeys([RAW_SSH_KEY, RAW_SSH_KEY]);
    expect(results).toHaveLength(2);
  });
});

const RAW_INVOICE = {
  start: 1713571200,
  end: 1713571500,
  type: "credit",
  source: "stripe",
  description: "Payment received",
  amount: 50.0,
  metadata: { invoice_id: "inv_123", service: "stripe_payments" },
  items: [],
};

describe("formatInvoice", () => {
  it("extracts essential fields", () => {
    const result = formatInvoice(RAW_INVOICE);
    expect(result.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(result.type).toBe("credit");
    expect(result.source).toBe("stripe");
    expect(result.amount).toBe("+$50.00");
    expect(result.description).toBe("Payment received");
  });

  it("formats negative amounts as charges", () => {
    const result = formatInvoice({ ...RAW_INVOICE, amount: -12.34 });
    expect(result.amount).toBe("-$12.34");
  });

  it("strips verbose fields", () => {
    const result = formatInvoice(RAW_INVOICE) as Record<string, unknown>;
    expect(result.metadata).toBeUndefined();
    expect(result.items).toBeUndefined();
    expect(result.end).toBeUndefined();
    expect(result.start).toBeUndefined();
  });

  it("handles missing fields gracefully", () => {
    const result = formatInvoice({});
    expect(result.date).toBe("n/a");
    expect(result.type).toBe("unknown");
    expect(result.source).toBe("unknown");
    expect(result.amount).toBe("+$0.00");
  });
});

describe("formatInvoices", () => {
  it("maps array of invoices", () => {
    const results = formatInvoices([RAW_INVOICE, RAW_INVOICE]);
    expect(results).toHaveLength(2);
  });
});
