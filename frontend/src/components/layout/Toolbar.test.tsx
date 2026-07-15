import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Toolbar } from './Toolbar';

// "Păcălim" hook-ul useTheme pentru a-i controla starea în teste
const mockToggleTheme = vi.fn();
vi.mock('@/hooks/useTheme', () => ({
  useTheme: () => ({
    theme: 'light',
    toggleTheme: mockToggleTheme,
  }),
}));

describe('Toolbar Component', () => {
  it('renders the title and subtitle correctly', () => {
    render(<Toolbar title="Dashboard" subtitle="Overview of your system" />);

    // Verificăm dacă titlul și subtitlul sunt afișate pe ecran
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Overview of your system')).toBeInTheDocument();
  });

  it('renders only the title if subtitle is not provided', () => {
    render(<Toolbar title="Settings" />);

    expect(screen.getByText('Settings')).toBeInTheDocument();
    // Subtitlul nu ar trebui să existe pe ecran
    const subtitleElement = screen.queryByText('Overview of your system');
    expect(subtitleElement).not.toBeInTheDocument();
  });

  it('triggers the theme toggle function when clicked', () => {
    render(<Toolbar title="Theme Test" />);

    // Găsim butonul după textul lui din aria-label/title (pe tema 'light' ar trebui să ceară 'Switch to dark mode')
    const themeButton = screen.getByTitle('Switch to dark mode');
    expect(themeButton).toBeInTheDocument();

    // Simulăm click-ul utilizatorului
    fireEvent.click(themeButton);

    // Verificăm dacă funcția toggleTheme din hook-ul nostru a fost apelată
    expect(mockToggleTheme).toHaveBeenCalledTimes(1);
  });
});