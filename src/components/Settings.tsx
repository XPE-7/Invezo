import React, { useState, useEffect } from 'react';
import { ArrowLeft, Bell, Moon, Sun, Globe, Lock, Shield, Save, Loader2 } from 'lucide-react';
import { getUserSettings, updateUserSettings } from '../lib/api';
import toast from 'react-hot-toast';

interface SettingsProps {
  onClose: () => void;
  isDark: boolean;
  onThemeChange: (isDark: boolean) => void;
}

export function Settings({ onClose, isDark, onThemeChange }: SettingsProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notifications, setNotifications] = useState({
    priceAlerts: true,
    newsUpdates: true,
    marketSummary: false,
    watchlistAlerts: true,
  });

  const [preferences, setPreferences] = useState({
    defaultTimeRange: '1D',
    autoRefresh: true,
    showPredictions: true,
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const settings = await getUserSettings();
      if (settings) {
        setNotifications(settings.notifications || notifications);
        setPreferences(settings.trading_preferences || preferences);
      }
    } catch (error) {
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateUserSettings({
        theme: isDark ? 'dark' : 'light',
        notifications,
        trading_preferences: preferences,
      });
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50">
        <div className="fixed inset-x-0 top-0 bottom-0 md:inset-x-auto md:left-auto md:right-4 md:top-20 md:bottom-4 md:w-[400px] bg-card rounded-lg shadow-lg border border-border flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50">
      <div className="fixed inset-x-0 top-0 bottom-0 md:inset-x-auto md:left-auto md:right-4 md:top-20 md:bottom-4 md:w-[400px] bg-card rounded-lg shadow-lg border border-border flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center space-x-2">
            <h2 className="text-lg font-semibold">Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-accent rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="p-4 space-y-6">
            <section className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground">Appearance</h3>
              <div className="flex items-center justify-between p-3 bg-accent/50 rounded-lg">
                <div className="flex items-center space-x-3">
                  {isDark ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                  <span>Dark Mode</span>
                </div>
                <button
                  onClick={() => onThemeChange(!isDark)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    isDark ? 'bg-primary' : 'bg-muted'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      isDark ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground">Notifications</h3>
              <div className="space-y-3">
                {Object.entries(notifications).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between p-3 bg-accent/50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Bell className="h-5 w-5" />
                      <span>{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</span>
                    </div>
                    <button
                      onClick={() => setNotifications(prev => ({ ...prev, [key]: !value }))}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        value ? 'bg-primary' : 'bg-muted'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          value ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground">Trading Preferences</h3>
              <div className="space-y-3">
                <div className="p-3 bg-accent/50 rounded-lg">
                  <label className="block text-sm mb-2">Default Time Range</label>
                  <select
                    value={preferences.defaultTimeRange}
                    onChange={(e) => setPreferences(prev => ({ ...prev, defaultTimeRange: e.target.value }))}
                    className="w-full px-3 py-2 bg-background border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="1D">1 Day</option>
                    <option value="1W">1 Week</option>
                    <option value="1M">1 Month</option>
                    <option value="3M">3 Months</option>
                    <option value="1Y">1 Year</option>
                    <option value="ALL">All Time</option>
                  </select>
                </div>

                <div className="flex items-center justify-between p-3 bg-accent/50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Globe className="h-5 w-5" />
                    <span>Auto Refresh</span>
                  </div>
                  <button
                    onClick={() => setPreferences(prev => ({ ...prev, autoRefresh: !prev.autoRefresh }))}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      preferences.autoRefresh ? 'bg-primary' : 'bg-muted'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        preferences.autoRefresh ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between p-3 bg-accent/50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Shield className="h-5 w-5" />
                    <span>Show Predictions</span>
                  </div>
                  <button
                    onClick={() => setPreferences(prev => ({ ...prev, showPredictions: !prev.showPredictions }))}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      preferences.showPredictions ? 'bg-primary' : 'bg-muted'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        preferences.showPredictions ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground">Security</h3>
              <div className="p-3 bg-accent/50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Lock className="h-5 w-5" />
                    <span>Two-Factor Authentication</span>
                  </div>
                  <button
                    onClick={() => toast.error('2FA setup coming soon!')}
                    className="px-3 py-1 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    Setup
                  </button>
                </div>
              </div>
            </section>
          </div>
        </div>

        <div className="p-4 border-t border-border">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Save className="h-5 w-5" />
            )}
            <span>{saving ? 'Saving...' : 'Save Settings'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}