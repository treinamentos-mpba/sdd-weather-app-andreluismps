import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import ForecastList from '../../src/components/ForecastList';
import { mockWeatherData } from '../../src/mocks/weatherData';

describe('ForecastList', () => {
  it('renders five days with converted temperatures and no partial-data notice', () => {
    render(
      <ForecastList
        city={mockWeatherData.city}
        forecast={mockWeatherData.forecast}
        unit="fahrenheit"
      />,
    );

    expect(screen.getByRole('region', { name: 'Previsão em Sao Paulo' })).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(5);
    expect(screen.getAllByText('63 °F')).toHaveLength(2);
    expect(screen.queryByText('Alguns dados não estão disponíveis')).not.toBeInTheDocument();
  });

  it('keeps all five dates, marks absent values and announces the partial section', () => {
    render(
      <ForecastList
        city={mockWeatherData.city}
        unit="celsius"
        forecast={[
          { date: '2026-10-29', weatherCode: 2, minC: 17, maxC: 25 },
          { date: '2026-10-30' },
          { date: '2026-10-31', weatherCode: 61, minC: 18 },
          { date: '2026-11-01', weatherCode: 1, minC: 17, maxC: 26 },
          { date: '2026-11-02', weatherCode: 0, minC: 18, maxC: 27 },
        ]}
      />,
    );

    const days = screen.getAllByRole('listitem');
    expect(days).toHaveLength(5);
    expect(days[1]).toHaveTextContent('Condição não disponível');
    expect(days[1].textContent?.match(/Não disponível/g)).toHaveLength(2);
    expect(days[2]).toHaveTextContent('18 °C');
    expect(days[2].textContent?.match(/Não disponível/g)).toHaveLength(1);
    expect(days[3]).toHaveTextContent('26 °C');
    expect(screen.getByRole('status')).toHaveTextContent('Alguns dados não estão disponíveis');
  });

  it.each([
    ['celsius', '0 °C'],
    ['fahrenheit', '32 °F'],
  ] as const)('treats zero forecast values as real data in %s', (unit, expected) => {
    render(
      <ForecastList
        city={mockWeatherData.city}
        unit={unit}
        forecast={[{ date: '2026-10-29', weatherCode: 0, minC: 0, maxC: 0 }]}
      />,
    );

    expect(screen.getAllByText(expected)).toHaveLength(2);
    expect(screen.getByText('Céu limpo')).toBeInTheDocument();
    expect(screen.queryByText('Não disponível')).not.toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('shows the unavailable-forecast message when there are no days', () => {
    render(<ForecastList city={mockWeatherData.city} forecast={[]} unit="celsius" />);

    expect(screen.queryByRole('listitem')).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent(
      'Previsão não disponível para esta cidade.',
    );
  });
});
