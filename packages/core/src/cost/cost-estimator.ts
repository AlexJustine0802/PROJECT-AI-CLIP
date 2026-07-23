/**
 * Pure cost estimation (#18). Combines storage, bandwidth, CPU, GPU and inference cost into a
 * single breakdown. Rates are configurable so ops can tune them without code changes.
 */
import type { CostBreakdown } from '@clipforge/types';

export interface CostRates {
  storageUsdPerGbMonth: number;
  bandwidthUsdPerGb: number;
  cpuUsdPerHour: number;
  gpuUsdPerHour: number;
}

export const DEFAULT_COST_RATES: CostRates = {
  storageUsdPerGbMonth: 0.015, // R2-ish
  bandwidthUsdPerGb: 0.01,
  cpuUsdPerHour: 0.04,
  gpuUsdPerHour: 0.6,
};

export interface CostInputs {
  storageBytes?: number;
  bandwidthBytes?: number;
  cpuSeconds?: number;
  gpuSeconds?: number;
  inferenceUsd?: number;
}

const GB = 1024 ** 3;

export function estimateCost(inputs: CostInputs, rates: CostRates = DEFAULT_COST_RATES): CostBreakdown {
  const storageUsd = ((inputs.storageBytes ?? 0) / GB) * rates.storageUsdPerGbMonth;
  const bandwidthUsd = ((inputs.bandwidthBytes ?? 0) / GB) * rates.bandwidthUsdPerGb;
  const cpuUsd = ((inputs.cpuSeconds ?? 0) / 3600) * rates.cpuUsdPerHour;
  const gpuUsd = ((inputs.gpuSeconds ?? 0) / 3600) * rates.gpuUsdPerHour;
  const inferenceUsd = inputs.inferenceUsd ?? 0;
  const round = (n: number) => Math.round(n * 1e6) / 1e6;
  return {
    storageUsd: round(storageUsd),
    bandwidthUsd: round(bandwidthUsd),
    cpuUsd: round(cpuUsd),
    gpuUsd: round(gpuUsd),
    inferenceUsd: round(inferenceUsd),
    totalUsd: round(storageUsd + bandwidthUsd + cpuUsd + gpuUsd + inferenceUsd),
  };
}

/** Convert an estimated USD cost into billable credits (1 credit ≈ $0.02). */
export function usdToCredits(usd: number, usdPerCredit = 0.02): number {
  return Math.max(1, Math.ceil(usd / usdPerCredit));
}
