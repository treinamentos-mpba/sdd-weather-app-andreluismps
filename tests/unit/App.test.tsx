import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import App from '../../src/App';

describe('App', () => {
  it('renders the shell, mock weather and forecast in the selected temperature unit', async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: 'Clima Agora' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('Aguardando busca');

    await user.type(screen.getByRole('searchbox'), 'São Paulo');
    await user.click(screen.getByRole('button', { name: 'Buscar' }));

    expect(await screen.findByRole('heading', { name: 'Sao Paulo' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: 'Clima Agora' })).toBeInTheDocument();
    expect(screen.getByText('22 °C')).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(5);

    await user.click(screen.getByRole('button', { name: 'Fahrenheit' }));

    expect(screen.getByText('72 °F')).toBeInTheDocument();
    expect(screen.getAllByText('63 °F')).toHaveLength(2);
    expect(screen.getByText('77 °F')).toBeInTheDocument();
  });

  it('shows an empty state when the search does not match the available mock city', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.type(screen.getByRole('searchbox'), 'Recife');
    await user.click(screen.getByRole('button', { name: 'Buscar' }));

    expect(
      await screen.findByRole('heading', { name: 'Nenhuma cidade encontrada' }),
    ).toBeInTheDocument();
  });
});
