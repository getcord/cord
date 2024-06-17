-- compatibility helpers
CREATE OR REPLACE FUNCTION public.gen_random_uuid()
    RETURNS uuid
    LANGUAGE sql
    AS 'SELECT public.uuid_generate_v4();';
-- compatibility helpers end

CREATE SCHEMA cord;

SET search_path = cord, public;

\ir schema/cord.sql
