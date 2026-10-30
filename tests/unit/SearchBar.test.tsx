import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import SearchBar from '../../src/components/SearchBar';

describe('SearchBar', () => {
  it('exposes an accessible search form and labeled input', () => {
    render(<SearchBar onSearch={vi.fn()} />);

    expect(screen.getByRole('search', { name: 'Buscar cidades' })).toBeInTheDocument();
    expect(screen.getByRole('searchbox', { name: 'Cidade' })).toBeInTheDocument();
  });

  it('trims the query before calling onSearch', async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    render(<SearchBar onSearch={onSearch} />);

    await user.type(screen.getByRole('searchbox', { name: 'Cidade' }), '  São Paulo  ');
    await user.click(screen.getByRole('button', { name: 'Buscar' }));

    expect(onSearch).toHaveBeenCalledOnce();
    expect(onSearch).toHaveBeenCalledWith('São Paulo');
  });

  it.each(['', '   '])('does not call onSearch for an empty query %j', async (query) => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    render(<SearchBar onSearch={onSearch} />);

    const input = screen.getByLabelText('Cidade');
    if (query) await user.type(input, query);
    await user.click(screen.getByRole('button', { name: 'Buscar' }));

    expect(onSearch).not.toHaveBeenCalled();
    expect(input).toHaveFocus();
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription('Informe o nome de uma cidade para iniciar a busca');
    expect(screen.getByRole('status')).toHaveTextContent(
      'Informe o nome de uma cidade para iniciar a busca',
    );
  });

  it('does not search while the user is typing before submitting', async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    render(<SearchBar onSearch={onSearch} />);

    await user.type(screen.getByLabelText('Cidade'), 'São Paulo');

    expect(onSearch).not.toHaveBeenCalled();
    await user.keyboard('{Enter}');
    expect(onSearch).toHaveBeenCalledExactlyOnceWith('São Paulo');
  });

  it('preserves special characters in the submitted city name', async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    render(<SearchBar onSearch={onSearch} />);

    await user.type(screen.getByRole('searchbox', { name: 'Cidade' }), "  L'Haÿ-les-Roses  ");
    await user.click(screen.getByRole('button', { name: 'Buscar' }));

    expect(onSearch).toHaveBeenCalledWith("L'Haÿ-les-Roses");
  });

  it('disables the input and prevents submission while disabled', async () => {
    const onSearch = vi.fn();
    render(<SearchBar onSearch={onSearch} disabled />);

    expect(screen.getByRole('searchbox', { name: 'Cidade' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Buscar' })).toBeDisabled();
    expect(screen.getByRole('search', { name: 'Buscar cidades' })).toHaveAttribute(
      'aria-busy',
      'true',
    );
    expect(onSearch).not.toHaveBeenCalled();
  });
});
