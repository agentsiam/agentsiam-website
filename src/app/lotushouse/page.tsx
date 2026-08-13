import type { Metadata } from "next";
import { pageMeta } from "@/lib/site";
import { BookingWidget } from "@/components/booking-widget";

export const metadata: Metadata = pageMeta({
  title: "Lotus House, a private townhouse near the Night Bazaar",
  description:
    "A three-story townhouse with a rooftop terrace in Chang Khlan, Chiang Mai. Two king bedrooms, two bathrooms, a full kitchen and space for four guests.",
  path: "/lotushouse",
});

const facts = [
  ["4 Guests+", "2 Bedrooms"],
  ["2 King Beds", "2 Bathrooms"],
  ["1 Kitchen", "1 Rooftop"],
];

export default function LotusHousePage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-bold text-text">Lotus House</h1>
      <p className="mt-2 text-muted">
        Your base for adventure and local living in Chiang Mai
      </p>

      <div className="mt-6 flex flex-wrap gap-x-8 gap-y-2 text-sm text-muted">
        {facts.flat().map((fact) => (
          <span key={fact}>{fact}</span>
        ))}
      </div>

      <div className="prose mt-8 max-w-none space-y-4 text-sm leading-relaxed text-muted">
        <p>
          Lotus House is your base for adventure and local living in Chiang
          Mai. Tucked on a quiet street among friendly neighbors, this
          three-story home blends comfort with character, offering spacious
          rooms and a rooftop terrace to relax after exploring the
          city&rsquo;s vibrant markets, temples, and nightlife.
        </p>
        <p>
          Lotus House features two king bedrooms, a back bedroom with patio,
          three dining spaces (indoor table, kitchen island, and rooftop
          terrace), a fully equipped kitchen, and a rooftop soaking tub. Fast
          Wi-Fi, smart TV, and a safety box are included. Garage parking and
          motorbike rental are available, with a 7/11 just a 5-minute walk
          away.
        </p>
      </div>

      <BookingWidget
        className="mt-10"
        title="Check dates and book"
        propertyName="Lotus House"
      />

      <div className="mt-10 rounded-2xl border border-border p-6">
        <p className="text-sm italic leading-relaxed text-muted">
          &ldquo;This was hands down one of the best Airbnbs my husband and I
          have ever stayed in. From the moment we walked in, it felt like
          home...&rdquo;
        </p>
        <p className="mt-3 text-xs text-muted">&mdash; Airbnb guest review</p>
      </div>

      <div className="mt-10 grid gap-6 sm:grid-cols-2">
        <div>
          <h2 className="text-sm font-semibold text-text">Location</h2>
          <p className="mt-1 text-sm text-muted">
            42 Soi 1, Tambon Chang Khlan, Amphoe Mueang Chiang Mai, Chang Wat
            Chiang Mai 50100, Thailand
          </p>
        </div>
        <div>
          <h2 className="text-sm font-semibold text-text">
            Arrival &amp; Departure
          </h2>
          <p className="mt-1 text-sm text-muted">
            Arrival 15:00 &middot; Departure 12:00
          </p>
        </div>
      </div>

      <div className="mt-6 rounded-lg border border-border p-4">
        <h2 className="text-sm font-semibold text-text">House rules</h2>
        <ul className="mt-2 list-inside list-disc text-sm text-muted">
          <li>Pets not allowed</li>
          <li>Not suitable for individuals with limited mobility</li>
          <li>Wheelchair inaccessible</li>
        </ul>
      </div>
    </div>
  );
}
