import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Check, X, FolderPlus, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { getStockQuote } from '../lib/api';
import toast from 'react-hot-toast';

interface WatchlistItem {
  id: string;
  symbol: string;
  initial_price: number;
  current_price?: number;
  change?: number;
  changePercent?: string;
}

interface Watchlist {
  id: string;
  name: string;
  items: WatchlistItem[];
}

interface WatchlistProps {
  onSelectStock: (symbol: string) => void;
}

export function Watchlist({ onSelectStock }: WatchlistProps) {
  const [watchlists, setWatchlists] = useState<Watchlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [newWatchlistName, setNewWatchlistName] = useState('');
  const [showNewWatchlist, setShowNewWatchlist] = useState(false);
  const [editingWatchlist, setEditingWatchlist] = useState<string | null>(null);
  const [newSymbol, setNewSymbol] = useState('');
  const [addingToWatchlist, setAddingToWatchlist] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setIsAuthenticated(!!session);
        if (session) {
          await loadWatchlists();
        }
      } catch (error) {
        console.error('Error checking auth status:', error);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setIsAuthenticated(!!session);
      if (session) {
        await loadWatchlists();
      } else {
        setWatchlists([]);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loadWatchlists = async () => {
    if (!isAuthenticated) {
      setWatchlists([]);
      return;
    }

    try {
      const { data: watchlistsData, error: watchlistsError } = await supabase
        .from('watchlists')
        .select('*')
        .order('created_at', { ascending: true });

      if (watchlistsError) throw watchlistsError;

      const watchlistsWithItems = await Promise.all(
        (watchlistsData || []).map(async (watchlist) => {
          try {
            const { data: items, error: itemsError } = await supabase
              .from('watchlist_items')
              .select('*')
              .eq('watchlist_id', watchlist.id)
              .order('added_at', { ascending: true });

            if (itemsError) throw itemsError;

            return {
              ...watchlist,
              items: items || [],
            };
          } catch (error) {
            console.error(`Error loading items for watchlist ${watchlist.id}:`, error);
            return {
              ...watchlist,
              items: [],
            };
          }
        })
      );

      setWatchlists(watchlistsWithItems);
      if (watchlistsWithItems.length > 0) {
        await refreshPrices(watchlistsWithItems);
      }
    } catch (error: any) {
      if (!error.__isAuthError) {
        console.error('Error loading watchlists:', error);
        toast.error('Failed to load watchlists');
      }
      setWatchlists([]);
    }
  };

  const refreshPrices = async (currentWatchlists: Watchlist[]) => {
    if (!currentWatchlists.length) return;
    
    setRefreshing(true);
    try {
      const updatedWatchlists = await Promise.all(
        currentWatchlists.map(async (watchlist) => {
          const updatedItems = await Promise.all(
            watchlist.items.map(async (item) => {
              try {
                const quote = await getStockQuote(item.symbol);
                if (!quote || typeof quote.price !== 'number') {
                  throw new Error(`Invalid quote data for ${item.symbol}`);
                }
                return {
                  ...item,
                  current_price: quote.price,
                  change: quote.change,
                  changePercent: quote.changePercent,
                };
              } catch (error) {
                console.error(`Error fetching quote for ${item.symbol}:`, error);
                return item;
              }
            })
          );
          return { ...watchlist, items: updatedItems };
        })
      );
      setWatchlists(updatedWatchlists);
    } catch (error: any) {
      console.error('Error refreshing prices:', error);
      toast.error('Failed to refresh prices');
    } finally {
      setRefreshing(false);
    }
  };

  const createWatchlist = async () => {
    if (!newWatchlistName.trim()) {
      toast.error('Please enter a watchlist name');
      return;
    }

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) {
        toast.error('You must be logged in to create a watchlist');
        return;
      }

      const { data, error } = await supabase
        .from('watchlists')
        .insert([{ 
          name: newWatchlistName.trim(),
          user_id: user.id
        }])
        .select()
        .single();

      if (error) throw error;
      if (!data) throw new Error('No data returned from insert');

      setWatchlists([...watchlists, { ...data, items: [] }]);
      setNewWatchlistName('');
      setShowNewWatchlist(false);
      toast.success('Watchlist created successfully');
    } catch (error: any) {
      console.error('Error creating watchlist:', error);
      toast.error(error.message || 'Failed to create watchlist');
    }
  };

  const addToWatchlist = async (watchlistId: string) => {
    if (!newSymbol.trim()) {
      toast.error('Please enter a stock symbol');
      return;
    }

    try {
      const symbol = newSymbol.trim().toUpperCase();
      const quote = await getStockQuote(symbol);
      
      if (!quote || typeof quote.price !== 'number' || isNaN(quote.price)) {
        throw new Error('Could not get valid price for stock');
      }

      const { error } = await supabase
        .from('watchlist_items')
        .insert([{
          watchlist_id: watchlistId,
          symbol: symbol,
          initial_price: quote.price
        }]);

      if (error) {
        if (error.code === '23505') { // Unique violation
          throw new Error('This stock is already in your watchlist');
        }
        throw error;
      }

      await loadWatchlists();
      setNewSymbol('');
      setAddingToWatchlist(null);
      toast.success(`${symbol} added to watchlist`);
    } catch (error: any) {
      console.error('Error adding to watchlist:', error);
      toast.error(error.message || 'Failed to add stock to watchlist');
    }
  };

  const removeFromWatchlist = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from('watchlist_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;

      setWatchlists(watchlists.map(watchlist => ({
        ...watchlist,
        items: watchlist.items.filter(item => item.id !== itemId)
      })));
      
      toast.success('Stock removed from watchlist');
    } catch (error: any) {
      console.error('Error removing from watchlist:', error);
      toast.error(error.message || 'Failed to remove stock from watchlist');
    }
  };

  const deleteWatchlist = async (watchlistId: string) => {
    try {
      const { error } = await supabase
        .from('watchlists')
        .delete()
        .eq('id', watchlistId);

      if (error) throw error;

      setWatchlists(watchlists.filter(w => w.id !== watchlistId));
      toast.success('Watchlist deleted');
    } catch (error: any) {
      console.error('Error deleting watchlist:', error);
      toast.error(error.message || 'Failed to delete watchlist');
    }
  };

  const updateWatchlistName = async (watchlistId: string, newName: string) => {
    if (!newName.trim()) {
      toast.error('Watchlist name cannot be empty');
      return;
    }

    try {
      const { error } = await supabase
        .from('watchlists')
        .update({ name: newName.trim() })
        .eq('id', watchlistId);

      if (error) throw error;

      setWatchlists(watchlists.map(w => 
        w.id === watchlistId ? { ...w, name: newName.trim() } : w
      ));
      setEditingWatchlist(null);
      toast.success('Watchlist name updated');
    } catch (error: any) {
      console.error('Error updating watchlist name:', error);
      toast.error(error.message || 'Failed to update watchlist name');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-card-foreground">My Watchlists</h2>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => refreshPrices(watchlists)}
            disabled={refreshing}
            className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-all duration-300"
          >
            {refreshing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              'Refresh Prices'
            )}
          </button>
          <button
            onClick={() => setShowNewWatchlist(true)}
            className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 transition-all duration-300"
          >
            <FolderPlus className="h-4 w-4" />
            <span>New Watchlist</span>
          </button>
        </div>
      </div>

      {showNewWatchlist && (
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={newWatchlistName}
            onChange={(e) => setNewWatchlistName(e.target.value)}
            placeholder="Enter watchlist name"
            className="flex-1 px-4 py-2 text-sm border rounded-lg bg-card text-card-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            onClick={createWatchlist}
            className="p-2 text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 transition-all duration-300"
          >
            <Check className="h-4 w-4" />
          </button>
          <button
            onClick={() => setShowNewWatchlist(false)}
            className="p-2 text-destructive bg-destructive/10 rounded-lg hover:bg-destructive/20 transition-all duration-300"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {watchlists.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No watchlists yet. Create one to start tracking stocks!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {watchlists.map((watchlist) => (
            <div
              key={watchlist.id}
              className="bg-card rounded-xl p-6 border border-border shadow-sm"
            >
              <div className="flex items-center justify-between mb-4">
                {editingWatchlist === watchlist.id ? (
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={watchlist.name}
                      onChange={(e) => {
                        setWatchlists(watchlists.map(w =>
                          w.id === watchlist.id ? { ...w, name: e.target.value } : w
                        ));
                      }}
                      className="px-2 py-1 text-sm border rounded bg-card text-card-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <button
                      onClick={() => updateWatchlistName(watchlist.id, watchlist.name)}
                      className="p-1 text-primary hover:bg-primary/10 rounded transition-colors"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setEditingWatchlist(null)}
                      className="p-1 text-destructive hover:bg-destructive/10 rounded transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <h3 className="text-lg font-medium text-card-foreground">{watchlist.name}</h3>
                    <button
                      onClick={() => setEditingWatchlist(watchlist.id)}
                      className="p-1 text-muted-foreground hover:text-card-foreground hover:bg-accent/50 rounded transition-colors"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setAddingToWatchlist(watchlist.id)}
                    className="p-2 text-primary hover:bg-primary/10 rounded transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => deleteWatchlist(watchlist.id)}
                    className="p-2 text-destructive hover:bg-destructive/10 rounded transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {addingToWatchlist === watchlist.id && (
                <div className="flex items-center space-x-2 mb-4">
                  <input
                    type="text"
                    value={newSymbol}
                    onChange={(e) => setNewSymbol(e.target.value.toUpperCase())}
                    placeholder="Enter stock symbol (e.g., AAPL)"
                    className="flex-1 px-4 py-2 text-sm border rounded-lg bg-card text-card-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <button
                    onClick={() => addToWatchlist(watchlist.id)}
                    className="p-2 text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 transition-all duration-300"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setAddingToWatchlist(null)}
                    className="p-2 text-destructive bg-destructive/10 rounded-lg hover:bg-destructive/20 transition-all duration-300"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}

              {watchlist.items.length === 0 ? (
                <p className="text-sm text-muted-foreground">No stocks in this watchlist yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left border-b border-border">
                        <th className="pb-2 text-sm font-medium text-muted-foreground">Symbol</th>
                        <th className="pb-2 text-sm font-medium text-muted-foreground">Current Price</th>
                        <th className="pb-2 text-sm font-medium text-muted-foreground">Initial Price</th>
                        <th className="pb-2 text-sm font-medium text-muted-foreground">Change</th>
                        <th className="pb-2 text-sm font-medium text-muted-foreground">Total P/L</th>
                        <th className="pb-2 text-sm font-medium text-muted-foreground"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {watchlist.items.map((item) => {
                        const totalChange = item.current_price
                          ? ((item.current_price - item.initial_price) / item.initial_price) * 100
                          : 0;

                        return (
                          <tr key={item.id} className="border-b border-border/50 last:border-0">
                            <td className="py-3 font-medium">
                              <button
                                onClick={() => onSelectStock(item.symbol)}
                                className="hover:text-primary transition-colors"
                              >
                                {item.symbol}
                              </button>
                            </td>
                            <td className="py-3">${item.current_price?.toFixed(2) || '-'}</td>
                            <td className="py-3">${item.initial_price.toFixed(2)}</td>
                            <td className="py-3">
                              <span className={item.change && item.change >= 0 ? 'text-green-500' : 'text-red-500'}>
                                {item.change ? (item.change >= 0 ? '+' : '') + item.change.toFixed(2) : '-'}
                                {item.changePercent ? ` (${item.changePercent})` : ''}
                              </span>
                            </td>
                            <td className="py-3">
                              <span className={totalChange >= 0 ? 'text-green-500' : 'text-red-500'}>
                                {totalChange ? (totalChange >= 0 ? '+' : '') + totalChange.toFixed(2) + '%' : '-'}
                              </span>
                            </td>
                            <td className="py-3">
                              <button
                                onClick={() => removeFromWatchlist(item.id)}
                                className="p-1 text-destructive hover:bg-destructive/10 rounded transition-colors"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}