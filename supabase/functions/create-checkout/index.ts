import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const body = await req.json().catch(() => ({}));
    const kind = body?.kind === "reading_unlock" ? "reading_unlock" : "academy";

    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    }

    let session: Stripe.Checkout.Session;

    if (kind === "reading_unlock") {
      const readingId = typeof body?.readingId === "string" ? body.readingId : "";
      if (!readingId) {
        throw new Error("readingId is required");
      }

      const { data: reading, error: readingError } = await supabaseClient
        .from("cosmic_readings")
        .select("id, unlock_status")
        .eq("id", readingId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (readingError) throw readingError;
      if (!reading) throw new Error("Reading not found");
      if (reading.unlock_status === "unlocked") {
        return new Response(JSON.stringify({ url: null, alreadyUnlocked: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      const priceId = Deno.env.get("STRIPE_READING_PRICE_ID");
      if (!priceId) {
        throw new Error("STRIPE_READING_PRICE_ID is not set");
      }

      session = await stripe.checkout.sessions.create({
        customer: customerId,
        customer_email: customerId ? undefined : user.email,
        line_items: [{ price: priceId, quantity: 1 }],
        mode: "payment",
        metadata: {
          kind,
          reading_id: readingId,
          user_id: user.id,
        },
        success_url: `${req.headers.get("origin")}/?checkout=success&reading_id=${readingId}`,
        cancel_url: `${req.headers.get("origin")}/?reading_id=${readingId}`,
      });

      await supabaseClient
        .from("cosmic_readings")
        .update({ stripe_checkout_session_id: session.id, stripe_customer_id: customerId ?? null })
        .eq("id", readingId)
        .eq("user_id", user.id);
    } else {
      session = await stripe.checkout.sessions.create({
        customer: customerId,
        customer_email: customerId ? undefined : user.email,
        line_items: [
          {
            price: "price_1T341pApODHiQWcAAJuwsML9",
            quantity: 1,
          },
        ],
        mode: "subscription",
        metadata: {
          kind,
          user_id: user.id,
        },
        success_url: `${req.headers.get("origin")}/academy?success=true`,
        cancel_url: `${req.headers.get("origin")}/academy`,
      });
    }

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
