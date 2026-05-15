-- ─── Wheel code pool ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS wheel_codes (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tier        text NOT NULL CHECK (tier IN ('10off', '20off', 'freeship')),
  code        text UNIQUE NOT NULL,
  assigned_to text,
  assigned_at timestamptz,
  created_at  timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS wheel_codes_tier_free_idx
  ON wheel_codes(tier) WHERE assigned_to IS NULL;

-- ─── Spin results (one row per uid, enforces one-spin-per-customer) ─────────
CREATE TABLE IF NOT EXISTS wheel_spins (
  id       uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  uid      text UNIQUE NOT NULL,
  tier     text NOT NULL,
  code     text NOT NULL,
  spun_at  timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS wheel_spins_uid_idx ON wheel_spins(uid);

-- ─── RLS ────────────────────────────────────────────────────────────────────
ALTER TABLE wheel_codes  ENABLE ROW LEVEL SECURITY;
ALTER TABLE wheel_spins  ENABLE ROW LEVEL SECURITY;

-- Service role bypasses RLS — anon gets nothing
CREATE POLICY "service_only_codes" ON wheel_codes FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_only_spins" ON wheel_spins FOR ALL USING (auth.role() = 'service_role');

-- ─── Atomic spin function ────────────────────────────────────────────────────
-- Called by /api/wheel/spin. Picks + assigns one unused code in a single
-- transaction so two concurrent spins can never receive the same code.
CREATE OR REPLACE FUNCTION assign_wheel_code(p_uid text, p_tier text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_code text;
BEGIN
  -- Block re-spins
  IF EXISTS (SELECT 1 FROM wheel_spins WHERE uid = p_uid) THEN
    RETURN json_build_object('error', 'already_spun');
  END IF;

  -- Atomically grab one unused code for this tier
  UPDATE wheel_codes
  SET assigned_to = p_uid,
      assigned_at = now()
  WHERE id = (
    SELECT id FROM wheel_codes
    WHERE tier = p_tier AND assigned_to IS NULL
    LIMIT 1
    FOR UPDATE SKIP LOCKED
  )
  RETURNING code INTO v_code;

  IF v_code IS NULL THEN
    RETURN json_build_object('error', 'no_codes_available');
  END IF;

  -- Record the spin
  INSERT INTO wheel_spins (uid, tier, code)
  VALUES (p_uid, p_tier, v_code);

  RETURN json_build_object('code', v_code, 'tier', p_tier);
END;
$$;
