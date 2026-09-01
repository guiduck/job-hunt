CREATE FUNCTION pg_temp.normalize_br_phone(value TEXT, country_value TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  digits TEXT;
  is_brazil BOOLEAN;
BEGIN
  IF value IS NULL OR btrim(value) = '' THEN
    RETURN NULL;
  END IF;

  digits := regexp_replace(value, '[^0-9]', '', 'g');
  is_brazil :=
    digits LIKE '55%' OR
    lower(btrim(country_value)) IN ('br', 'brazil', 'brasil');

  IF NOT is_brazil THEN
    RETURN value;
  END IF;

  IF digits NOT LIKE '55%' AND length(digits) IN (10, 11) THEN
    digits := '55' || digits;
  END IF;

  IF digits LIKE '55%' AND length(digits) = 12 AND substring(digits FROM 5 FOR 1) ~ '[6-9]' THEN
    digits := substring(digits FROM 1 FOR 4) || '9' || substring(digits FROM 5);
  END IF;

  IF digits !~ '^55[1-9][0-9]([2-5][0-9]{7}|9[0-9]{8})$' THEN
    RETURN NULL;
  END IF;

  RETURN '+' || digits;
END;
$$;

UPDATE freelance_leads
SET
  phone = pg_temp.normalize_br_phone(phone, country),
  whatsapp = pg_temp.normalize_br_phone(whatsapp, country)
WHERE
  lower(btrim(country)) IN ('br', 'brazil', 'brasil') OR
  regexp_replace(coalesce(phone, ''), '[^0-9]', '', 'g') LIKE '55%' OR
  regexp_replace(coalesce(whatsapp, ''), '[^0-9]', '', 'g') LIKE '55%';

ALTER TABLE freelance_leads
ADD CONSTRAINT freelance_leads_phone_e164_check
CHECK (phone IS NULL OR phone ~ '^\+[1-9][0-9]{7,14}$'),
ADD CONSTRAINT freelance_leads_whatsapp_e164_check
CHECK (whatsapp IS NULL OR whatsapp ~ '^\+[1-9][0-9]{7,14}$'),
ADD CONSTRAINT freelance_leads_br_phone_shape_check
CHECK (
  phone IS NULL OR
  (lower(btrim(country)) NOT IN ('br', 'brazil', 'brasil') AND phone NOT LIKE '+55%') OR
  phone ~ '^\+55[1-9][0-9]([2-5][0-9]{7}|9[0-9]{8})$'
),
ADD CONSTRAINT freelance_leads_br_whatsapp_shape_check
CHECK (
  whatsapp IS NULL OR
  (lower(btrim(country)) NOT IN ('br', 'brazil', 'brasil') AND whatsapp NOT LIKE '+55%') OR
  whatsapp ~ '^\+55[1-9][0-9]([2-5][0-9]{7}|9[0-9]{8})$'
);
