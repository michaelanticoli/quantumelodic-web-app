import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

serve(async (req) => {
  // Stripe sends POST; reject anything else
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

  if (!stripeKey) {
    logStep("ERROR", { message: "STRIPE_SECRET_KEY not set" });
    return new Response("Server config error", { status: 500 });
  }

  const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  let event: Stripe.Event;

  if (!webhookSecret) {
    logStep("ERROR", { message: "STRIPE_WEBHOOK_SECRET not set — refusing to process webhook" });
    return new Response("Webhook secret not configured", { status: 500 });
  }
  if (!signature) {
    logStep("ERROR", { message: "Missing stripe-signature header" });
    return new Response("Missing signature", { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    logStep("Signature verified", { type: event.type });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logStep("Signature verification failed", { error: msg });
    return new Response(JSON.stringify({ error: `Webhook Error: ${msg}` }), { status: 400 });
  }

  // Handle relevant events
  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        logStep("Checkout completed", {
          customer: session.customer,
          email: session.customer_email,
          subscription: session.subscription,
        });

        if (session.metadata?.kind === "reading_unlock" && session.metadata?.reading_id) {
          const { error } = await supabaseClient
            .from("cosmic_readings")
            .update({
              unlock_status: "unlocked",
              unlocked_at: new Date().toISOString(),
              stripe_checkout_session_id: session.id,
              stripe_customer_id: typeof session.customer === "string" ? session.customer : null,
            })
            .eq("id", session.metadata.reading_id)
            .eq("user_id", session.metadata.user_id ?? "");

          if (error) {
            throw error;
          }

          logStep("Reading unlocked", {
            readingId: session.metadata.reading_id,
            userId: session.metadata.user_id,
          });
        }
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        logStep("Subscription updated", {
          id: sub.id,
          status: sub.status,
          customer: sub.customer,
        });
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        logStep("Subscription cancelled", {
          id: sub.id,
          customer: sub.customer,
        });
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        logStep("Payment succeeded", {
          invoice: invoice.id,
          customer: invoice.customer,
          amount: invoice.amount_paid,
        });
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        logStep("Payment failed", {
          invoice: invoice.id,
          customer: invoice.customer,
        });
        break;
      }

      default:
        logStep("Unhandled event type", { type: event.type });
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logStep("Event processing error", { error: msg });
    // Still return 200 so Stripe doesn't retry
  }

  // Always return 200 quickly to acknowledge receipt
  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
