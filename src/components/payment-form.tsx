"use client";

import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { loadStripe, type Appearance, type Stripe } from "@stripe/stripe-js";
import { useState } from "react";
import type { Dictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";
import { CONTACT_EMAIL } from "@/lib/site";

/**
 * Stripe payment, hosted inside our own panel.
 *
 * The Payment Element is an iframe served by Stripe, so card numbers go from the guest's
 * browser straight to Stripe and never touch this site -- which is what keeps us in the
 * lightest PCI bracket while still looking like part of the page. It is themed from our
 * own design tokens below, so it reads as ours rather than as a bolted-on widget.
 *
 * Nothing here confirms the booking. The guest's browser is not evidence that money moved:
 * they might close the tab the instant the card clears. Stripe's signed webhook is what
 * confirms it, and this component only reports what the browser happened to see. That is
 * why a failure here says "we will email you" rather than "your booking failed" -- by that
 * point it may well have succeeded.
 */

// One promise for the page. loadStripe injects a script tag, so calling it per render
// would add one on every keystroke.
let stripePromise: Promise<Stripe | null> | null = null;

function getStripe(): Promise<Stripe | null> {
  const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  if (!key) return Promise.resolve(null);
  stripePromise ??= loadStripe(key);
  return stripePromise;
}

/** Whether the site is set up to take payments at all. Drives whether the button shows. */
export const PAYMENTS_ENABLED = Boolean(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

// Matched to globals.css rather than left on Stripe's defaults, so the element does not
// announce that it came from somewhere else.
const appearance: Appearance = {
  theme: "stripe",
  variables: {
    colorPrimary: "#0100dd",
    colorText: "#181818",
    colorDanger: "#b93b18",
    fontFamily: "system-ui, sans-serif",
    borderRadius: "8px",
    spacingUnit: "4px",
  },
};

/** Stripe's locale vocabulary. Ours is a subset of it. */
const STRIPE_LOCALE: Record<Locale, "en" | "th" | "zh"> = { en: "en", th: "th", zh: "zh" };

export function PaymentForm({
  clientSecret,
  locale,
  t,
  amountLabel,
  onCancel,
  onPaid,
}: {
  clientSecret: string;
  locale: Locale;
  t: Dictionary;
  amountLabel: string;
  onCancel: () => void;
  onPaid: () => void;
}) {
  return (
    <Elements
      stripe={getStripe()}
      options={{ clientSecret, appearance, locale: STRIPE_LOCALE[locale] }}
    >
      <PayFields t={t} amountLabel={amountLabel} onCancel={onCancel} onPaid={onPaid} />
    </Elements>
  );
}

function PayFields({
  t,
  amountLabel,
  onCancel,
  onPaid,
}: {
  t: Dictionary;
  amountLabel: string;
  onCancel: () => void;
  onPaid: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!stripe || !elements) return;

    setError(null);
    setPaying(true);

    // `redirect: "if_required"` keeps a card payment on this page, while still allowing
    // the redirect that methods like PromptPay need. The return_url is only used in that
    // second case.
    const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: `${window.location.origin}${window.location.pathname}?paid=1` },
      redirect: "if_required",
    });

    if (stripeError) {
      // A declined card or a validation slip: the guest can fix it and try again.
      setError(stripeError.message ?? `${t.bookingFailed} ${CONTACT_EMAIL}`);
      setPaying(false);
      return;
    }

    if (paymentIntent && (paymentIntent.status === "succeeded" || paymentIntent.status === "processing")) {
      onPaid();
      return;
    }

    setError(`${t.bookingFailed} ${CONTACT_EMAIL}`);
    setPaying(false);
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 border-t border-hairline pt-4">
      <PaymentElement options={{ layout: "tabs" }} />

      {error ? (
        <p role="alert" className="mt-3 text-[12.5px] text-deep-red">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={!stripe || paying}
        className="mt-4 w-full cursor-pointer rounded-full bg-ink px-6 py-3.5 text-[15px] font-semibold text-white hover:bg-primary disabled:cursor-not-allowed disabled:bg-[#c2c2ce]"
      >
        {paying ? t.paying : `${t.payNow} ${amountLabel}`}
      </button>
      <button
        type="button"
        onClick={onCancel}
        disabled={paying}
        className="mt-2 w-full cursor-pointer text-xs underline underline-offset-4 text-muted hover:text-ink disabled:cursor-not-allowed"
      >
        {t.back}
      </button>

      <p className="mt-3 text-xs leading-relaxed text-muted">{t.heldNote}</p>
    </form>
  );
}
