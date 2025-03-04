/*
  # Create watchlist tables

  1. New Tables
    - `watchlists`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `name` (text)
      - `created_at` (timestamp)
    - `watchlist_items`
      - `id` (uuid, primary key)
      - `watchlist_id` (uuid, references watchlists)
      - `symbol` (text)
      - `added_at` (timestamp)
      - `initial_price` (numeric)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users
*/

-- Create watchlists table
CREATE TABLE IF NOT EXISTS watchlists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create watchlist items table
CREATE TABLE IF NOT EXISTS watchlist_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  watchlist_id uuid REFERENCES watchlists(id) ON DELETE CASCADE NOT NULL,
  symbol text NOT NULL,
  added_at timestamptz DEFAULT now(),
  initial_price numeric NOT NULL,
  UNIQUE(watchlist_id, symbol)
);

-- Enable RLS
ALTER TABLE watchlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE watchlist_items ENABLE ROW LEVEL SECURITY;

-- Policies for watchlists
CREATE POLICY "Users can create their own watchlists"
  ON watchlists
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own watchlists"
  ON watchlists
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own watchlists"
  ON watchlists
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own watchlists"
  ON watchlists
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policies for watchlist items
CREATE POLICY "Users can add items to their watchlists"
  ON watchlist_items
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM watchlists
      WHERE id = watchlist_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view items in their watchlists"
  ON watchlist_items
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM watchlists
      WHERE id = watchlist_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update items in their watchlists"
  ON watchlist_items
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM watchlists
      WHERE id = watchlist_id
      AND user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM watchlists
      WHERE id = watchlist_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete items from their watchlists"
  ON watchlist_items
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM watchlists
      WHERE id = watchlist_id
      AND user_id = auth.uid()
    )
  );