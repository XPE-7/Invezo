import React, { useState } from 'react';
import { User } from '@supabase/supabase-js';
import { Settings, History, Bell, HelpCircle, LogOut, ExternalLink, ChevronRight, Bot } from 'lucide-react';
import toast from 'react-hot-toast';
import { Settings as SettingsComponent } from './Settings';
import { TradingHistory } from './TradingHistory';
import { Notifications } from './Notifications';
import { AIChat } from './AIChat';

interface UserProfileProps {
  user: User;
  onClose: () => void;
  onSignOut: () => Promise<void>;
  isDark: boolean;
  onThemeChange: (isDark: boolean) => void;
}

export function UserProfile({ user, onClose, onSignOut, isDark, onThemeChange }: UserProfileProps) {
  const [activeComponent, setActiveComponent] = useState<string | null>(null);

  const handleMenuClick = (action: string) => {
    setActiveComponent(action);
    onClose(); // Close the profile dropdown when opening a feature
  };

  const handleCloseComponent = () => {
    setActiveComponent(null);
  };

  return (
    <>
      <div 
        className="absolute right-0 top-12 w-80 bg-card rounded-lg shadow-lg border border-border p-4 animate-slide-up z-50"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center space-x-3 p-2 border-b border-border pb-4">
          <img
            src={user.user_metadata.avatar_url}
            alt={user.user_metadata.full_name}
            className="w-12 h-12 rounded-full border-2 border-primary"
          />
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-card-foreground truncate">
              {user.user_metadata.full_name}
            </h3>
            <p className="text-sm text-muted-foreground truncate">{user.email}</p>
          </div>
        </div>

        <div className="mt-2 space-y-1">
          <button
            onClick={() => handleMenuClick('settings')}
            className="w-full flex items-center justify-between px-3 py-2 text-sm text-card-foreground hover:bg-accent rounded-lg transition-all duration-300 group"
          >
            <div className="flex items-center space-x-3">
              <Settings className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              <span>Settings</span>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </button>

          <button
            onClick={() => handleMenuClick('history')}
            className="w-full flex items-center justify-between px-3 py-2 text-sm text-card-foreground hover:bg-accent rounded-lg transition-all duration-300 group"
          >
            <div className="flex items-center space-x-3">
              <History className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              <span>Trading History</span>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </button>

          <button
            onClick={() => handleMenuClick('notifications')}
            className="w-full flex items-center justify-between px-3 py-2 text-sm text-card-foreground hover:bg-accent rounded-lg transition-all duration-300 group"
          >
            <div className="flex items-center space-x-3">
              <Bell className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              <span>Notifications</span>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </button>

          <button
            onClick={() => handleMenuClick('ai-chat')}
            className="w-full flex items-center justify-between px-3 py-2 text-sm text-card-foreground hover:bg-accent rounded-lg transition-all duration-300 group"
          >
            <div className="flex items-center space-x-3">
              <Bot className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              <span>AI Trading Assistant</span>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </button>

          <button
            onClick={() => handleMenuClick('help')}
            className="w-full flex items-center justify-between px-3 py-2 text-sm text-card-foreground hover:bg-accent rounded-lg transition-all duration-300 group"
          >
            <div className="flex items-center space-x-3">
              <HelpCircle className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              <span>Help & Support</span>
            </div>
            <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </button>

          <div className="pt-2 mt-2 border-t border-border">
            <button
              onClick={onSignOut}
              className="w-full flex items-center justify-between px-3 py-2 text-sm text-destructive hover:bg-destructive/10 rounded-lg transition-all duration-300 group"
            >
              <div className="flex items-center space-x-3">
                <LogOut className="h-4 w-4" />
                <span>Sign Out</span>
              </div>
            </button>
          </div>
        </div>

        <button
          onClick={onClose}
          className="absolute top-2 right-2 p-1 rounded-full text-muted-foreground hover:text-card-foreground hover:bg-accent/50 transition-colors"
        >
          <span className="sr-only">Close</span>
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Render active component */}
      {activeComponent === 'settings' && (
        <SettingsComponent
          onClose={handleCloseComponent}
          isDark={isDark}
          onThemeChange={onThemeChange}
        />
      )}

      {activeComponent === 'history' && (
        <TradingHistory onClose={handleCloseComponent} />
      )}

      {activeComponent === 'notifications' && (
        <Notifications onClose={handleCloseComponent} />
      )}

      {activeComponent === 'ai-chat' && (
        <AIChat onClose={handleCloseComponent} />
      )}
    </>
  );
}