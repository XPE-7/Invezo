import React, { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { BarChart2, TrendingUp, History, Activity, DollarSign, Volume2, Sun, Moon, Home, User, PlusCircle } from 'lucide-react';
import { StockChart } from './components/StockChart';
import { StockSearch } from './components/StockSearch';
import { Auth } from './components/Auth';
import { TermsAndConditions } from './components/TermsAndConditions';
import { UserProfile } from './components/UserProfile';
import { Watchlist } from './components/Watchlist';
import { Settings } from './components/Settings';
import { TradingHistory } from './components/TradingHistory';
import { Notifications } from './components/Notifications';
import { AIChat } from './components/AIChat';
import { supabase } from './lib/supabase';
import { getStockData, getStockQuote } from './lib/api';
import type { TimeRange } from './lib/api';
import toast from 'react-hot-toast';
import type { User as SupabaseUser } from '@supabase/supabase-js';

function App() {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentSymbol, setCurrentSymbol] = useState('');
  const [timeRange, setTimeRange] = useState<TimeRange>('1D');
  const [termsAccepted, setTermsAccepted] = useState(() => {
    return localStorage.getItem('termsAccepted') === 'true';
  });
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [showWatchlistModal, setShowWatchlistModal] = useState(false);
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' ||
        (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  const [stockData, setStockData] = useState<{
    labels: string[];
    actual: number[];
    predicted: (number | null)[];
  }>({
    labels: [],
    actual: [],
    predicted: [],
  });

  const [quote, setQuote] = useState({
    price: 0,
    change: 0,
    changePercent: '0%',
    volume: 0,
    high: 0,
    low: 0,
  });

  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date>(new Date());

  const stockLogos: Record<string, string> = {
    AAPL: 'https://companieslogo.com/img/orig/AAPL-bf1a4314.png',
    GOOGL: 'https://companieslogo.com/img/orig/GOOGL-0ed88f7c.png',
    MSFT: 'https://companieslogo.com/img/orig/MSFT-a203b22d.png',
    AMZN: 'https://companieslogo.com/img/orig/AMZN-e9f942e4.png',
    TSLA: 'https://companieslogo.com/img/orig/TSLA-6da6be6d.png',
    META: 'https://companieslogo.com/img/orig/META-4767da84.png',
    NVDA: 'https://companieslogo.com/img/orig/NVDA-8fb0eb0c.png',
    JPM: 'https://companieslogo.com/img/orig/JPM-0b686f17.png',
    V: 'https://companieslogo.com/img/orig/V-69802e35.png',
    WMT: 'https://companieslogo.com/img/orig/WMT-2e614f59.png',
    JNJ: 'https://companieslogo.com/img/orig/JNJ-b4d4d6c0.png',
    MA: 'https://companieslogo.com/img/orig/MA-0c8a668f.png',
    PG: 'https://companieslogo.com/img/orig/PG-8ed6508c.png',
    HD: 'https://companieslogo.com/img/orig/HD-0fa1dc54.png',
    BAC: 'https://companieslogo.com/img/orig/BAC-d77e744d.png',
    DIS: 'https://companieslogo.com/img/orig/DIS-62d2eac5.png',
    NFLX: 'https://companieslogo.com/img/orig/NFLX-af27a102.png',
    ADBE: 'https://companieslogo.com/img/orig/ADBE-6cb4c120.png',
    PYPL: 'https://companieslogo.com/img/orig/PYPL-78d22ec0.png',
    INTC: 'https://companieslogo.com/img/orig/INTC-20f04698.png',
    CRM: 'https://companieslogo.com/img/orig/CRM-8c78b2cb.png',
    AMD: 'https://companieslogo.com/img/orig/AMD-5c2d6da3.png',
    QCOM: 'https://companieslogo.com/img/orig/QCOM-58ac69b8.png',
    CSCO: 'https://companieslogo.com/img/orig/CSCO-e57d6f82.png'
  };

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user ?? null);
      } catch (error) {
        console.error('Error checking auth session:', error);
        toast.error('Failed to initialize authentication');
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        setTermsAccepted(false);
        localStorage.removeItem('termsAccepted');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  useEffect(() => {
    if (currentSymbol && autoRefresh) {
      const updateQuote = async () => {
        try {
          const quoteData = await getStockQuote(currentSymbol);
          if (quoteData.price > 0) {
            setQuote(quoteData);
            setLastUpdateTime(new Date());
          }
        } catch (error) {
          console.error('Error updating quote:', error);
        }
      };

      updateQuote();
      const interval = setInterval(updateQuote, 60000);
      return () => clearInterval(interval);
    }
  }, [currentSymbol, autoRefresh]);

  const handleSearch = async (symbol: string) => {
    if (!symbol.trim()) return;
    
    setLoading(true);
    try {
      setCurrentSymbol(symbol);
      const [data, quoteData] = await Promise.all([
        getStockData(symbol, timeRange),
        getStockQuote(symbol),
      ]);

      if (data.labels.length > 0) {
        setStockData(data);
      }
      
      if (quoteData.price > 0) {
        setQuote(quoteData);
        toast.success(`Updated ${symbol} data`);
      } else {
        toast.error(`No data available for ${symbol}`);
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error fetching stock data');
    } finally {
      setLoading(false);
    }
  };

  const handleTimeRangeChange = async (newRange: TimeRange) => {
    setTimeRange(newRange);
    if (currentSymbol) {
      handleSearch(currentSymbol);
    }
  };

  const handleReset = () => {
    setCurrentSymbol('');
    setStockData({ labels: [], actual: [], predicted: [] });
    setQuote({ price: 0, change: 0, changePercent: '0%', volume: 0, high: 0, low: 0 });
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      setTermsAccepted(false);
      localStorage.removeItem('termsAccepted');
      toast.success('Signed out successfully');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Error signing out');
    }
  };

  const handleAcceptTerms = () => {
    setTermsAccepted(true);
    localStorage.setItem('termsAccepted', 'true');
  };

  const formatLargeNumber = (num: number) => {
    if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
    return num.toString();
  };

  const popularStocks = [
    { symbol: 'AAPL', name: 'Apple Inc.' },
    { symbol: 'GOOGL', name: 'Alphabet Inc.' },
    { symbol: 'MSFT', name: 'Microsoft Corp.' },
    { symbol: 'AMZN', name: 'Amazon.com Inc.' },
    { symbol: 'TSLA', name: 'Tesla Inc.' },
    { symbol: 'META', name: 'Meta Platforms Inc.' },
    { symbol: 'NVDA', name: 'NVIDIA Corp.' },
    { symbol: 'JPM', name: 'JPMorgan Chase & Co.' },
    { symbol: 'V', name: 'Visa Inc.' },
    { symbol: 'WMT', name: 'Walmart Inc.' },
    { symbol: 'JNJ', name: 'Johnson & Johnson' },
    { symbol: 'MA', name: 'Mastercard Inc.' },
    { symbol: 'PG', name: 'Procter & Gamble Co.' },
    { symbol: 'HD', name: 'Home Depot Inc.' },
    { symbol: 'BAC', name: 'Bank of America Corp.' },
    { symbol: 'DIS', name: 'Walt Disney Co.' },
    { symbol: 'NFLX', name: 'Netflix Inc.' },
    { symbol: 'ADBE', name: 'Adobe Inc.' },
    { symbol: 'PYPL', name: 'PayPal Holdings Inc.' },
    { symbol: 'INTC', name: 'Intel Corp.' },
    { symbol: 'CRM', name: 'Salesforce Inc.' },
    { symbol: 'AMD', name: 'Advanced Micro Devices Inc.' },
    { symbol: 'QCOM', name: 'Qualcomm Inc.' },
    { symbol: 'CSCO', name: 'Cisco Systems Inc.' }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-accent flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Remove the authentication check to load the app directly

  if (!termsAccepted) {
    return <TermsAndConditions onAccept={handleAcceptTerms} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-accent transition-colors duration-300">
      <Toaster position="top-right" />
      
      <nav className="bg-card/80 backdrop-blur-sm shadow-sm sticky top-0 z-10 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-4">
              {currentSymbol ? (
                <button
                  onClick={handleReset}
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-all duration-300 hover:scale-105"
                >
                  <Home className="h-5 w-5" />
                  <span>Home</span>
                </button>
              ) : (
                <div className="flex items-center">
                  <div className="relative">
                    <BarChart2 className="h-8 w-8 text-primary transform -rotate-12 transition-transform duration-300 hover:rotate-0" />
                    <BarChart2 className="h-8 w-8 text-primary/30 absolute top-0 left-0 transform rotate-12 transition-transform duration-300 hover:rotate-0" />
                  </div>
                  <span className="ml-3 text-xl font-bold bg-gradient-to-r from-primary via-blue-600 to-blue-800 dark:to-blue-400 text-transparent bg-clip-text">
                    Invezo
                  </span>
                </div>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setIsDark(!isDark)}
                className="theme-toggle"
                aria-label="Toggle theme"
              >
                {isDark ? (
                  <Sun className="h-5 w-5 transition-transform duration-300 hover:rotate-180" />
                ) : (
                  <Moon className="h-5 w-5 transition-transform duration-300 hover:rotate-180" />
                )}
              </button>
              <button className="flex items-center px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-all duration-300 hover:scale-105">
                <History className="h-5 w-5 mr-2" />
                History
              </button>
              <div className="relative">
                <button
                  onClick={() => setShowUserProfile(!showUserProfile)}
                  className="flex items-center space-x-2 px-3 py-1 rounded-lg bg-accent/50 hover:bg-accent transition-all duration-300"
                >
                  <img
                    src={user.user_metadata.avatar_url}
                    alt={user.user_metadata.full_name}
                    className="w-6 h-6 rounded-full"
                  />
                  <span className="text-sm text-foreground">{user.user_metadata.full_name}</span>
                  <User className="h-4 w-4 text-muted-foreground" />
                </button>
                {showUserProfile && (
                  <UserProfile
                    user={user}
                    onClose={() => setShowUserProfile(false)}
                    onSignOut={handleSignOut}
                    isDark={isDark}
                    onThemeChange={setIsDark}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          <div className="flex flex-col items-center space-y-4 animate-slide-up">
            <div className="flex items-center space-x-3 mb-4">
              <div className="relative">
                <BarChart2 className="h-12 w-12 text-primary transform -rotate-12 transition-transform duration-300 hover:rotate-0" />
                <BarChart2 className="h-12 w-12 text-primary/30 absolute top-0 left-0 transform rotate-12 transition-transform duration-300 hover:rotate-0" />
              </div>
              <h1 className="text-5xl font-bold text-foreground bg-gradient-to-r from-primary via-blue-600 to-blue-800 dark:to-blue-400 text-transparent bg-clip-text">
                Invezo
              </h1>
            </div>
            <p className="text-muted-foreground text-center max-w-2xl">
              Advanced AI-Powered Stock Analysis and Predictions
            </p>
            <StockSearch onSearch={handleSearch} loading={loading} />
            {currentSymbol && (
              <div className="flex items-center justify-between mb-4 w-full">
                <div className="flex items-center space-x-2">
                  <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium relative pulse-ring">
                    {currentSymbol}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    Last updated: {lastUpdateTime.toLocaleTimeString()}
                  </span>
                </div>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => setShowWatchlistModal(true)}
                    className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 transition-all duration-300"
                  >
                    <PlusCircle className="h-4 w-4" />
                    <span>Add to Watchlist</span>
                  </button>
                  <button
                    onClick={() => setAutoRefresh(!autoRefresh)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                      autoRefresh
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {autoRefresh ? 'Auto-refresh On' : 'Auto-refresh Off'}
                  </button>
                  <button
                    onClick={() => handleSearch(currentSymbol)}
                    className="px-4 py-2 rounded-lg text-sm font-medium bg-accent hover:bg-accent/80 transition-all duration-300"
                  >
                    Refresh Now
                  </button>
                </div>
              </div>
            )}
          </div>

          {currentSymbol && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-slide-up">
                <div className="bg-card rounded-xl p-6 border border-border card-hover">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-muted-foreground">Current Price</h3>
                    <DollarSign className="h-5 w-5 text-primary" />
                  </div>
                  <div className="mt-2">
                    <p className="text-3xl font-bold text-card-foreground">
                      ${quote.price.toFixed(2)}
                    </p>
                    <p className={`text-sm font-medium ${quote.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {quote.change >= 0 ? '↑' : '↓'} {Math.abs(quote.change).toFixed(2)} ({quote.changePercent})
                    </p>
                  </div>
                </div>

                <div className="bg-card rounded-xl p-6 border border-border card-hover">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-muted-foreground">Trading Volume</h3>
                    <Volume2 className="h-5 w-5 text-primary" />
                  </div>
                  <div className="mt-2">
                    <p className="text-3xl font-bold text-card-foreground">
                      {formatLargeNumber(quote.volume)}
                    </p>
                    <p className="text-sm text-muted-foreground">24h Volume</p>
                  </div>
                </div>

                <div className="bg-card rounded-xl p-6 border border-border card-hover">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-muted-foreground">Day Range</h3>
                    <Activity className="h-5 w-5 text-primary" />
                  </div>
                  <div className="mt-2">
                    <div className="flex items-baseline space-x-2">
                      <span className="text-2xl font-bold text-card-foreground">${quote.low.toFixed(2)}</span>
                      <span className="text-muted-foreground">-</span>
                      <span className="text-2xl font-bold text-card-foreground">${quote.high.toFixed(2)}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">Low - High</p>
                  </div>
                </div>

                <div className="bg-card rounded-xl p-6 border border-border card-hover">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-muted-foreground">AI Prediction</h3>
                    <TrendingUp className="h-5 w-5 text-primary" />
                  </div>
                  <div className="mt-2">
                    {stockData.predicted && stockData.predicted.length > 0 && (
                      <>
                        <p className="text-3xl font-bold text-card-foreground">
                          ${stockData.predicted[stockData.predicted.length - 1]?.toFixed(2) || '0.00'}
                        </p>
                        <p className="text-sm text-muted-foreground">Predicted in 50min</p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-card rounded-xl shadow-lg p-6 border border-border card-hover animate-slide-up">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-card-foreground">Price Chart & Predictions</h2>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-primary rounded-full mr-2"></div>
                      <span className="text-sm text-muted-foreground">Actual</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                      <span className="text-sm text-muted-foreground">Predicted</span>
                    </div>
                  </div>
                </div>
                <StockChart 
                  data={stockData} 
                  isDark={isDark} 
                  timeRange={timeRange}
                  onTimeRangeChange={handleTimeRangeChange}
                />
              </div>
            </>
          )}

          {!currentSymbol && (
            <>
              <Watchlist onSelectStock={handleSearch} />

              <div className="bg-card rounded-xl shadow-lg p-6 border border-border card-hover animate-slide-up">
                <h2 className="text-xl font-semibold text-card-foreground mb-6">Popular Stocks</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {popularStocks.map(({ symbol, name }) => (
                    <button
                      key={symbol}
                      onClick={() => handleSearch(symbol)}
                      className="flex items-center space-x-3 p-4 border border-border rounded-lg hover:bg-accent/50 transition-all duration-300 hover:scale-105 group"
                    >
                      <img
                        src={stockLogos[symbol]}
                        alt={`${name} logo`}
                        className="w-8 h-8 object-contain"
                      />
                      <div className="text-left">
                        <h3 className="font-medium text-card-foreground group-hover:text-primary">{symbol}</h3>
                        <p className="text-sm text-muted-foreground">{name}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;