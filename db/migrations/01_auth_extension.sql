-- Extension of the users table to store immutable identity signals
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS birth_date date,
ADD COLUMN IF NOT EXISTS birth_time time without time zone,
ADD COLUMN IF NOT EXISTS birth_location text,
ADD COLUMN IF NOT EXISTS birth_time_confidence text CHECK (birth_time_confidence IN ('EXACT', 'WINDOW', 'UNKNOWN')),
ADD COLUMN IF NOT EXISTS consent_version text;

-- Create an index on specific columns if needed for querying
CREATE INDEX IF NOT EXISTS idx_users_birth_date ON public.users(birth_date);
