-- Atomic promo code redemption RPC
--
-- Replaces the two-step REST check + increment in /api/redeem/route.ts.
-- All validation, the promo code increment, and the profile upgrade happen
-- inside one transaction under a row-level lock, so concurrent requests
-- for the same code are serialized — the TOCTOU race is eliminated.
--
-- Returns: {"ok": true}
--          {"ok": false, "reason": "not_found" | "inactive" | "exhausted" | "already_redeemed"}
--
-- The reason is logged server-side but never sent to the client (enumeration
-- prevention is handled in route.ts — all failures return the same generic message).
--
-- Apply via Supabase dashboard → SQL Editor, or `supabase db push`.

CREATE OR REPLACE FUNCTION redeem_promo_code(
  p_code    TEXT,
  p_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_promo RECORD;
BEGIN
  -- Lock the row for the duration of this transaction.
  -- A second concurrent call with the same code will block here until we commit,
  -- then re-read the updated used_count and fail the exhaustion check if needed.
  SELECT *
  INTO   v_promo
  FROM   promo_codes
  WHERE  code = upper(p_code)
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'not_found');
  END IF;

  IF NOT v_promo.active THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'inactive');
  END IF;

  IF NOT v_promo.reusable
     AND v_promo.used_count >= COALESCE(v_promo.max_uses, 1)
  THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'exhausted');
  END IF;

  IF p_user_id = ANY(COALESCE(v_promo.redeemed_by, ARRAY[]::UUID[])) THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'already_redeemed');
  END IF;

  -- All checks passed — apply changes atomically.
  UPDATE promo_codes
  SET
    used_count  = used_count + 1,
    redeemed_by = array_append(COALESCE(redeemed_by, ARRAY[]::UUID[]), p_user_id)
  WHERE code = upper(p_code);

  UPDATE profiles
  SET plan = 'pro'
  WHERE id = p_user_id;

  RETURN jsonb_build_object('ok', true);
END;
$$;

-- Revoke public execute access; the function is called exclusively via
-- the service role from the server (SECURITY DEFINER handles authorization).
REVOKE EXECUTE ON FUNCTION redeem_promo_code(TEXT, UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION redeem_promo_code(TEXT, UUID) FROM anon;
REVOKE EXECUTE ON FUNCTION redeem_promo_code(TEXT, UUID) FROM authenticated;
