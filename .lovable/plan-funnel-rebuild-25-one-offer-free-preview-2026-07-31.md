# Funnel Rebuild — $25, One Offer, Free Preview

## The new flow

```text
LAND  ->  HEAR      ->  TRY FREE          ->  WALL           ->  BUY
hero      1 sample      birth data form      teaser result     $25 checkout
          track         (no payment)         + locked panels
```

Right now the app shows a paywall wall-of-copy first and only lets people in
after they buy or click "already purchased". That is backwards for conversion.
The new order gives a taste first, then asks for the sale at the moment of
maximum curiosity.

## 1. Pricing: $47 -> $25 everywhere

Every `$47` reference becomes `$25`:
- Hero CTA button
- Pricing block
- Page meta description
- The unused `/quantumelodic` duplicate page (kept in sync so it can't leak the old price)

The Stripe link constant stays where it is so you can drop the new $25 link in.

## 2. Kill the scarcity theater

Remove the "first 50 founding readings", the claimed/remaining counters, and
the progress bar from the landing page. It reads as a gimmick and it needs
manual upkeep. The same block on the Lunar Reports page goes too.

## 3. One offer, not three

The three-tier menu ($14.99 / $47 / $97) splits attention and invites
comparison-shopping. It collapses into a single offer:

**The Composition — $25.** Your chart, composed. Full written analysis,
narrated report, your own piece of music.

The Full Score stays alive as one quiet line of text under the button
("Want the notated score and commercial license? Reply after purchase.") —
no card, no second price competing for the click. The $14.99 tier is retired;
at $25 it has no room to exist.

## 4. Much less copy

Cut roughly two thirds of the landing text:
- Hero: headline, one sentence, two buttons. Nothing else.
- Samples: **one** sample track, not three. One is a taste; three is a playlist.
- "About this work": trimmed to two sentences.
- The four-item "what's in your report" grid becomes three short lines inside
  the offer card.
- Refund/guarantee paragraph shortens to a single line.

## 5. The free preview (the hook)

New: anyone can enter birth data without paying.

They get, free:
- Their chart wheel, rendered
- Their musical key and mode ("Your chart is in A-flat minor, Dorian")
- One sentence on Sun, Moon, and Rising

Then the page stops. Below it, the full report and the composition player
render **blurred and locked**, with the $25 button sitting on top of them.
They can see the shape of what they're missing.

Note on the audio: the free preview will **not** generate their actual track.
Each generation costs real money and hearing it is the product. The audio
taste is the sample composition on the landing page; what's personal in the
free tier is their chart and their key.

## Technical notes

- `src/pages/Index.tsx` — the bulk of the work. Constants `FOUNDING_CLAIMED`,
  `FOUNDING_TOTAL`, `CHECKOUT_URL_KEY`, `CHECKOUT_URL_SCORE` are deleted;
  `CHECKOUT_URL` remains as the single $25 link. `PricingTiers` is replaced by
  a single `OfferCard`. `PaywallView` is rewritten shorter.
- App state machine changes from `paywall -> input -> generating -> result` to
  `landing -> input -> generating -> preview|result`. The paid-session check
  (`?paid=true`, `sessionStorage`) decides whether the result view renders
  full or teaser; the "already purchased" link is kept.
- The teaser/locked treatment reuses the existing report and player components
  behind a blur + overlay wrapper — no changes to the report generator, the
  music engine, or any edge function.
- `src/pages/QuantumMelodic.tsx` and `src/pages/LunarReports.tsx` get the same
  price and founding-block cleanup so nothing stale is reachable.
- Design tokens, sigils, and the existing minimalist styling are unchanged.

## You still need to do

Create the $25 Stripe payment link and paste it in — I'll leave the constant
clearly marked at the top of `Index.tsx`.
