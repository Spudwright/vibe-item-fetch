// Dispatch a CanDo pickup to a Robot.com (Kiwibot) bot.
// POST { pickup_id } -> creates a Robot.com job with external_id = pickup_id,
// stores the returned job id + tracker URL on the pickup row.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const ROBOT_API_BASE_URL = Deno.env.get("ROBOT_API_BASE_URL") ?? "https://remi.kiwi/api/v2/jobs";
const ROBOT_API_KEY = Deno.env.get("ROBOT_API_KEY") ?? "";
const ROBOT_PARTNER_ID = Deno.env.get("ROBOT_PARTNER_ID") ?? "";
// TODO(prod): swap to LA County location_id once Andrés provides one.
// For now the sandbox San Jose location_id is used so dispatches succeed against the test bot.
const ROBOT_LOCATION_ID = Deno.env.get("ROBOT_LOCATION_ID") ?? "";
const ROBOT_WEBHOOK_SECRET = Deno.env.get("ROBOT_WEBHOOK_SECRET") ?? "";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

// Hardcoded LA County redemption center stub. Real geocoding + dynamic
// center selection comes in a later phase.
const DROPOFF = {
  name: "rePlanet South LA",
  lat: 34.0034,
  lng: -118.3376,
  street: "3370 W Slauson Ave",
  city: "Los Angeles",
  state: "CA",
  postal_code: "90043",
  country: "USA",
};

// Sandbox-only fallback for the pickup point. Real dispatches will pull
// pickup_lat/pickup_lng from the pickup row once geocoding is wired up.
const SANDBOX_PICKUP_FALLBACK = { lat: 37.35511, lng: -121.89985 };

interface PickupItem {
  description?: string;
  materialType?: string;
  sizeOz?: number;
  quantity?: number;
  barcode?: string | null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  try {
    const { pickup_id } = await req.json();
    if (!pickup_id || typeof pickup_id !== "string") {
      return json({ error: "Missing pickup_id" }, 400);
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    const { data: pickup, error: fetchErr } = await supabase
      .from("pickups")
      .select("*, profiles(full_name, email)")
      .eq("id", pickup_id)
      .single();

    if (fetchErr || !pickup) {
      return json({ error: "Pickup not found", details: fetchErr?.message }, 404);
    }

    if (pickup.robot_job_id) {
      return json({
        already_dispatched: true,
        robot_job_id: pickup.robot_job_id,
        tracker_url: pickup.robot_tracker_url,
      });
    }

    const items: PickupItem[] = Array.isArray(pickup.items) ? pickup.items : [];
    const totalQty = items.reduce((s, it) => s + (it.quantity ?? 0), 0);
    const consumer = {
      name: pickup.profiles?.full_name ?? "CanDo User",
      email: pickup.profiles?.email ?? "noreply@cando.app",
      phone_number: "+1 213 555 5555",
    };

    const webhookUrl = `${SUPABASE_URL}/functions/v1/robot-webhook/${ROBOT_WEBHOOK_SECRET}`;

    const pickupLat = pickup.pickup_lat ?? SANDBOX_PICKUP_FALLBACK.lat;
    const pickupLng = pickup.pickup_lng ?? SANDBOX_PICKUP_FALLBACK.lng;

    const body = {
      partner_id: ROBOT_PARTNER_ID,
      location_id: ROBOT_LOCATION_ID,
      external_id: pickup.id,
      draft: false,
      points: [
        {
          external_id: "pick",
          name: "CanDo pickup",
          lat: pickupLat,
          lng: pickupLng,
          tags: ["pickup"],
          meta: {
            street: pickup.pickup_address ?? "",
            city: "Los Angeles",
            state: "CA",
            country: "USA",
            postal_code: "",
          },
        },
        {
          external_id: "drop",
          name: DROPOFF.name,
          lat: DROPOFF.lat,
          lng: DROPOFF.lng,
          tags: ["dropoff"],
          contact_comment: `CanDo recycling drop — ${totalQty} item(s)`,
          meta: {
            street: DROPOFF.street,
            city: DROPOFF.city,
            state: DROPOFF.state,
            country: DROPOFF.country,
            postal_code: DROPOFF.postal_code,
          },
        },
      ],
      packages: [
        {
          name: "Recycling batch",
          dimensions: { length: 30, width: 20, height: 15 },
          items: items.map((it) => ({
            quantity: it.quantity ?? 1,
            asset: {
              use: {
                name: `${it.materialType ?? "container"} (${it.sizeOz ?? 12}oz)`,
                weight: 14,
                dimensions: { length: 12, width: 6, height: 6 },
              },
            },
          })),
          meta: { price: pickup.estimated_crv ?? 0 },
        },
      ],
      consumer,
      default_webhook: webhookUrl,
      tags: ["cando", "recycling-pickup"],
    };

    const robotResp = await fetch(ROBOT_API_BASE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ROBOT_API_KEY,
      },
      body: JSON.stringify(body),
    });

    const robotPayload = await robotResp.json();

    if (!robotResp.ok) {
      console.error("Robot.com job creation failed", robotResp.status, robotPayload);
      return json(
        { error: "Robot.com rejected job", status: robotResp.status, details: robotPayload },
        502,
      );
    }

    const { error: updateErr } = await supabase
      .from("pickups")
      .update({
        robot_job_id: robotPayload.id,
        robot_status: "created",
        robot_tracker_url: robotPayload.trackerURL ?? null,
        robot_dispatched_at: new Date().toISOString(),
      })
      .eq("id", pickup.id);

    if (updateErr) {
      console.error("Failed to update pickup with robot job info", updateErr);
      return json({ error: "DB update failed", details: updateErr.message }, 500);
    }

    return json({
      ok: true,
      robot_job_id: robotPayload.id,
      tracker_url: robotPayload.trackerURL,
      state: robotPayload.state,
    });
  } catch (e) {
    console.error("dispatch-pickup error", e);
    return json({ error: "Unexpected error", details: String(e) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
