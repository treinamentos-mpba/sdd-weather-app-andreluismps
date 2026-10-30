import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import CityList from '../../src/components/CityList';
import type { City } from '../../src/types/weather';

const saoPaulo: City = {
  id: 1,
  name: 'São Paulo',
  admin1: 'São Paulo',
  country: 'Brasil',
  latitude: -23.5475,
  longitude: -46.63611,
};
const recife: City = {
  id: 2,
  name: 'Recife',
  country: 'Brasil',
  latitude: -8.05,
  longitude: -34.88,
};

describe('CityList', () => {
  it('renders nothing without results', () => {
    const { container } = render(<CityList cities={[]} onSelect={vi.fn()} />);

    expect(container).toBeEmptyDOMElement();
  });

  it('shows name, region and country only when available, marking the selected city', () => {
    render(<CityList cities={[saoPaulo, recife]} selectedId={1} onSelect={vi.fn()} />);

    expect(screen.getByRole('group', { name: 'Cidades encontradas' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'São Paulo, São Paulo, Brasil' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('button', { name: 'Recife, Brasil' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  it('adds coordinates only to results that remain indistinguishable', () => {
    const homonym: City = { ...saoPaulo, id: 3, latitude: 10.5, longitude: 20.25 };
    render(<CityList cities={[saoPaulo, homonym, recife]} onSelect={vi.fn()} />);

    expect(
      screen.getByRole('button', { name: 'São Paulo, São Paulo, Brasil (-23,55, -46,64)' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'São Paulo, São Paulo, Brasil (10,50, 20,25)' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Recife, Brasil' })).toBeInTheDocument();
  });

  it('selects a city by click and by keyboard', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<CityList cities={[saoPaulo, recife]} onSelect={onSelect} />);

    await user.click(screen.getByRole('button', { name: 'Recife, Brasil' }));
    expect(onSelect).toHaveBeenLastCalledWith(recife);

    await user.tab();
    await user.tab();
    expect(screen.getByRole('button', { name: 'Recife, Brasil' })).not.toHaveFocus();
    await user.keyboard('{Enter}');
    expect(onSelect).toHaveBeenLastCalledWith(saoPaulo);
  });

  it('disables selection while a request is in progress', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<CityList cities={[saoPaulo, recife]} disabled onSelect={onSelect} />);

    await user.click(screen.getByRole('button', { name: 'Recife, Brasil' }));

    expect(screen.getByRole('button', { name: 'Recife, Brasil' })).toBeDisabled();
    expect(onSelect).not.toHaveBeenCalled();
  });
});
