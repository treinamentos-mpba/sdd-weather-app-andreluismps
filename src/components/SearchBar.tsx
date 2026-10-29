import { type FormEvent, useRef, useState } from 'react';

interface SearchBarProps {
  onSearch: (city: string) => void;
  disabled?: boolean;
}

export default function SearchBar({ onSearch, disabled = false }: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [feedback, setFeedback] = useState('');

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (disabled) return;

    const city = query.trim();
    if (!city) {
      setFeedback('Informe o nome de uma cidade para iniciar a busca');
      inputRef.current?.focus();
      return;
    }

    setFeedback('');
    onSearch(city);
  }

  function handleChange(value: string) {
    setQuery(value);
    if (feedback) setFeedback('');
  }

  return (
    <form
      role="search"
      aria-label="Buscar cidades"
      aria-busy={disabled}
      onSubmit={handleSubmit}
      className="grid w-full gap-3 rounded-lg border border-white/10 bg-white/5 p-4 shadow-glass backdrop-blur-md sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end"
    >
      <div className="grid min-w-0 gap-2">
        <label htmlFor="city-search" className="text-sm font-medium text-white">
          Cidade
        </label>
        <input
          ref={inputRef}
          id="city-search"
          name="city"
          type="search"
          autoComplete="off"
          value={query}
          disabled={disabled}
          aria-invalid={feedback ? true : undefined}
          aria-describedby={feedback ? 'city-search-feedback' : undefined}
          onChange={(event) => handleChange(event.currentTarget.value)}
          placeholder="Digite o nome de uma cidade"
          className="min-w-0 rounded-lg border border-white/10 bg-night-800 px-3 py-2.5 text-white placeholder:text-white/50 focus-visible:border-accent-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 focus-visible:ring-offset-2 focus-visible:ring-offset-night-900 disabled:cursor-not-allowed disabled:opacity-60"
        />
        {feedback && (
          <p id="city-search-feedback" role="status" className="text-sm text-sun">
            {feedback}
          </p>
        )}
      </div>
      <button
        type="submit"
        disabled={disabled}
        className="min-h-11 rounded-lg bg-accent-500 px-4 py-2.5 font-medium text-night-900 hover:bg-accent-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 focus-visible:ring-offset-2 focus-visible:ring-offset-night-900 disabled:cursor-not-allowed disabled:opacity-60"
      >
        Buscar
      </button>
    </form>
  );
}
