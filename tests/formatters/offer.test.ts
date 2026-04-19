import { describe, it, expect } from "vitest";
import { formatOffer, formatOffers, formatTemplate, formatTemplates } from "../../src/formatters/offer.js";

const RAW_OFFER = {
  id: 12345,
  gpu_name: "RTX_4090",
  num_gpus: 2,
  gpu_ram: 24576, // MB
  gpu_total_ram: 49152, // MB
  cpu_name: "AMD EPYC 7542",
  cpu_cores: 16,
  cpu_ram: 64,
  disk_space: 500,
  dph_total: 0.752,
  min_bid: 0.35,
  is_bid: false,
  reliability: 0.987,
  geolocation: "US",
  cuda_max_good: 12.4,
  inet_down: 850.5,
  inet_up: 420.3,
  dlperf: 42.7,
  duration: 172800,
  rentable: true,
  // Verbose fields that should be stripped
  gpu_display_active: false,
  gpu_lanes: 16,
  gpu_mem_bw: 1008,
  pci_gen: 4.0,
  pcie_bw: 15.754,
  mobo_name: "X570",
  logo: "https://example.com/logo.png",
  hostname: "host-1234",
  host_id: 9999,
  machine_id: 8888,
  bundle_id: 7777,
  ask_contract_id: 6666,
};

describe("formatOffer", () => {
  it("extracts essential fields", () => {
    const result = formatOffer(RAW_OFFER);

    expect(result.id).toBe(12345);
    expect(result.gpu).toBe("RTX_4090");
    expect(result.num_gpus).toBe(2);
    expect(result.gpu_ram_gb).toBe(24);
    expect(result.total_vram_gb).toBe(48);
    expect(result.cpu).toBe("AMD EPYC 7542");
    expect(result.cpu_cores).toBe(16);
    expect(result.ram_gb).toBe(64);
    expect(result.disk_gb).toBe(500);
    expect(result.price_hr).toBe("$0.7520/hr");
    expect(result.min_bid).toBe("$0.3500/hr");
    expect(result.type).toBe("ondemand");
    expect(result.reliability).toBe("98.7%");
    expect(result.location).toBe("US");
    expect(result.cuda).toBe("12.4");
    expect(result.inet_down).toBe(851);
    expect(result.inet_up).toBe(420);
    expect(result.dlperf).toBe("42.7");
    expect(result.duration).toBe("2d");
    expect(result.rentable).toBe(true);
  });

  it("marks bid offers correctly", () => {
    const result = formatOffer({ ...RAW_OFFER, is_bid: true });
    expect(result.type).toBe("bid");
  });

  it("strips verbose fields", () => {
    const result = formatOffer(RAW_OFFER) as Record<string, unknown>;
    expect(result.gpu_display_active).toBeUndefined();
    expect(result.gpu_lanes).toBeUndefined();
    expect(result.pci_gen).toBeUndefined();
    expect(result.mobo_name).toBeUndefined();
    expect(result.logo).toBeUndefined();
    expect(result.hostname).toBeUndefined();
    expect(result.host_id).toBeUndefined();
    expect(result.machine_id).toBeUndefined();
    expect(result.bundle_id).toBeUndefined();
    expect(result.ask_contract_id).toBeUndefined();
  });

  it("handles missing fields gracefully", () => {
    const result = formatOffer({});
    expect(result.id).toBeUndefined();
    expect(result.gpu).toBe("unknown");
    expect(result.num_gpus).toBe(1);
    expect(result.gpu_ram_gb).toBe(0);
    expect(result.price_hr).toBe("$0.0000/hr");
    expect(result.location).toBe("unknown");
    expect(result.dlperf).toBe("n/a");
    expect(result.duration).toBe("n/a");
  });

  it("formats sub-day durations as hours", () => {
    const result = formatOffer({ ...RAW_OFFER, duration: 7200 });
    expect(result.duration).toBe("2h");
  });

  it("uses reliability2 as fallback", () => {
    const { reliability: _, ...noReliability } = RAW_OFFER;
    const result = formatOffer({ ...noReliability, reliability2: 0.95 });
    expect(result.reliability).toBe("95.0%");
  });
});

describe("formatOffers", () => {
  it("maps array of offers", () => {
    const results = formatOffers([RAW_OFFER, RAW_OFFER]);
    expect(results).toHaveLength(2);
    expect(results[0].id).toBe(12345);
    expect(results[1].gpu).toBe("RTX_4090");
  });
});

const RAW_TEMPLATE = {
  id: 100,
  name: "PyTorch 2.2",
  image: "vastai/pytorch:2.2",
  hash_id: "abc123",
  recommended: true,
  creator_id: 42,
  created_at: "2026-01-15T12:00:00Z",
  count_created: 500,
};

describe("formatTemplate", () => {
  it("extracts essential fields", () => {
    const result = formatTemplate(RAW_TEMPLATE);
    expect(result.id).toBe(100);
    expect(result.name).toBe("PyTorch 2.2");
    expect(result.image).toBe("vastai/pytorch:2.2");
    expect(result.hash_id).toBe("abc123");
    expect(result.recommended).toBe(true);
  });

  it("strips verbose fields", () => {
    const result = formatTemplate(RAW_TEMPLATE) as Record<string, unknown>;
    expect(result.creator_id).toBeUndefined();
    expect(result.created_at).toBeUndefined();
    expect(result.count_created).toBeUndefined();
  });

  it("handles missing fields gracefully", () => {
    const result = formatTemplate({});
    expect(result.name).toBe("unnamed");
    expect(result.image).toBe("unknown");
    expect(result.hash_id).toBeUndefined();
    expect(result.recommended).toBeUndefined();
  });
});

describe("formatTemplates", () => {
  it("maps array of templates", () => {
    const results = formatTemplates([RAW_TEMPLATE, RAW_TEMPLATE]);
    expect(results).toHaveLength(2);
  });
});
