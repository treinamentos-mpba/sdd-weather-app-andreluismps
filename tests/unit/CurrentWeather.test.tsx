import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import CurrentWeather from '../../src/components/CurrentWeather';
import { mockWeatherData } from '../../src/mocks/weatherData';
import type { CurrentWeather as CurrentWeatherData } from '../../src/types/weather';

const completeCurrent: CurrentWeatherData = {
  temperatureC: 22,
  weatherCode: 2,
  relativeHumidityPercent: 68,
  windSpeedKmh: 12.3,
  precipitationMm: 0.1,
  surfacePressureHpa: 1015.2,
  referenceTime: '2026-10-29T10:00',
};

describe('CurrentWeather', () => {
  it('renders current conditions, reference time, and all metric values', () => {
    render(<CurrentWeather city={mockWeatherData.city} current={completeCurrent} unit="celsius" />);

    expect(screen.getByRole('region', { name: /Sao Paulo/ })).toBeInTheDocument();
    expect(screen.getByText('22 °C')).toBeInTheDocument();
    expect(screen.getByText('Parcialmente nublado')).toBeInTheDocument();
    expect(screen.getByText('⛅')).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByText('68%')).toBeInTheDocument();
    expect(screen.getByText('12,3 km/h')).toBeInTheDocument();
    expect(screen.getByText('0,1 mm')).toBeInTheDocument();
    expect(screen.getByText('1.015,2 hPa')).toBeInTheDocument();
    expect(screen.getByText('29/10/2026 às 10:00')).toBeInTheDocument();
  });

  it('derives the hero temperature in the selected unit', () => {
    render(
      <CurrentWeather city={mockWeatherData.city} current={completeCurrent} unit="fahrenheit" />,
    );

    expect(screen.getByText('72 °F')).toBeInTheDocument();
  });

  it('marks missing metrics unavailable without fabricating values', () => {
    const partialCurrent: CurrentWeatherData = {
      temperatureC: 22,
      weatherCode: 2,
      relativeHumidityPercent: 68,
    };

    render(<CurrentWeather city={mockWeatherData.city} current={partialCurrent} unit="celsius" />);

    expect(screen.getByText('68%')).toBeInTheDocument();
    expect(screen.getAllByText('Não disponível')).toHaveLength(3);
    expect(screen.getByRole('status')).toHaveTextContent('Alguns dados não estão disponíveis');
  });

  it('shows a fallback label and icon for an unknown weather code', () => {
    render(
      <CurrentWeather
        city={mockWeatherData.city}
        current={{ ...completeCurrent, weatherCode: 999 }}
        unit="celsius"
      />,
    );

    expect(screen.getByText('Condição não disponível')).toBeInTheDocument();
    expect(screen.getByText('❔')).toHaveAttribute('aria-hidden', 'true');
  });

  it('announces stale data when the caller provides the freshness state', () => {
    render(
      <CurrentWeather
        city={mockWeatherData.city}
        current={completeCurrent}
        unit="celsius"
        isStale
      />,
    );

    expect(screen.getByText('Dados desatualizados')).toBeInTheDocument();
  });

  it('does not claim freshness when the source reference time is missing', () => {
    render(
      <CurrentWeather
        city={mockWeatherData.city}
        current={{ ...completeCurrent, referenceTime: undefined }}
        unit="celsius"
      />,
    );

    expect(screen.getByText('Atualidade não informada')).toBeInTheDocument();
    expect(screen.queryByText('Dados desatualizados')).not.toBeInTheDocument();
  });

  it('treats zero as a real value, never as missing data', () => {
    render(
      <CurrentWeather
        city={mockWeatherData.city}
        current={{
          temperatureC: 0,
          weatherCode: 0,
          relativeHumidityPercent: 0,
          windSpeedKmh: 0,
          precipitationMm: 0,
          surfacePressureHpa: 0,
          referenceTime: '2026-10-29T10:00',
        }}
        unit="fahrenheit"
      />,
    );

    expect(screen.getByText('32 °F')).toBeInTheDocument();
    expect(screen.getByText('Céu limpo')).toBeInTheDocument();
    for (const value of ['0%', '0 km/h', '0 mm', '0 hPa']) {
      expect(screen.getByText(value)).toBeInTheDocument();
    }
    expect(screen.queryByText('Não disponível')).not.toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('shows an absent temperature as unavailable instead of converting it', () => {
    render(
      <CurrentWeather
        city={mockWeatherData.city}
        current={{ ...completeCurrent, temperatureC: undefined }}
        unit="fahrenheit"
      />,
    );

    expect(screen.getByText('Temperatura').nextElementSibling).toHaveTextContent('Não disponível');
    expect(document.body).not.toHaveTextContent(/NaN|°F/);
    expect(screen.getByRole('status')).toHaveTextContent('Alguns dados não estão disponíveis');
  });
});
