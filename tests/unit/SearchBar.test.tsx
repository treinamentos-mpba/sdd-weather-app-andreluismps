import { fireEvent, render, screen } from '@testing-library/react';
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

  it.each([
    ['tabs and spaces', ' \t  \t '],
    ['non-breaking spaces', '\u00a0\u00a0'],
    ['an ideographic space', '\u3000'],
  ])('treats %s as blank: no search, message shown and cleared on typing', async (_label, blank) => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    render(<SearchBar onSearch={onSearch} />);
    const input = screen.getByLabelText('Cidade');

    fireEvent.change(input, { target: { value: blank } });
    await user.click(screen.getByRole('button', { name: 'Buscar' }));

    expect(onSearch).not.toHaveBeenCalled();
    expect(screen.getByRole('status')).toHaveTextContent(
      'Informe o nome de uma cidade para iniciar a busca',
    );
    expect(input).toHaveFocus();

    await user.type(input, 'S');

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(input).not.toHaveAttribute('aria-invalid');
  });

  it('blocks an empty submission made with the Enter key', async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    render(<SearchBar onSearch={onSearch} />);

    await user.type(screen.getByLabelText('Cidade'), '   {Enter}');

    expect(onSearch).not.toHaveBeenCalled();
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it.each([
    'São Paulo',
    'Aix-en-Provence',
    'Zürich',
    'Saint-Étienne',
    "O'Fallon",
    'a&apikey=1',
    '100% #1 ?x=1',
    '<b>negrito</b>',
  ])('submits "%s" unchanged, without escaping or normalizing it', async (name) => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    render(<SearchBar onSearch={onSearch} />);

    fireEvent.change(screen.getByLabelText('Cidade'), { target: { value: `  ${name}  ` } });
    await user.click(screen.getByRole('button', { name: 'Buscar' }));

    expect(onSearch).toHaveBeenCalledExactlyOnceWith(name);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('blocks submission without removing the controls from the keyboard flow while busy', async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    const { rerender } = render(<SearchBar onSearch={onSearch} />);
    const input = screen.getByRole('searchbox', { name: 'Cidade' });
    await user.type(input, 'Recife');
    input.focus();

    rerender(<SearchBar onSearch={onSearch} disabled />);

    expect(input).toHaveFocus();
    expect(input).not.toBeDisabled();
    expect(input).toHaveAttribute('readonly');
    expect(screen.getByRole('button', { name: 'Buscar' })).not.toBeDisabled();
    expect(screen.getByRole('button', { name: 'Buscar' })).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByRole('search', { name: 'Buscar cidades' })).toHaveAttribute(
      'aria-busy',
      'true',
    );

    await user.keyboard('{Enter}');
    await user.click(screen.getByRole('button', { name: 'Buscar' }));
    await user.type(input, 'xyz');

    expect(onSearch).not.toHaveBeenCalled();
    expect(input).toHaveValue('Recife');
    expect(input).toHaveFocus();
  });

  it('searches again once the busy state ends', async () => {
    const user = userEvent.setup();
    const onSearch = vi.fn();
    const { rerender } = render(<SearchBar onSearch={onSearch} disabled />);
    rerender(<SearchBar onSearch={onSearch} />);

    await user.type(screen.getByRole('searchbox', { name: 'Cidade' }), 'Recife{Enter}');

    expect(onSearch).toHaveBeenCalledExactlyOnceWith('Recife');
  });
});
