/**
 * Token-efficient formatter for Vast.ai offers.
 * Strips ~60% of raw API response while keeping GPU spec, pricing, and location.
 */

interface OfferSummary {
  id: number;
  gpu: string;
  num_gpus: number;
  gpu_ram_gb: number;
  total_vram_gb: number;
  cpu: string;
  cpu_cores: number;
  ram_gb: number;
  disk_gb: number;
  price_hr: string;
  min_bid: string;
  type: string;
  reliability: string;
  location: string;
  cuda: string;
  inet_down: number;
  inet_up: number;
  dlperf: string;
  duration: string;
  rentable: boolean;
}

interface TemplateSummary {
  id: number;
  name: string;
  image: string;
  hash_id?: string;
  recommended?: boolean;
}

export function formatOffer(raw: Record<string, unknown>): OfferSummary {
  return {
    id: raw.id as number,
    gpu: (raw.gpu_name as string) || "unknown",
    num_gpus: (raw.num_gpus as number) || 1,
    gpu_ram_gb: Math.round(((raw.gpu_ram as number) || 0) / 1024),
    total_vram_gb: Math.round(((raw.gpu_total_ram as number) || 0) / 1024),
    cpu: (raw.cpu_name as string) || "unknown",
    cpu_cores: (raw.cpu_cores as number) || 0,
    ram_gb: Math.round((raw.cpu_ram as number) || 0),
    disk_gb: Math.round((raw.disk_space as number) || 0),
    price_hr: `$${((raw.dph_total as number) || 0).toFixed(4)}/hr`,
    min_bid: `$${((raw.min_bid as number) || 0).toFixed(4)}/hr`,
    type: (raw.is_bid as boolean) ? "bid" : "ondemand",
    reliability: `${(((raw.reliability as number) || (raw.reliability2 as number) || 0) * 100).toFixed(1)}%`,
    location: (raw.geolocation as string) || "unknown",
    cuda: String((raw.cuda_max_good as number) || "unknown"),
    inet_down: Math.round((raw.inet_down as number) || 0),
    inet_up: Math.round((raw.inet_up as number) || 0),
    dlperf: (raw.dlperf as number) != null ? ((raw.dlperf as number).toFixed(1)) : "n/a",
    duration: formatDuration(raw.duration as number),
    rentable: (raw.rentable as boolean) ?? true,
  };
}

export function formatOffers(raw: Record<string, unknown>[]): OfferSummary[] {
  return raw.map(formatOffer);
}

export function formatTemplate(raw: Record<string, unknown>): TemplateSummary {
  return {
    id: raw.id as number,
    name: (raw.name as string) || "unnamed",
    image: (raw.image as string) || "unknown",
    ...(raw.hash_id ? { hash_id: raw.hash_id as string } : {}),
    ...(raw.recommended != null ? { recommended: raw.recommended as boolean } : {}),
  };
}

export function formatTemplates(raw: Record<string, unknown>[]): TemplateSummary[] {
  return raw.map(formatTemplate);
}

function formatDuration(seconds: number | undefined | null): string {
  if (!seconds) return "n/a";
  const days = Math.floor(seconds / 86400);
  if (days > 0) return `${days}d`;
  const hours = Math.floor(seconds / 3600);
  return `${hours}h`;
}
