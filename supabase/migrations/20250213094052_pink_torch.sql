/*
  # Add user features

  1. Changes
    - Add settings column to profiles table
    - Add notifications column to profiles table
    - Add trading_history column to profiles table

  2. Description
    This migration adds JSON columns to store user settings, notifications,
    and trading history data. Using JSON columns allows for flexible schema
    evolution without requiring additional migrations.
*/

-- Add new columns to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS settings jsonb DEFAULT NULL,
ADD COLUMN IF NOT EXISTS notifications jsonb DEFAULT NULL,
ADD COLUMN IF NOT EXISTS trading_history jsonb DEFAULT NULL;

-- Update RLS policies
CREATE POLICY "Users can update own settings"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);