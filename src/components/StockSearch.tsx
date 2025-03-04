import { Search } from 'lucide-react';
import { useState } from 'react';

interface StockSearchProps {
  onSearch: (symbol: string) => void;
  loading?: boolean;
}

export function StockSearch({ onSearch, loading }: StockSearchProps) {
  const [symbol, setSymbol] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (symbol.trim()) {
      onSearch(symbol.toUpperCase());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md">
      <div className="relative">
        <input
          type="text"
          value={symbol}
          onChange={(e) => setSymbol(e.target.value)}
          placeholder="Enter stock symbol (e.g., AAPL)"
          className="w-full px-4 py-2 pl-10 pr-12 text-sm border rounded-lg bg-card text-card-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          disabled={loading}
        />
        <Search className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
        <button
          type="submit"
          disabled={loading}
          className={`absolute right-2 top-1.5 px-3 py-1 text-sm text-primary-foreground rounded focus:outline-none focus:ring-2 focus:ring-primary ${
            loading
              ? 'bg-muted cursor-not-allowed'
              : 'bg-primary hover:bg-primary/90'
          }`}
        >
          {loading ? 'Loading...' : 'Search'}
        </button>
      </div>
    </form>
  );
}