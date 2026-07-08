import { useGeneration } from "@/hooks/useGeneration";
import type { CountryGeneration } from "@/types/contract";

export function useAllGeneration(isoCodes: string[]) {
  const results = [
    useGeneration(isoCodes[0] ?? null),
    useGeneration(isoCodes[1] ?? null),
    useGeneration(isoCodes[2] ?? null),
    useGeneration(isoCodes[3] ?? null),
    useGeneration(isoCodes[4] ?? null),
    useGeneration(isoCodes[5] ?? null),
    useGeneration(isoCodes[6] ?? null),
    useGeneration(isoCodes[7] ?? null),
    useGeneration(isoCodes[8] ?? null),
    useGeneration(isoCodes[9] ?? null),
    useGeneration(isoCodes[10] ?? null),
    useGeneration(isoCodes[11] ?? null),
    useGeneration(isoCodes[12] ?? null),
    useGeneration(isoCodes[13] ?? null),
    useGeneration(isoCodes[14] ?? null),
    useGeneration(isoCodes[15] ?? null),
    useGeneration(isoCodes[16] ?? null),
    useGeneration(isoCodes[17] ?? null),
    useGeneration(isoCodes[18] ?? null),
    useGeneration(isoCodes[19] ?? null),
    useGeneration(isoCodes[20] ?? null),
    useGeneration(isoCodes[21] ?? null),
    useGeneration(isoCodes[22] ?? null),
    useGeneration(isoCodes[23] ?? null),
    useGeneration(isoCodes[24] ?? null),
    useGeneration(isoCodes[25] ?? null),
  ];

  const map: Partial<Record<string, CountryGeneration>> = {};

  isoCodes.forEach((iso, index) => {
    const generation = results[index]?.data;

    if (generation) {
      map[iso] = generation;
    }
  });

  const loading = results
    .slice(0, isoCodes.length)
    .some((result) => result.loading);

  return {
    map,
    loading,
  };
}