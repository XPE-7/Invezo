import React, { useState, useEffect } from 'react';
import { ArrowLeft, Calendar, TrendingUp, TrendingDown, DollarSign, Search, Loader2 } from 'lucide-react';
import { getTradingHistory } from '../lib/api';
import { format } from 'date-fns';

interface HistoryProps {
  onClose: () => void;
}

interface Trade {
  id: string;
  symbol: string;
  type: string;
  price: number;
  quantity: number;
  executed_at: string;
  profit_loss: number | null;
}

export function TradingHistory({ onClose }: HistoryProps) {
  const [loading, setLoading] = useState(true);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadTradingHistory();
  }, []);

  const loadTradingHistory = async () => {
    try {
      const history = await getTradingHistory();
      setTrades(history);
    } catch (error) {
      console.error('Error loading trading history:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTrades = trades
    .filter(trade => {
      if (filter === 'all') return true;
      return trade.type.toLowerCase() === filter;
    })
    .filter(trade =>
      trade.symbol.toLowerCase().includes(searchTerm.toLowerCase())
    );

  if (loading) {
    return (
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50">
        <div className="fixed inset-x-0 top-0 bottom-0 md:inset-x-auto md:left-auto md:right-4 md:top-20 md:bottom-4 md:w-[600px] bg-card rounded-lg shadow-lg border border-border flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50">
      <div className="fixed inset-x-0 top-0 bottom-0 md:inset-x-auto md:left-auto md:right-4 md:top-20 md:bottom-4 md:w-[600px] bg-card rounded-lg shadow-lg border border-border flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Trading History</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-accent rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 border-b border-border">
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by symbol..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-4 py-2 text-sm border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Trades</option>
              <option value="buy">Buy Orders</option>
              <option value="sell">Sell Orders</option>
            </select>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredTrades.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <Calendar className="h-12 w-12 mb-2" />
              <p>No trading history found</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filteredTrades.map((trade) => (
                <div key={trade.id} className="p-4 hover:bg-accent/50 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      {trade.type.toLowerCase() === 'buy' ? (
                        <TrendingUp className="h-5 w-5 text-green-500" />
                      ) : (
                        <TrendingDown className="h-5 w-5 text-red-500" />
                      )}
                      <span className="font-medium">{trade.symbol}</span>
                      <span className="text-sm text-muted-foreground">
                        {trade.type.toUpperCase()}
                      </span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(trade.executed_at), 'MMM d, yyyy h:mm a')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="space-x-4">
                      <span>
                        Quantity: <span className="font-medium">{trade.quantity}</span>
                      </span>
                      <span>
                        Price: <span className="font-medium">${trade.price.toFixed(2)}</span>
                      </span>
                    </div>
                    {trade.profit_loss !== null && (
                      <div
                        className={`flex items-center space-x-1 ${
                          trade.profit_loss >= 0 ? 'text-green-500' : 'text-red-500'
                        }`}
                      >
                        <DollarSign className="h-4 w-4" />
                        <span className="font-medium">
                          {trade.profit_loss >= 0 ? '+' : ''}
                          {trade.profit_loss.toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}