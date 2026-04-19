import { describe, it, expect } from "vitest";
import { formatInstance, formatInstances } from "../../src/formatters/instance.js";

const RAW_INSTANCE = {
  id: 98765,
  label: "training-run-01",
  cur_state: "running",
  actual_status: "running",
  intended_status: "running",
  gpu_name: "A100_SXM4",
  num_gpus: 4,
  gpu_totalram: 327680, // MB (80GB * 4)
  gpu_util: 95.3,
  gpu_temp: 72.1,
  cpu_name: "AMD EPYC 7763",
  cpu_cores: 32,
  cpu_ram: 128,
  disk_space: 1000,
  disk_usage: 512000, // bytes? KB?
  image_uuid: "pytorch/pytorch:2.2.0-cuda12.1-cudnn8-devel",
  ssh_host: "ssh4.vast.ai",
  ssh_port: 22345,
  dph_total: 3.54,
  is_bid: false,
  geolocation: "US",
  reliability2: 0.993,
  uptime_mins: 2880, // 2 days
  start_date: 1713571200, // epoch
  // Verbose fields that should be stripped
  jupyter_token: "secret-token-123",
  status_msg: "Container is running",
  local_ipaddrs: "10.0.0.5",
  machine_dir_ssh_port: 40022,
  search: {},
  instance: {},
  bw_nvlink: 600,
  pci_gen: 4.0,
  pcie_bw: 15.754,
  mobo_name: "X570",
  host_id: 42,
  machine_id: 99,
};

describe("formatInstance", () => {
  it("extracts essential fields", () => {
    const result = formatInstance(RAW_INSTANCE);

    expect(result.id).toBe(98765);
    expect(result.label).toBe("training-run-01");
    expect(result.status).toBe("running");
    expect(result.actual_status).toBe("running");
    expect(result.gpu).toBe("A100_SXM4");
    expect(result.num_gpus).toBe(4);
    expect(result.gpu_ram_gb).toBe(320);
    expect(result.gpu_util).toBe("95%");
    expect(result.gpu_temp).toBe("72°C");
    expect(result.cpu).toBe("AMD EPYC 7763");
    expect(result.cpu_cores).toBe(32);
    expect(result.ram_gb).toBe(128);
    expect(result.disk_gb).toBe(1000);
    expect(result.image).toBe("pytorch/pytorch:2.2.0-cuda12.1-cudnn8-devel");
    expect(result.ssh_host).toBe("ssh4.vast.ai");
    expect(result.ssh_port).toBe(22345);
    expect(result.price_hr).toBe("$3.5400/hr");
    expect(result.is_bid).toBe(false);
    expect(result.location).toBe("US");
    expect(result.reliability).toBe("99.3%");
    expect(result.uptime).toBe("2.0d");
  });

  it("strips sensitive and verbose fields", () => {
    const result = formatInstance(RAW_INSTANCE) as Record<string, unknown>;
    expect(result.jupyter_token).toBeUndefined();
    expect(result.local_ipaddrs).toBeUndefined();
    expect(result.machine_dir_ssh_port).toBeUndefined();
    expect(result.search).toBeUndefined();
    expect(result.instance).toBeUndefined();
    expect(result.bw_nvlink).toBeUndefined();
    expect(result.pci_gen).toBeUndefined();
    expect(result.mobo_name).toBeUndefined();
    expect(result.host_id).toBeUndefined();
    expect(result.machine_id).toBeUndefined();
  });

  it("handles missing fields gracefully", () => {
    const result = formatInstance({});
    expect(result.label).toBe("");
    expect(result.status).toBe("unknown");
    expect(result.actual_status).toBeNull();
    expect(result.gpu).toBe("unknown");
    expect(result.gpu_util).toBe("n/a");
    expect(result.gpu_temp).toBe("n/a");
    expect(result.disk_used_gb).toBe("n/a");
    expect(result.uptime).toBe("n/a");
    expect(result.start_date).toBe("n/a");
  });

  it("formats short uptime as minutes", () => {
    const result = formatInstance({ ...RAW_INSTANCE, uptime_mins: 45 });
    expect(result.uptime).toBe("45m");
  });

  it("formats medium uptime as hours", () => {
    const result = formatInstance({ ...RAW_INSTANCE, uptime_mins: 180 });
    expect(result.uptime).toBe("3.0h");
  });

  it("falls back to intended_status when cur_state missing", () => {
    const { cur_state: _, ...noCurState } = RAW_INSTANCE;
    const result = formatInstance(noCurState);
    expect(result.status).toBe("running");
  });

  it("uses gpu_ram when gpu_totalram missing", () => {
    const { gpu_totalram: _, ...noTotalRam } = RAW_INSTANCE;
    const result = formatInstance({ ...noTotalRam, gpu_ram: 81920 });
    expect(result.gpu_ram_gb).toBe(80);
  });
});

describe("formatInstances", () => {
  it("maps array of instances", () => {
    const results = formatInstances([RAW_INSTANCE, RAW_INSTANCE]);
    expect(results).toHaveLength(2);
    expect(results[0].id).toBe(98765);
    expect(results[1].label).toBe("training-run-01");
  });
});
