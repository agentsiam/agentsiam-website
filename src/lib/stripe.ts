import Stripe from "stripe";

/**
 * Stripe, server side only.
 *
 * This file reads STRIPE_SECRET_KEY and must never be imported from a client component.
 * The browser gets the publishable key and a PaymentIntent client secret, which are both
 * safe to expose by design -- a client secret authorises paying one specific intent and
 * nothing else.
 *
 * Card details never touch this server. The Payment Element posts them straight to Stripe
 * from the guest's browser, which is what keeps the site in the lightest PCI bracket
 * (SAQ-A) rather than the one that comes with handling card numbers yourself.
 */

const SECRET_KEY = process.env.STRIPE_SECRET_KEY ?? "";

export const STRIPE_READY = Boolean(SECRET_KEY);

/**
 * Lazily constructed so that a missing key is a 503 from one route rather than a crash
 * that takes the whole site down at import time. The rest of the site does not need
 * Stripe to work.
 */
let client: Stripe | null = null;

export function stripe(): Stripe {
  if (!SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is not set");
  }
  // No apiVersion pin: the installed SDK pins its own, and hardcoding a date string here
  // only creates a second place to get it wrong on upgrade.
  client ??= new Stripe(SECRET_KEY);
  return client;
}

/**
 * Currencies Stripe counts in whole units rather than hundredths.
 *
 * THB is not one of them -- a ฿7,000 booking is 700000 satang -- but this property is not
 * guaranteed to be the last, and getting the factor wrong is a hundredfold error in
 * someone's money in either direction. Written out rather than assumed.
 */
const ZERO_DECIMAL = new Set([
  "BIF", "CLP", "DJF", "GNF", "JPY", "KMF", "KRW", "MGA", "PYG",
  "RWF", "UGX", "VND", "VUV", "XAF", "XOF", "XPF",
]);

/** Converts a human amount (7000) into Stripe's smallest unit (700000 for THB). */
export function toMinorUnits(amount: number, currency: string): number {
  const factor = ZERO_DECIMAL.has(currency.toUpperCase()) ? 1 : 100;
  return Math.round(amount * factor);
}

/** The inverse, for reading an amount back off a PaymentIntent. */
export function fromMinorUnits(amount: number, currency: string): number {
  const factor = ZERO_DECIMAL.has(currency.toUpperCase()) ? 1 : 100;
  return amount / factor;
}
