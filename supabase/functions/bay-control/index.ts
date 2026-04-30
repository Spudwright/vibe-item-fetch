// Open or close a Robot.com bot's cargo bay door for a given CanDo pickup.
// POST { pickup_id, action: 'open' | 'close' }
//
// Calls Robot.com's external_id endpoint so we don't need to hold the
// Robot.com job_id at the call site. Retries once on 423 ("Door stalled")
// after waiting the Retry-After value.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const ROBOT_API_BASE_URL = Deno.env.get("ROBOT_API_BASE_URL") ?? "https://remi.kiwi/api/v2/jobs";
const ROBOT_API_KEY = Deno.env.get("ROBOT_API_KEY") ?? "";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  try {
    const { pickup_id, action } = await req.json();
    if (!pickup_id || (action !== "open" && action !== "close")) {
      return json({ error: "Need pickup_id and action='open'|'close'" }, 400);
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    // Use external_id endpoint so we don't have to look up robot_job_id ourselves;
    // Robot.com resolves it from external_id = pickup.id.
    const path = action === "open" ? "open-door" : "close-door";
    const url = `${ROBOT_API_BASE_URL}/external/${encodeURIComponent(pickup_id)}/${path}`;

    const callRobot = () =>
      fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": ROBOT_API_KEY,
        },
      });

    let resp = await callRobot();

    // 423 = door stalled. Wait Retry-After seconds and try once more.
    if (resp.status === 423) {
      const retryAfterRaw = resp.headers.get("Retry-After");
      const retryAfterSec = Number.parseInt(retryAfterRaw ?? "30", 10);
      const waitMs = (Number.isFinite(retryAfterSec) ? retryAfterSec : 30) * 1000;
      await new Promise((r) => setTimeout(r, waitMs));
      resp = await callRobot();
    }

    const payload = await resp.json().catch(() => ({}));

    if (!resp.ok) {
      console.error("bay-control failed", resp.status, payload);
      return json({ error: "Robot.com error", status: resp.status, details: payload }, 502);
    }

    // Open/close response uses "lon" not "lng" — capture it correctly.
    const update: Record<string, unknown> = {};
    if (typeof payload.door_status === "string") update.robot_door_status = payload.door_status;
    if (typeof payload.worker_id === "string") update.robot_bot_id = payload.worker_id;
    if (typeof payload.lat === "number") update.robot_last_lat = payload.lat;
    if (typeof payload.lon === "number") update.robot_last_lng = payload.lon;
    if (typeof payload.battery === "number") update.robot_battery = payload.battery;

    if (Object.keys(update).length > 0) {
      const { error: updateErr } = await supabase
        .from("pickups")
        .update(update)
        .eq("id", pickup_id);
      if (updateErr) console.error("bay-control: pickup update failed", updateErr);
    }

    return json({ ok: true, action, ...payload });
  } catch (e) {
    console.error("bay-control error", e);
    return json({ error: "Unexpected error", details: String(e) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
