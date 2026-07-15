import { vi } from 'vitest';
import * as api from './lib/api';
import type { CountryGeneration } from './types/contract';

// Această funcție va "simula" răspunsul de la server în timpul testelor
export function mockGeneration(data: Partial<CountryGeneration>) {
  vi.spyOn(api, 'fetchGeneration').mockResolvedValue({
    isoCode: 'DE',
    country: 'Germany',
    sources: [],
    totalMw: 0,
    renewablePercent: 0,
    ...data,
  } as CountryGeneration);
}