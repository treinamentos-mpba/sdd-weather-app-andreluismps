import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import CurrentWeather from '../../src/components/CurrentWeather';
import UnitToggle from '../../src/components/UnitToggle';
import { mockWeatherData } from '../../src/mocks/weatherData';
import type { Unit } from '../../src/types/weather';

function TemperaturePreview() {
  const [unit, setUnit] = useState<Unit>('celsius');

  return (
    <>
      <UnitToggle unit={unit} onChange={setUnit} />
      <CurrentWeather
        city={mockWeatherData.city}
        current={{ ...mockWeatherData.current, temperatureC: 0 }}
        unit={unit}
      />
    </>
  );
}

describe('UnitToggle', () => {
  it('exposes a named group with two buttons and the active unit pressed', () => {
    render(<UnitToggle unit="celsius" onChange={vi.fn()} />);

    expect(screen.getByRole('group', { name: 'Unidade de temperatura' })).toBeInTheDocument();
    expect(screen.getAllByRole('button')).toHaveLength(2);
    expect(screen.getByRole('button', { name: 'Celsius' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Fahrenheit' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  it('calls onChange with the selected unit', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<UnitToggle unit="celsius" onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: 'Fahrenheit' }));

    expect(onChange).toHaveBeenCalledOnce();
    expect(onChange).toHaveBeenCalledWith('fahrenheit');
  });

  it('supports Tab, Space, and Enter keyboard interaction', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<UnitToggle unit="celsius" onChange={onChange} />);
    const celsiusButton = screen.getByRole('button', { name: 'Celsius' });
    const fahrenheitButton = screen.getByRole('button', { name: 'Fahrenheit' });

    await user.tab();
    expect(celsiusButton).toHaveFocus();
    await user.keyboard(' ');
    expect(onChange).toHaveBeenNthCalledWith(1, 'celsius');

    await user.tab();
    expect(fahrenheitButton).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(onChange).toHaveBeenNthCalledWith(2, 'fahrenheit');
  });

  it('updates CurrentWeather from zero Celsius to 32 Fahrenheit and back on user clicks', async () => {
    const user = userEvent.setup();
    render(<TemperaturePreview />);
    const weatherRegion = screen.getByRole('region', { name: mockWeatherData.city.name });
    const celsiusButton = screen.getByRole('button', { name: 'Celsius' });
    const fahrenheitButton = screen.getByRole('button', { name: 'Fahrenheit' });

    expect(weatherRegion).toHaveTextContent('0 °C');
    expect(celsiusButton).toHaveAttribute('aria-pressed', 'true');

    await user.click(fahrenheitButton);

    expect(weatherRegion).toHaveTextContent('32 °F');
    expect(weatherRegion).not.toHaveTextContent('0 °C');
    expect(fahrenheitButton).toHaveAttribute('aria-pressed', 'true');
    expect(celsiusButton).toHaveAttribute('aria-pressed', 'false');

    await user.click(celsiusButton);

    expect(weatherRegion).toHaveTextContent('0 °C');
    expect(weatherRegion).not.toHaveTextContent('32 °F');
    expect(celsiusButton).toHaveAttribute('aria-pressed', 'true');
    expect(fahrenheitButton).toHaveAttribute('aria-pressed', 'false');
  });
});
