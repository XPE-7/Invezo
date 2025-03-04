import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';
import toast from 'react-hot-toast';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  toast.error('Configuration error. Please check your environment variables.');
  throw new Error('Missing Supabase environment variables');
}

// Custom error handler to prevent empty error objects
const customErrorHandler = (error: any) => {
  if (error && Object.keys(error).length > 0) {
    console.error('Supabase error:', error);
  }
};

export const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    debug: false,
    storage: {
      getItem: (key) => {
        try {
          return Promise.resolve(localStorage.getItem(key));
        } catch (error) {
          customErrorHandler(error);
          return Promise.resolve(null);
        }
      },
      setItem: (key, value) => {
        try {
          localStorage.setItem(key, value);
          return Promise.resolve();
        } catch (error) {
          customErrorHandler(error);
          return Promise.resolve();
        }
      },
      removeItem: (key) => {
        try {
          localStorage.removeItem(key);
          return Promise.resolve();
        } catch (error) {
          customErrorHandler(error);
          return Promise.resolve();
        }
      },
    },
  },
  global: {
    headers: {
      'X-Client-Info': 'invezo-web',
    },
  },
});

// Utility function to check if an error is a meaningful error object
const isValidError = (error: any): boolean => {
  return error && (
    error.message ||
    error.error_description ||
    error.statusText ||
    error.code ||
    error.status
  );
};

// Add auth state change listener for debugging and error handling
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_OUT') {
    localStorage.removeItem('termsAccepted');
    // Clear any user-specific data from localStorage
    localStorage.clear();
    // Reload the page to reset the application state
    window.location.reload();
  }

  // Handle auth errors
  if (event === 'USER_DELETED') {
    toast.error('Your session has ended. Please sign in again.');
  }
});

// Add network error detection and handling
let isOnline = true;
let networkCheckInterval: number | null = null;

const checkConnection = async () => {
  try {
    const response = await fetch('/favicon.ico', {
      method: 'HEAD',
      cache: 'no-cache',
    });
    if (response.ok && !isOnline) {
      isOnline = true;
      toast.success('Connection restored');
      // Attempt to refresh the session
      try {
        await supabase.auth.getSession();
      } catch (error) {
        if (isValidError(error)) {
          customErrorHandler(error);
        }
      }
    }
  } catch (error) {
    if (isOnline) {
      isOnline = false;
      toast.error('Network connection lost');
    }
  }
};

// Handle online status
window.addEventListener('online', () => {
  if (!isOnline) {
    checkConnection();
  }
  if (networkCheckInterval) {
    window.clearInterval(networkCheckInterval);
    networkCheckInterval = null;
  }
});

// Handle offline status
window.addEventListener('offline', () => {
  isOnline = false;
  toast.error('Network connection lost');
  // Start polling for connection recovery
  if (!networkCheckInterval) {
    networkCheckInterval = window.setInterval(checkConnection, 5000);
  }
});

// Initial connection check
checkConnection();

// Clean up on page unload
window.addEventListener('unload', () => {
  if (networkCheckInterval) {
    window.clearInterval(networkCheckInterval);
  }
});

export type Profile = {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string;
  created_at: string;
};