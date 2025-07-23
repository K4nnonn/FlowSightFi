-- Create the plaid_data table
CREATE TABLE IF NOT EXISTS plaid_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  access_token TEXT,
  item_id TEXT,
  data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE plaid_data ENABLE ROW LEVEL SECURITY;

-- Create a policy for authenticated users to only see their own data
CREATE POLICY "Users can only see their own data" ON plaid_data
  FOR ALL USING (auth.uid()::text = user_id);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_plaid_data_user_id ON plaid_data(user_id);
CREATE INDEX IF NOT EXISTS idx_plaid_data_created_at ON plaid_data(created_at);

-- Set up automatic deletion of data older than 30 days
SELECT cron.schedule(
  'daily-retention-cleanup',
  '0 0 * * *',
  'DELETE FROM plaid_data WHERE created_at < NOW() - INTERVAL ''30 days'';'
);

-- Create retention log table for compliance tracking
CREATE TABLE IF NOT EXISTS retention_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  table_name TEXT NOT NULL,
  deleted_count INTEGER NOT NULL,
  cleanup_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create a function to log retention cleanup
CREATE OR REPLACE FUNCTION log_retention_cleanup()
RETURNS void AS $$
BEGIN
  INSERT INTO public.retention_log (
    table_name,
    deleted_count,
    cleanup_date
  )
  SELECT 
    'plaid_data',
    (SELECT COUNT(*) FROM plaid_data WHERE created_at < NOW() - INTERVAL '30 days'),
    NOW();
  
  DELETE FROM plaid_data WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Update the cron job to use the logging function
SELECT cron.unschedule('daily-retention-cleanup');
SELECT cron.schedule(
  'daily-retention-cleanup-with-log',
  '0 0 * * *',
  'SELECT log_retention_cleanup();'
);