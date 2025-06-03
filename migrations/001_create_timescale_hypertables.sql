-- Enable TimescaleDB extension
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- Create hypertable for activities (time-series data)
-- This should be run after the initial schema migration
SELECT create_hypertable('activities', 'timestamp', 
  chunk_time_interval => INTERVAL '1 day',
  if_not_exists => TRUE
);

-- Create indexes optimized for time-series queries
CREATE INDEX IF NOT EXISTS activities_work_day_time_idx 
ON activities (work_day_id, timestamp DESC);

CREATE INDEX IF NOT EXISTS activities_driver_time_idx 
ON activities (work_day_id, activity_type, timestamp DESC);

CREATE INDEX IF NOT EXISTS activities_location_time_idx 
ON activities (latitude, longitude, timestamp DESC);

-- Add compression policy for data older than 7 days
SELECT add_compression_policy('activities', INTERVAL '7 days', if_not_exists => TRUE);

-- Add retention policy for data older than 2 years (optional)
-- SELECT add_retention_policy('activities', INTERVAL '2 years', if_not_exists => TRUE);

-- Create continuous aggregates for common analytics queries
CREATE MATERIALIZED VIEW IF NOT EXISTS daily_activity_summary
WITH (timescaledb.continuous) AS
SELECT 
  time_bucket('1 day', timestamp) AS day,
  work_day_id,
  activity_type,
  COUNT(*) as activity_count,
  AVG(EXTRACT(EPOCH FROM (timestamp - LAG(timestamp) OVER (PARTITION BY work_day_id ORDER BY timestamp)))) as avg_time_between_activities
FROM activities 
WHERE cancelled = false
GROUP BY day, work_day_id, activity_type
WITH NO DATA;

-- Refresh policy for the continuous aggregate
SELECT add_continuous_aggregate_policy('daily_activity_summary',
  start_offset => INTERVAL '3 days',
  end_offset => INTERVAL '1 hour',
  schedule_interval => INTERVAL '1 hour',
  if_not_exists => TRUE
);

-- Create a view for cycle time analysis
CREATE OR REPLACE VIEW cycle_time_analysis AS
SELECT 
  w.id as work_day_id,
  w.driver_id,
  w.truck_id,
  w.job_id,
  a1.timestamp as load_start,
  a4.timestamp as dump_complete,
  EXTRACT(EPOCH FROM (a4.timestamp - a1.timestamp))/60 as cycle_time_minutes,
  a1.load_number
FROM work_days w
JOIN activities a1 ON w.id = a1.work_day_id AND a1.activity_type = 'arrived_at_load_site' AND a1.cancelled = false
JOIN activities a4 ON w.id = a4.work_day_id AND a4.activity_type = 'dumped_material' AND a4.cancelled = false AND a4.load_number = a1.load_number
ORDER BY a1.timestamp;

-- Create indexes for the cycle time analysis
CREATE INDEX IF NOT EXISTS activities_load_analysis_idx 
ON activities (work_day_id, load_number, activity_type, timestamp) 
WHERE cancelled = false;