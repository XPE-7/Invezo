import { supabase } from './supabase';
import { toast } from 'react-hot-toast';

const API_KEY = import.meta.env.VITE_ALPHA_VANTAGE_API_KEY;
const BASE_URL = 'https://www.alphavantage.co/query';

export type TimeRange = '1D' | '1W' | '1M' | '3M' | '1Y' | 'ALL';

// Cache implementation
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 60 * 1000; // 1 minute cache

// Rate limiting
const requestQueue: Array<() => Promise<any>> = [];
let isProcessingQueue = false;

async function processQueue() {
  if (isProcessingQueue) return;
  isProcessingQueue = true;

  while (requestQueue.length > 0) {
    const request = requestQueue.shift();
    if (request) {
      try {
        await request();
      } catch (error) {
        console.error('Request failed:', error);
      }
      // Wait 12 seconds between requests (Alpha Vantage limit is 5 calls per minute)
      await new Promise(resolve => setTimeout(resolve, 12000));
    }
  }

  isProcessingQueue = false;
}

async function makeRequest(url: string, cacheKey: string) {
  try {
    // Check cache first
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    }

    return new Promise((resolve, reject) => {
      const request = async () => {
        try {
          const response = await fetch(url);
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          const data = await response.json();

          // Check for API error messages
          if (data['Error Message']) {
            throw new Error(data['Error Message']);
          }
          if (data['Note']) {
            throw new Error('API rate limit exceeded. Please try again later.');
          }
          if (!data || Object.keys(data).length === 0) {
            throw new Error('No data received from API');
          }

          // Update cache
          cache.set(cacheKey, { data, timestamp: Date.now() });
          resolve(data);
        } catch (error) {
          reject(error);
        }
      };

      requestQueue.push(request);
      processQueue().catch(console.error);
    });
  } catch (error) {
    console.error('Request failed:', error);
    throw error;
  }
}

export async function getStockQuote(symbol: string) {
  if (!symbol) {
    console.warn('Stock symbol is required');
    return getEmptyQuote();
  }

  try {
    const url = `${BASE_URL}?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${API_KEY}`;
    const cacheKey = `quote_${symbol}`;
    
    const data = await makeRequest(url, cacheKey);
    const quote = data['Global Quote'];

    if (!quote || Object.keys(quote).length === 0) {
      console.warn(`No quote data available for symbol: ${symbol}`);
      return getEmptyQuote();
    }

    return {
      price: parseFloat(quote['05. price']) || 0,
      change: parseFloat(quote['09. change']) || 0,
      changePercent: quote['10. change percent'] || '0%',
      volume: parseInt(quote['06. volume']) || 0,
      high: parseFloat(quote['03. high']) || 0,
      low: parseFloat(quote['04. low']) || 0,
    };
  } catch (error) {
    console.error('Error fetching stock quote:', error);
    toast.error('Failed to fetch stock quote. Please try again later.');
    return getEmptyQuote();
  }
}

function getEmptyQuote() {
  return {
    price: 0,
    change: 0,
    changePercent: '0%',
    volume: 0,
    high: 0,
    low: 0,
  };
}

export async function getStockData(symbol: string, timeRange: TimeRange = '1D') {
  if (!symbol) {
    console.warn('Stock symbol is required');
    return getEmptyStockData();
  }

  try {
    const config = getTimeRangeConfig(timeRange);
    const url = buildApiUrl(symbol, config);
    const cacheKey = `data_${symbol}_${timeRange}`;
    
    const data = await makeRequest(url, cacheKey);
    const timeSeriesData = extractTimeSeriesData(data, config);
    
    if (!timeSeriesData || Object.keys(timeSeriesData).length === 0) {
      console.warn(`No time series data available for ${symbol} with time range ${timeRange}`);
      return getEmptyStockData();
    }

    const { labels, prices } = processTimeSeriesData(timeSeriesData, timeRange, config.limit);
    const predicted = timeRange === '1D' ? generatePredictions(prices) : [];

    return {
      labels: [
        ...labels,
        ...(timeRange === '1D' ? Array.from({ length: 10 }, (_, i) => `+${(i + 1) * 5}min`) : [])
      ],
      actual: prices,
      predicted: timeRange === '1D' ? [...Array(prices.length).fill(null), ...predicted] : []
    };
  } catch (error) {
    console.error('Error fetching stock data:', error);
    toast.error('Failed to fetch stock data. Please try again later.');
    return getEmptyStockData();
  }
}

function getEmptyStockData() {
  return {
    labels: [],
    actual: [],
    predicted: []
  };
}

interface TimeRangeConfig {
  function: string;
  interval?: string;
  limit: number;
  dataKey: string;
}

function getTimeRangeConfig(timeRange: TimeRange): TimeRangeConfig {
  switch (timeRange) {
    case '1D':
      return {
        function: 'TIME_SERIES_INTRADAY',
        interval: '5min',
        limit: 78,
        dataKey: 'Time Series (5min)'
      };
    case '1W':
      return {
        function: 'TIME_SERIES_INTRADAY',
        interval: '60min',
        limit: 33,
        dataKey: 'Time Series (60min)'
      };
    case '1M':
      return {
        function: 'TIME_SERIES_DAILY',
        limit: 22,
        dataKey: 'Time Series (Daily)'
      };
    case '3M':
      return {
        function: 'TIME_SERIES_DAILY',
        limit: 66,
        dataKey: 'Time Series (Daily)'
      };
    case '1Y':
    case 'ALL':
      return {
        function: 'TIME_SERIES_WEEKLY',
        limit: timeRange === '1Y' ? 52 : 1000,
        dataKey: 'Weekly Time Series'
      };
    default:
      throw new Error('Invalid time range');
  }
}

function buildApiUrl(symbol: string, config: TimeRangeConfig): string {
  const url = new URL(BASE_URL);
  url.searchParams.append('function', config.function);
  url.searchParams.append('symbol', symbol);
  if (config.interval) {
    url.searchParams.append('interval', config.interval);
  }
  url.searchParams.append('apikey', API_KEY);
  return url.toString();
}

function extractTimeSeriesData(data: any, config: TimeRangeConfig) {
  return data[config.dataKey] || null;
}

function processTimeSeriesData(
  timeSeriesData: Record<string, any>,
  timeRange: TimeRange,
  limit: number
) {
  const timePoints = Object.keys(timeSeriesData)
    .sort()
    .slice(-limit)
    .reverse();

  const prices = timePoints.map(time => {
    const price = parseFloat(timeSeriesData[time]['4. close']);
    return isNaN(price) ? 0 : price;
  });

  const labels = timePoints.map(time => formatTimeLabel(time, timeRange));

  return { labels, prices };
}

function formatTimeLabel(time: string, timeRange: TimeRange): string {
  const date = new Date(time);
  
  switch (timeRange) {
    case '1D':
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    case '1W':
      return date.toLocaleString('en-US', { 
        weekday: 'short',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    case '1M':
    case '3M':
      return date.toLocaleDateString('en-US', { 
        month: 'short',
        day: 'numeric'
      });
    case '1Y':
    case 'ALL':
      return date.toLocaleDateString('en-US', { 
        year: 'numeric',
        month: 'short'
      });
    default:
      return time;
  }
}

function generatePredictions(prices: number[]): number[] {
  if (prices.length < 2) return [];

  const lastPrice = prices[prices.length - 1];
  const priceChange = lastPrice - prices[prices.length - 2];
  const volatility = Math.abs(priceChange / lastPrice);
  
  return Array.from({ length: 10 }, (_, i) => {
    const randomFactor = 1 + (Math.random() - 0.5) * volatility * 2;
    const trendFactor = 1 + (priceChange > 0 ? 0.001 : -0.001) * (i + 1);
    return Number((lastPrice * randomFactor * trendFactor).toFixed(2));
  });
}

// User Settings API
export async function getUserSettings() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching user settings:', error);
    throw error;
  }
}

export async function updateUserSettings(settings: Partial<{
  theme: string;
  notifications: any;
  trading_preferences: any;
  security_settings: any;
}>) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('user_settings')
      .update(settings)
      .eq('user_id', user.id);

    if (error) throw error;
    toast.success('Settings updated successfully');
  } catch (error) {
    console.error('Error updating user settings:', error);
    throw error;
  }
}

// Trading History API
export async function getTradingHistory() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('trading_history')
      .select('*')
      .eq('user_id', user.id)
      .order('executed_at', { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching trading history:', error);
    throw error;
  }
}

export async function addTrade(trade: {
  symbol: string;
  type: string;
  price: number;
  quantity: number;
  profit_loss?: number;
}) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('trading_history')
      .insert([{ ...trade, user_id: user.id }]);

    if (error) throw error;
    toast.success('Trade recorded successfully');
  } catch (error) {
    console.error('Error adding trade:', error);
    throw error;
  }
}

// Notifications API
export async function getNotifications() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching notifications:', error);
    throw error;
  }
}

export async function markNotificationAsRead(id: string) {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
}

export async function markAllNotificationsAsRead() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', user.id)
      .eq('read', false);

    if (error) throw error;
    toast.success('All notifications marked as read');
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
}

export async function deleteNotification(id: string) {
  try {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting notification:', error);
    throw error;
  }
}

export async function deleteAllNotifications() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('user_id', user.id);

    if (error) throw error;
    toast.success('All notifications cleared');
  } catch (error) {
    console.error('Error clearing notifications:', error);
    throw error;
  }
}