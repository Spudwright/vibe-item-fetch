import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { barcode } = await req.json();

    if (!barcode || !/^\d{12,13}$/.test(barcode)) {
      return new Response(
        JSON.stringify({ error: "Invalid barcode format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // UPCitemdb free API (100 requests/day, no key needed)
    const response = await fetch(`https://api.upcitemdb.com/prod/trial/lookup?upc=${barcode}`, {
      headers: { "Accept": "application/json" },
    });

    if (!response.ok) {
      // Rate limited or error — fall back gracefully
      return new Response(
        JSON.stringify({ found: false, barcode }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();

    if (data.items && data.items.length > 0) {
      const item = data.items[0];
      return new Response(
        JSON.stringify({
          found: true,
          barcode,
          title: item.title || null,
          brand: item.brand || null,
          category: item.category || null,
          description: item.description || null,
          size: item.size || null,
          images: item.images?.slice(0, 1) || [],
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ found: false, barcode }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("UPC lookup error:", error);
    return new Response(
      JSON.stringify({ found: false, error: "Lookup failed" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
