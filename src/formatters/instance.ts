/**
 * Token-efficient formatter for Vast.ai instances.
 * Strips verbose fields while keeping identity, GPU spec, status, connectivity, and pricing.
 */

interface InstanceSummary {
  id: number;
  label: string;
  status: string;
  actual_status: string | null;
  gpu: string;
  num_gpus: number;
  gpu_ram_gb: number;
  gpu_util: string;
  gpu_temp: string;
  cpu: string;
  cpu_cores: number;
  ram_gb: number;
  disk_gb: number;
  disk_used_gb: string;
  image: string;
  ssh_host: string;
  ssh_port: number;
  price_hr: string;
  is_bid: boolean;
  location: string;
  reliability: string;
  uptime: string;
  start_date: string;
}

export function formatInstance(raw: Record<string, unknown>): InstanceSummary {
  return {
    id: raw.id as number,
    label: (raw.label as string) || "",
    status: (raw.cur_state as string) || (raw.intended_status as string) || "unknown",
    actual_status: (raw.actual_status as string) || null,
    gpu: (raw.gpu_name as string) || "unknown",
    num_gpus: (raw.num_gpus as number) || 1,
    gpu_ram_gb: Math.round(((raw.gpu_totalram as number) || (raw.gpu_ram as number) || 0) / 1024),
    gpu_util: (raw.gpu_util as number) != null ? `${Math.round(raw.gpu_util as number)}%` : "n/a",
    gpu_temp: (raw.gpu_temp as number) != null ? `${Math.round(raw.gpu_temp as number)}°C` : "n/a",
    cpu: (raw.cpu_name as string) || "unknown",
    cpu_cores: (raw.cpu_cores as number) || 0,
    ram_gb: Math.round((raw.cpu_ram as number) || 0),
    disk_gb: Math.round((raw.disk_space as number) || 0),
    disk_used_gb: (raw.disk_usage as number) != null
      ? `${((raw.disk_usage as number) / 1024).toFixed(1)}`
      : "n/a",
    image: (raw.image_uuid as string) || "unknown",
    ssh_host: (raw.ssh_host as string) || "",
    ssh_port: (raw.ssh_port as number) || 0,
    price_hr: `$${((raw.dph_total as number) || 0).toFixed(4)}/hr`,
    is_bid: (raw.is_bid as boolean) || false,
    location: (raw.geolocation as string) || "unknown",
    reliability: `${(((raw.reliability2 as number) || 0) * 100).toFixed(1)}%`,
    uptime: formatUptime(raw.uptime_mins as number),
    start_date: formatEpoch(raw.start_date as number),
  };
}

export function formatInstances(raw: Record<string, unknown>[]): InstanceSummary[] {
  return raw.map(formatInstance);
}

function formatUptime(minutes: number | undefined | null): string {
  if (!minutes) return "n/a";
  if (minutes < 60) return `${Math.round(minutes)}m`;
  if (minutes < 1440) return `${(minutes / 60).toFixed(1)}h`;
  return `${(minutes / 1440).toFixed(1)}d`;
}

function formatEpoch(epoch: number | undefined | null): string {
  if (!epoch) return "n/a";
  return new Date(epoch * 1000).toISOString().slice(0, 19) + "Z";
}
