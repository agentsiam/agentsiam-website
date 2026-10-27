/**
 * The one way this site tells Google Analytics that something happened.
 *
 * Until this existed the property collected page views and nothing else, so GA4 could say
 * how many people read the property page and never that one of them asked to book it.
 * "Generate leads" is one of the two objectives the property was created with, and an
 * objective with no event behind it reports nothing.
 *
 * Three rules hold this down, and the first is the one that matters.
 *
 * **Nothing personal goes to Google, ever.** Not a name, not an email address, not a phone
 * number or a LINE handle, not a message, not a booking reference, not a date of stay.
 * Not hashed, not truncated, not "just the domain of the email". The privacy policy tells
 * a visitor that Google Analytics receives the pages they view, how they arrived, their
 * device and browser, and an approximate location. Sending anything else makes that
 * sentence false, and the policy is the promise, not this file. Today these calls carry an
 * event name and no parameters at all, which is the cheapest way to keep that true.
 *
 * **A missing gtag is the normal state, not an error.** It means the visitor declined, or
 * is in Europe and has not answered, or `NEXT_PUBLIC_GA_MEASUREMENT_ID` is unset, which is
 * every local and preview environment. So this is a silent no-op rather than a throw or a
 * console warning: a guest finishing a booking must never see a failure from the analytics
 * layer, and a declined visitor must not be measured by the back door.
 *
 * **Client components only.** `window` does not exist on the server, and an event fired
 * while rendering would be counted once per render rather than once per thing that
 * happened. Fire from the effect or the handler that owns the outcome.
 *
 * Which events exist is deliberately short. Each one is a thing Paul would act on:
 *
 * | Event                 | Fires when                                                |
 * |-----------------------|-----------------------------------------------------------|
 * | `contact_form_sent`   | the owner enquiry form reached /api/contact and was accepted |
 * | `booking_requested`   | a guest sent a booking request, the path where no money moves |
 * | `booking_paid`        | a stay was paid for and confirmed                          |
 * | `booking_unconfirmed` | a redirect payment came back and we cannot tell what happened |
 *
 * The last one is not a success. It is here because that outcome is otherwise invisible:
 * it looks like an abandoned booking in the reports and like silence in the inbox, and if
 * it ever stops being rare we need to see it.
 *
 * These are custom names rather than GA4's recommended `generate_lead` and `purchase`,
 * because both of those are defined around a value and a currency and this site sends
 * neither. A recommended name on a payload that does not match it buys nothing and
 * misleads whoever reads the reports next.
 *
 * None of these count as a key event until they are marked as one in the GA4 property,
 * under Admin, Events. That is a setting in Google's admin, not a line of code here.
 */

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

export type AnalyticsEvent =
  | "contact_form_sent"
  | "booking_requested"
  | "booking_paid"
  | "booking_unconfirmed";

export function trackEvent(event: AnalyticsEvent): void {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;
  window.gtag("event", event);
}
