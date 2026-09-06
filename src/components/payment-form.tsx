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

/**
 * What Stripe thinks happened to one payment.
 *
 * Needed because a redirect payment method -- PromptPay, and full-page 3DS -- takes the
 * guest off this site and drops them back on a freshly mounted panel that knows nothing.
 * The panel keeps the client secret across that trip and asks this, rather than assuming
 * from a query parameter, because `?paid=1` is a string anyone can type.
 *
 * Returns null when Stripe is not configured or will not load. That is not "unpaid": it
 * is "we cannot tell from here", and the panel says exactly that rather than inviting a
 * second payment.
 */
export async function retrievePaymentStatus(
  clientSecret: string,
): Promise<{ status: string } | null> {
  const stripe = await getStripe();
  if (!stripe) return null;
  try {
    const { paymentIntent } = await stripe.retrievePaymentIntent(clientSecret);
    return paymentIntent ? { status: paymentIntent.status } : null;
  } catch {
    return null;
  }
}

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
  holdMinutes,
  onCancel,
  onPaid,
  onBeforeConfirm,
}: {
  clientSecret: string;
  locale: Locale;
  t: Dictionary;
  amountLabel: string;
  /** From /api/booking/checkout. Null when the route did not say. */
  holdMinutes: number | null;
  onCancel: () => void;
  onPaid: () => void;
  /** Runs immediately before confirmPayment, so the panel can survive a redirect. */
  onBeforeConfirm: () => void;
}) {
  return (
    <Elements
      stripe={getStripe()}
      options={{ clientSecret, appearance, locale: STRIPE_LOCALE[locale] }}
    >
      <PayFields
        t={t}
        amountLabel={amountLabel}
        holdMinutes={holdMinutes}
        onCancel={onCancel}
        onPaid={onPaid}
        onBeforeConfirm={onBeforeConfirm}
      />
    </Elements>
  );
}

function PayFields({
  t,
  amountLabel,
  holdMinutes,
  onCancel,
  onPaid,
  onBeforeConfirm,
}: {
  t: Dictionary;
  amountLabel: string;
  holdMinutes: number | null;
  onCancel: () => void;
  onPaid: () => void;
  onBeforeConfirm: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [paying, setPaying] = useState(false);
  // `withEmail` decides whether the address is offered as a real mailto link beside the
  // message. A Stripe decline is the guest's to fix and needs no email; our own failures
  // need a way to reach a person.
  const [error, setError] = useState<{ message: string; withEmail: boolean } | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!stripe || !elements) return;

    setError(null);
    setPaying(true);

    // Written down before the confirm, not after. PromptPay always redirects and 3DS
    // often does, and the page that comes back is a fresh mount with no state at all --
    // so the client secret has to outlive this component or the payment is lost and the
    // guest's rational next move is to pay a second time.
    onBeforeConfirm();

    // `redirect: "if_required"` keeps a card payment on this page, while still allowing
    // the redirect that methods like PromptPay need. The return_url is only used in that
    // second case, and the panel reads `paid=1` back on mount.
    const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: `${window.location.origin}${window.location.pathname}?paid=1` },
      redirect: "if_required",
    });

    if (stripeError) {
      // A declined card or a validation slip: the guest can fix it and try again.
      setError(
        stripeError.message
          ? { message: stripeError.message, withEmail: false }
          : { message: t.bookingFailed, withEmail: true },
      );
      setPaying(false);
      return;
    }

    if (paymentIntent && (paymentIntent.status === "succeeded" || paymentIntent.status === "processing")) {
      onPaid();
      return;
    }

    setError({ message: t.bookingFailed, withEmail: true });
    setPaying(false);
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 border-t border-hairline pt-4">
      <PaymentElement options={{ layout: "tabs" }} />

      {error ? (
        <p role="alert" className="mt-3 text-[12.5px] text-deep-red">
          {error.message}
          {error.withEmail ? (
            <>
              {" "}
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="underline underline-offset-2 hover:text-ink"
              >
                {CONTACT_EMAIL}
              </a>
            </>
          ) : null}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={!stripe || paying}
        className="mt-4 min-h-11 w-full cursor-pointer rounded-full bg-ink px-6 py-3.5 text-[15px] font-semibold text-white hover:bg-primary disabled:cursor-not-allowed disabled:bg-muted/40"
      >
        {paying ? t.paying : `${t.payNow} ${amountLabel}`}
      </button>
      <button
        type="button"
        onClick={onCancel}
        disabled={paying}
        className="mt-2 min-h-11 w-full cursor-pointer text-xs underline underline-offset-4 text-muted hover:text-ink disabled:cursor-not-allowed"
      >
        {t.back}
      </button>

      <p className="mt-3 text-xs leading-relaxed text-muted">
        {holdMinutes !== null
          ? `${t.bkHoldNote.replace("{n}", String(holdMinutes))} ${t.bkCardNote}`
          : t.heldNote}
      </p>
    </form>
  );
}
