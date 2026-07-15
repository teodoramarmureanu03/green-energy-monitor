import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { EuropeMap } from './EuropeMap';
import * as api from '@/lib/api';

// Simulăm hook-ul useCountries
vi.mock('@/hooks/useCountries', () => ({
  useCountries: () => ({
    countries: [
      { isoCode: 'RO', name: 'Romania', lat: 46, lng: 25 },
      { isoCode: 'DE', name: 'Germany', lat: 51, lng: 9 }
    ]
  })
}));

// Simulăm fișierul de asset-uri pentru a nu încărca un JSON uriaș în teste
vi.mock('@/assets/europe.json', () => ({
  default: {
    type: "FeatureCollection",
    geographies: []
  }
}));

describe('EuropeMap Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the accessible country navigation buttons', async () => {
    // Simulăm răspunsul API-ului pentru cele două țări
    const spyFetch = vi.spyOn(api, 'fetchGeneration');
    spyFetch.mockImplementation(async (iso) => {
      if (iso === 'RO') return { isoCode: 'RO', country: 'Romania', renewablePct: 45 } as any;
      return { isoCode: 'DE', country: 'Germany', renewablePct: 30 } as any;
    });

    render(<EuropeMap onSelectCountry={vi.fn()} />);

    // Verificăm dacă butoanele accesibile s-au randat
    await waitFor(() => {
      expect(screen.getByText(/Romania/i)).toBeInTheDocument();
      expect(screen.getByText(/Germany/i)).toBeInTheDocument();
    });
  });

  it('calls onSelectCountry when a country button is clicked', async () => {
    const handleSelect = vi.fn();
    vi.spyOn(api, 'fetchGeneration').mockResolvedValue({ renewablePct: 50 } as any);

    render(<EuropeMap onSelectCountry={handleSelect} />);

    // Găsim butonul accesibil pentru o țară și facem click pe el
    const button = await screen.findByRole('button', { name: /Romania/i });
    fireEvent.click(button);

    expect(handleSelect).toHaveBeenCalledWith('RO');
  });
});