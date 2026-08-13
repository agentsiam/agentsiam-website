import Link from "next/link";
import { BOOKING_WIDGET_URL } from "@/lib/site";

type Props = {
  /** Heading shown above the widget. */
  title: string;
  /** Property name, used in the iframe title and the fallback copy. */
  propertyName: string;
  className?: string;
};

/**
 * Beds24 hosted booking widget.
 *
 * This is the hosted iframe from the Beds24 dashboard (Booking Widget -> Iframe
 * Generator), not REST API v2. Beds24 handles availability, pricing and payment
 * inside the frame, so nothing here talks to the API and no token is needed.
 *
 * If NEXT_PUBLIC_BEDS24_WIDGET_URL is not set, the component renders an enquiry
 * call to action instead of an empty frame, so a missing env var degrades into a
 * usable page rather than a broken one.
 */
export function BookingWidget({ title, propertyName, className = "" }: Props) {
  return (
    <section className={className} aria-labelledby="booking">
      <h2 id="booking" className="text-sm font-semibold text-text">
        {title}
      </h2>

      {BOOKING_WIDGET_URL ? (
        <div className="mt-3 overflow-hidden rounded-2xl border border-border">
          <iframe
            src={BOOKING_WIDGET_URL}
            title={`Availability and booking for ${propertyName}`}
            // Beds24 resizes its own content; 720px clears the calendar plus the
            // guest and payment steps on mobile without a nested scrollbar.
            className="h-[720px] w-full border-0"
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </div>
      ) : (
        <div className="mt-3 rounded-2xl border border-border p-6">
          <p className="text-sm leading-relaxed text-muted">
            Tell us your dates and we will confirm availability and the total for
            your stay at {propertyName}, usually the same day.
          </p>
          <Link
            href="/contact"
            className="mt-4 inline-block rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary"
          >
            Enquire about dates
          </Link>
        </div>
      )}
    </section>
  );
}
