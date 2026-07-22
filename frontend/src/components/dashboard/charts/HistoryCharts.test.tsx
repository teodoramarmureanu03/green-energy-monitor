import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { RenewableHistoryChart, TotalEnergyHistoryChart } from './HistoryCharts';
import type { GenerationHistoryPoint, HistoryPeriod } from '@/types/contract';

// Mock pentru ResponsiveContainer pentru a preveni erorile de randare din JSDOM
vi.mock('recharts', async () => {
  const original = await vi.importActual<typeof import('recharts')>('recharts');
  return {
    ...original,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div style={{ width: 800, height: 390 }}>{children}</div>
    ),
  };
});

describe('Componentele din HistoryCharts', () => {
  const mockData: GenerationHistoryPoint[] = [
    {
      date: "2026-01-01",
      label: "Jan",
      windMw: 1200,
      solarMw: 800,
      total: 2000,
      renewableMw: 2000,
      tooltipLabel: "January",
    },
    {
      date: "2026-02-01",
      label: "Feb",
      windMw: 1500,
      solarMw: 900,
      total: 2400,
      renewableMw: 2400,
      tooltipLabel: "February",
    },
  ];
  const mockPeriod: HistoryPeriod = 'year';

  describe('RenewableHistoryChart', () => {
    it('randează titlul cardului "Solar and wind production history"', () => {
      render(<RenewableHistoryChart data={mockData} period={mockPeriod} />);

      expect(screen.getByText('Solar and wind production history')).toBeInTheDocument();
    });

    it('se randează fără erori când lista de date este goală', () => {
      render(<RenewableHistoryChart data={[]} period={mockPeriod} />);

      expect(screen.getByText('Solar and wind production history')).toBeInTheDocument();
    });
  });

  describe('TotalEnergyHistoryChart', () => {
    it('randează titlul cardului "Total energy production history"', () => {
      render(<TotalEnergyHistoryChart data={mockData} period={mockPeriod} />);

      expect(screen.getByText('Total energy production history')).toBeInTheDocument();
    });

    it('se randează fără erori când lista de date este goală', () => {
      render(<TotalEnergyHistoryChart data={[]} period={mockPeriod} />);

      expect(screen.getByText('Total energy production history')).toBeInTheDocument();
    });
  });
});