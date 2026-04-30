// Robot.com (Kiwibot) webhook receiver.
// Path: /functions/v1/robot-webhook/<secret>
// Robot.com posts every state/step change here. We:
//   1. Verify the path secret
//   2. Insert into robot_webhook_events (unique constraint dedupes retries)
//   3. Map the trigger to our internal robot_status on the pickup row
//   4. Return 200 fast so Robot.com doesn't retry

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const ROBOT_API_BASE_URL = Deno.env.get("ROBOT_API_BASE_URL") ?? "https://remi.kiwi/api/v2/jobs";
const ROBOT_API_KEY = Deno.env.get("ROBOT_API_KEY") ?? "";
const ROBOT_WEBHOOK_SECRET = Deno.env.get("ROBOT_WEBHOOK_SECRET") ?? "";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

interface RobotWebhookBody {
  job_id: string;
  trigger: string;
  step_type?: string;
  next_success_step_type?: string;
  point_id?: string;
  point_name?: string;
  data: {
    completion_time?: string;
    step_duration?: string;
    external_id: string;
    location_id?: string;
    [k: string]: unknown;
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  // Path: /functions/v1/robot-webhook/<secret>
  const url = new URL(req.url);
  const segments = url.pathname.split("/").filter(Boolean);
  const providedSecret = segments[segments.length - 1] ?? "";

  if (!ROBOT_WEBHOOK_SECRET || providedSecret !== ROBOT_WEBHOOK_SECRET) {
    return json({ error: "Unauthorized" }, 401);
  }

  let body: RobotWebhookBody;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  if (!body?.job_id || !body?.trigger || !body?.data?.external_id) {
    return json({ error: "Missing required fields" }, 400);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  const pickupId = body.data.external_id;

  // Insert event log; unique constraint handles dedup. We don't fail the
  // webhook if the dedup fires — that just means Robot.com is retrying.
  const { error: insertErr } = await supabase.from("robot_webhook_events").insert({
    pickup_id: pickupId,
    job_id: body.job_id,
    trigger: body.trigger,
    step_type: body.step_type ?? null,
    next_success_step_type: body.next_success_step_type ?? null,
    point_id: body.point_id ?? null,
    point_name: body.point_name ?? null,
    payload: body,
  });

  // 23505 = unique_violation = duplicate event, expected on retries.
  const isDuplicate =
    insertErr && (insertErr as { code?: string }).code === "23505";
  if (insertErr && !isDuplicate) {
    console.error("webhook: event insert failed", insertErr);
    // Still try to update the pickup so the user UI doesn't lag.
  }

  if (isDuplicate) {
    return json({ received: true, duplicate: true });
  }

  // Map trigger -> robot_status on the pickup row.
  const update: Record<string, unknown> = {};
  switch (body.trigger) {
    case "created":
      update.robot_status = "created";
      break;
    case "assigned": {
      update.robot_status = "assigned";
      // Fetch assigned bot details so we can show worker_id + battery in the UI.
      try {
        const botResp = await fetch(`${ROBOT_API_BASE_URL}/${body.job_id}/bot`, {
          headers: { "x-api-key": ROBOT_API_KEY },
        });
        if (botResp.ok) {
          const bot = await botResp.json();
          if (typeof bot.worker_id === "string") update.robot_bot_id = bot.worker_id;
          if (typeof bot.battery === "number") update.robot_battery = bot.battery;
          if (typeof bot.lat === "number") update.robot_last_lat = bot.lat;
          if (typeof bot.lon === "number") update.robot_last_lng = bot.lon;
          if (typeof bot.door_status === "string") update.robot_door_status = bot.door_status;
        }
      } catch (e) {
        console.error("webhook: bot fetch failed", e);
      }
      break;
    }
    case "arrived":
      if (body.next_success_step_type === "load") {
        update.robot_status = "at_pickup";
      } else if (body.next_success_step_type === "unload") {
        update.robot_status = "at_dropoff";
      } else {
        update.robot_status = "en_route";
      }
      break;
    case "loaded":
      update.robot_status = "loaded";
      break;
    case "unloaded":
      update.robot_status = "delivered";
      update.robot_completed_at = new Date().toISOString();
      break;
    case "cancelled":
      update.robot_status = "cancelled";
      break;
    case "panic":
      update.robot_status = "failed";
      break;
    default:
      console.log("webhook: unknown trigger, ignoring", body.trigger);
      break;
  }

  if (Object.keys(update).length > 0) {
    const { error: updateErr } = await supabase
      .from("pickups")
      .update(update)
      .eq("id", pickupId);
    if (updateErr) console.error("webhook: pickup update failed", updateErr);
  }

  return json({ received: true });
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
