"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { Dictionary } from "@/i18n";
import type { Locale } from "@/i18n/config";
import { LOTUS_HOUSE } from "@/lib/property";
import { CONTACT_EMAIL } from "@/lib/site";
import { PAYMENTS_ENABLED, PaymentForm } from "@/components/payment-form";

/**
 * The booking panel: pick dates against live Beds24 availability, see the real total,
 * then either send us a request or go and pay.
 *
 * Why a calendar and not two date inputs. Lotus House is one unit with long stays on it,
 * so whole months are genuinely gone -- at the time of writing October and November had
 * no free nights at all. Two blank date fields would let a guest pick, submit, and only
 * then be told no, over and over, with no way to find the dates that do work. Showing
 * what is free is the difference between a booking form and a bookable page.
 *
 * Two paths out, because they are different promises and should not look alike:
 *
 * - **Request to book** posts to /api/booking/request, which writes it to Beds24 as a
 *   request for us to confirm. No money changes hands. This is the path that works today.
 * - **Book now, pay online** holds the nights in Beds24, then takes the money with Stripe
 *   on this page. The guest never leaves the site and Beds24 is never named. It renders
 *   only when NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is set, so a site without Stripe
 *   configured simply does not offer a payment it cannot take.
 *
 * Nothing here decides availability or price. The calendar and the total both come from
 * Beds24 through our own routes, and the request is re-priced server side before it is
 * written, so a total shown here is a total Beds24 stands behind.
 */

type Night = { date: string; available: boolean; price: number | null; minStay: number };

/**
 * dates      picking a stay
 * request    filling in the "ask us" form
 * payDetails filling in name/email before paying
 * paying     Stripe Payment Element is up, nights are held
 * requested  request sent, waiting on us
 * paid       paid and confirmed
 */
type Mode = "dates" | "request" | "payDetails" | "paying" | "requested" | "paid";

type Quote = {
  arrival: string;
  departure: string;
  nights: number;
  available: boolean;
  total: number | null;
  currency: string;
};

type Props = {
  t: Dictionary;
  locale: Locale;
  contactHref: string;
  privacyHref: string;
};

/** How far ahead to load. Beds24 has rates roughly eighteen months out; a year is plenty
 *  to book a holiday and keeps the payload small enough to fetch in one go. */
const HORIZON_DAYS = 365;

const field =
  "rounded-lg border-[1.5px] border-hairline bg-bg px-3.5 py-3 text-sm outline-none focus-visible:border-ink";

// -- dates ----------------------------------------------------------------------
// Same rule as the server: plain YYYY-MM-DD, arithmetic in UTC. A guest in another
// timezone must get the same night as a guest in Chiang Mai.

function parseDate(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function addDays(value: string, days: number): string {
  const date = parseDate(value);
  date.setUTCDate(date.getUTCDate() + days);
  return formatDate(date);
}

function nightsBetween(from: string, to: string): number {
  return Math.round((parseDate(to).getTime() - parseDate(from).getTime()) / 86_400_000);
}

/**
 * Intl locale for each of our three.
 *
 * Thai is pinned to the Gregorian calendar. CLDR's default for `th` is the Buddhist era,
 * which would print 2569 for 2026 -- correct Thai, but the guest is picking dates that
 * Beds24, their airline and their own booking confirmation all state in Gregorian, and a
 * calendar that disagrees with the confirmation email is a support ticket.
 */
const INTL_LOCALE: Record<Locale, string> = {
  en: "en-GB",
  th: "th-TH-u-ca-gregory",
  zh: "zh-Hans",
};

export function BookingPanel({ t, locale, contactHref, privacyHref }: Props) {
  const [nights, setNights] = useState<Map<string, Night> | null>(null);
  const [calendarError, setCalendarError] = useState(false);
  const [arrival, setArrival] = useState<string | null>(null);
  const [departure, setDeparture] = useState<string | null>(null);
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  // The quote is stored with the stay it was fetched for. Keying it that way means a
  // quote can never be shown against dates it does not belong to: change the dates or the
  // guest count and the old number stops matching, rather than lingering until the new
  // one lands. It also keeps "are we still waiting?" a derived question instead of a
  // second piece of state to keep in step.
  const [quote, setQuote] = useState<{ key: string; value: Quote | null } | null>(null);
  /**
   * Where the guest is in the panel. One value rather than four booleans, because the
   * states are genuinely exclusive -- the old shape allowed "sent" and "paying" at once,
   * which is not a thing that can happen.
   */
  const [mode, setMode] = useState<Mode>("dates");
  const [sending, setSending] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  /** Set once /api/booking/checkout has held the nights and opened a Stripe payment. */
  const [payment, setPayment] = useState<{ clientSecret: string; total: number } | null>(null);

  // The month the grid is showing, as the first of that month.
  const [month, setMonth] = useState<string | null>(null);

  const intl = INTL_LOCALE[locale];

  const money = useMemo(
    () =>
      new Intl.NumberFormat(intl, {
        style: "currency",
        currency: LOTUS_HOUSE.currency,
        maximumFractionDigits: 0,
      }),
    [intl],
  );

  const longDate = useMemo(
    () =>
      new Intl.DateTimeFormat(intl, {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "UTC",
      }),
    [intl],
  );

  // Nightly rates under the calendar cells: bare numbers, no currency symbol. Seven of
  // them across a 372px column, and the symbol is already on the total below.
  const rate = useMemo(
    () => new Intl.NumberFormat(intl, { maximumFractionDigits: 0 }),
    [intl],
  );

  // -- load the calendar once, then navigate months client side ------------------
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await fetch(`/api/booking/availability?days=${HORIZON_DAYS}`);
        if (!response.ok) throw new Error(String(response.status));
        const payload: { from: string; nights: Night[] } = await response.json();
        if (cancelled) return;
        setNights(new Map(payload.nights.map((night) => [night.date, night])));
        setMonth(payload.from.slice(0, 8) + "01");
      } catch {
        if (!cancelled) setCalendarError(true);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  // -- price the stay whenever it is complete ------------------------------------
  const quoteKey =
    arrival && departure ? `${arrival}|${departure}|${adults}|${children}` : null;

  useEffect(() => {
    if (!quoteKey) return;
    const [from, to, quoteAdults, quoteChildren] = quoteKey.split("|");
    let cancelled = false;

    async function price() {
      try {
        const params = new URLSearchParams({
          arrival: from,
          departure: to,
          adults: quoteAdults,
          children: quoteChildren,
        });
        const response = await fetch(`/api/booking/quote?${params}`);
        const payload = await response.json();
        if (cancelled) return;
        // A 4xx here is Beds24 saying "not bookable", which is an answer, not a fault.
        setQuote({ key: quoteKey!, value: response.ok ? payload : null });
      } catch {
        if (!cancelled) setQuote({ key: quoteKey!, value: null });
      }
    }

    price();
    return () => {
      cancelled = true;
    };
  }, [quoteKey]);

  // Only ever the quote for the stay currently on screen.
  const currentQuote = quote && quote.key === quoteKey ? quote.value : null;
  const quoting = quoteKey !== null && (!quote || quote.key !== quoteKey);

  /**
   * The last date that can be chosen as a departure for the current arrival.
   *
   * A stay occupies every night from arrival up to the night before departure, so the
   * range has to stop at the first night that is not free. Without this a guest could
   * select straight across a booked week and only find out at the quote.
   */
  const maxDeparture = useMemo(() => {
    if (!arrival || !nights) return null;
    let cursor = arrival;
    while (nights.get(cursor)?.available) cursor = addDays(cursor, 1);
    return cursor;
  }, [arrival, nights]);

  const selectDate = useCallback(
    (date: string) => {
      setFormError(null);
      setMode("dates");

      // No arrival yet, or the click lands outside the range the arrival allows:
      // treat it as choosing a new arrival.
      if (!arrival || departure || date <= arrival || (maxDeparture && date > maxDeparture)) {
        setArrival(date);
        setDeparture(null);
        return;
      }
      setDeparture(date);
    },
    [arrival, departure, maxDeparture],
  );

  const clearDates = useCallback(() => {
    setArrival(null);
    setDeparture(null);
    setMode("dates");
    setFormError(null);
  }, []);

  const stayNights = arrival && departure ? nightsBetween(arrival, departure) : 0;
  const belowMinimum = stayNights > 0 && stayNights < LOTUS_HOUSE.minStay;
  const bookable = Boolean(
    currentQuote?.available && currentQuote.total !== null && !belowMinimum,
  );

  async function submitRequest(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setSending(true);

    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/booking/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...Object.fromEntries(form),
          arrival,
          departure,
          adults,
          children,
          locale,
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setFormError(payload.error ?? `${t.bookingFailed} ${CONTACT_EMAIL}`);
        setSending(false);
        return;
      }
      setMode("requested");
      setSending(false);
    } catch {
      setFormError(`${t.bookingFailed} ${CONTACT_EMAIL}`);
      setSending(false);
    }
  }

  /**
   * Opens the paid path: the server holds the nights in Beds24, then hands back a Stripe
   * client secret. Nothing is charged yet -- this only gets as far as being *able* to
   * charge, which is why a failure here is always safe to retry.
   */
  async function startCheckout(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setSending(true);

    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/booking/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...Object.fromEntries(form),
          arrival,
          departure,
          adults,
          children,
          locale,
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.clientSecret) {
        setFormError(payload.error ?? `${t.bookingFailed} ${CONTACT_EMAIL}`);
        setSending(false);
        return;
      }
      setPayment({ clientSecret: payload.clientSecret, total: payload.total });
      setMode("paying");
      setSending(false);
    } catch {
      setFormError(`${t.bookingFailed} ${CONTACT_EMAIL}`);
      setSending(false);
    }
  }

  // -- fallback: no calendar, no booking ----------------------------------------
  // A dead calendar must not become a dead page. Same treatment as an unconfigured
  // Beds24: point the visitor at a human.
  if (calendarError) {
    return (
      <Panel title={t.checkDatesAndBook}>
        <div className="p-5">
          <p className="text-sm leading-relaxed text-body">{t.bookingUnavailable}</p>
          <Link href={contactHref} className="pill-primary mt-4 w-full text-center">
            {t.enquireDates}
          </Link>
        </div>
      </Panel>
    );
  }

  // Both end states share a shape: a tick, what happened, and the dates it happened to.
  if (mode === "requested" || mode === "paid") {
    const paid = mode === "paid";
    return (
      <Panel title={t.checkDatesAndBook}>
        <div className="p-6">
          <div
            aria-hidden="true"
            className="flex h-10.5 w-10.5 items-center justify-center rounded-full bg-teal text-xl text-white"
          >
            ✓
          </div>
          <p className="mt-3.5 font-display text-[21px] font-extrabold tracking-[-0.02em]">
            {paid ? t.paidTitle : t.requestSentTitle}
          </p>
          <p className="mt-2 text-[14.5px] leading-relaxed text-body">
            {paid ? t.paidBody : t.requestSentBody}
          </p>
          <p className="mt-3 text-sm text-muted">
            {arrival ? longDate.format(parseDate(arrival)) : ""} →{" "}
            {departure ? longDate.format(parseDate(departure)) : ""}
          </p>
        </div>
      </Panel>
    );
  }

  return (
    <Panel title={t.checkDatesAndBook}>
      <div className="p-5">
        {/* -- the chosen stay, stated in words before any numbers ------------- */}
        <div className="flex items-start justify-between gap-3">
          <dl className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
            <div>
              <dt className="eyebrow">{t.checkIn}</dt>
              <dd className="mt-0.5 font-semibold">
                {arrival ? longDate.format(parseDate(arrival)) : t.pickDate}
              </dd>
            </div>
            <div>
              <dt className="eyebrow">{t.checkOut}</dt>
              <dd className="mt-0.5 font-semibold">
                {departure ? longDate.format(parseDate(departure)) : t.pickDate}
              </dd>
            </div>
          </dl>
          {arrival ? (
            <button
              type="button"
              onClick={clearDates}
              className="shrink-0 cursor-pointer text-xs underline underline-offset-4 text-muted hover:text-ink"
            >
              {t.clearDates}
            </button>
          ) : null}
        </div>

        {nights && month ? (
          <MonthGrid
            month={month}
            nights={nights}
            arrival={arrival}
            departure={departure}
            maxDeparture={maxDeparture}
            onSelect={selectDate}
            onMonthChange={setMonth}
            intl={intl}
            rate={rate}
            t={t}
          />
        ) : (
          <p className="mt-5 text-sm text-muted">{t.loadingAvailability}</p>
        )}

        {/* -- guests ------------------------------------------------------------
            Two counts rather than one, because Beds24 takes numAdult and numChild as
            separate integers and filing every direct booking as all-adults is false
            data. Both count toward maxGuests: Beds24 has no infant concept and validates
            the request against that number, so a rule more generous than Beds24's would
            produce bookings this panel accepts and Beds24 then refuses. Airbnb exempting
            under-2s is Airbnb's own pricing convention and stops there. */}
        <div className="mt-5 flex flex-col gap-2.5">
          <label className="flex items-center justify-between gap-3 text-sm">
            <span className="eyebrow">{t.adults}</span>
            <select
              value={adults}
              onChange={(event) => {
                const next = Number(event.target.value);
                setAdults(next);
                // Keep the pair legal rather than letting the server reject it: dropping
                // the adult count squeezes the children down with it.
                setChildren((current) => Math.min(current, LOTUS_HOUSE.maxGuests - next));
              }}
              className={`${field} w-28 cursor-pointer`}
            >
              {Array.from({ length: LOTUS_HOUSE.maxGuests }, (_, index) => index + 1).map(
                (n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ),
              )}
            </select>
          </label>

          <label className="flex items-center justify-between gap-3 text-sm">
            <span className="eyebrow">{t.children}</span>
            <select
              value={children}
              onChange={(event) => {
                setChildren(Number(event.target.value));
              }}
              className={`${field} w-28 cursor-pointer`}
            >
              {Array.from({ length: LOTUS_HOUSE.maxGuests - adults + 1 }, (_, index) => index).map(
                (n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ),
              )}
            </select>
          </label>

          <p className="text-xs leading-relaxed text-muted">{t.childrenNote}</p>

        </div>


        {/* -- the number ------------------------------------------------------ */}
        <div className="mt-5 border-t border-hairline pt-4">
          {belowMinimum ? (
            <p className="text-sm text-deep-red">
              {t.minStayError.replace("{n}", String(LOTUS_HOUSE.minStay))}
            </p>
          ) : quoting ? (
            <p className="text-sm text-muted">{t.pricing}</p>
          ) : quoteKey ? (
            // An answer arrived. Either it prices, or those nights cannot be had --
            // a quote that failed outright says the same thing to a guest as one that
            // came back empty, so both land on "not available" rather than a silence.
            currentQuote?.available && currentQuote.total !== null ? (
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-body">
                  {stayNights} {stayNights === 1 ? t.night : t.nights}
                </span>
                <span className="font-display text-[22px] font-extrabold tracking-[-0.02em]">
                  {money.format(currentQuote.total)}
                </span>
              </div>
            ) : (
              <p className="text-sm text-deep-red">{t.datesUnavailable}</p>
            )
          ) : (
            <p className="text-sm text-muted">
              {t.pickDatesHint.replace("{n}", String(LOTUS_HOUSE.minStay))}
            </p>
          )}
        </div>

        {/* -- the two ways out ------------------------------------------------ */}
        {mode === "request" ? (
          <GuestForm
            t={t}
            sending={sending}
            error={formError}
            privacyHref={privacyHref}
            submitLabel={t.sendRequest}
            onSubmit={submitRequest}
            onCancel={() => setMode("dates")}
          />
        ) : mode === "payDetails" ? (
          <GuestForm
            t={t}
            sending={sending}
            error={formError}
            privacyHref={privacyHref}
            submitLabel={t.continueToPayment}
            onSubmit={startCheckout}
            onCancel={() => setMode("dates")}
          />
        ) : mode === "paying" && payment ? (
          <PaymentForm
            clientSecret={payment.clientSecret}
            locale={locale}
            t={t}
            amountLabel={money.format(payment.total)}
            onPaid={() => setMode("paid")}
            // Backing out abandons the hold. It is not released here on purpose: the
            // browser is not trusted to decide that, and release-holds will sweep it.
            onCancel={() => {
              setPayment(null);
              setMode("dates");
            }}
          />
        ) : (
          <div className="mt-4 flex flex-col gap-2.5">
            {/* Paying is the primary action when it is available -- it is the one that
                finishes the job. The request path stays visibly offered rather than
                buried, because a guest with a question should not have to pay to ask. */}
            {PAYMENTS_ENABLED ? (
              <button
                type="button"
                disabled={!bookable}
                onClick={() => setMode("payDetails")}
                className="w-full cursor-pointer rounded-full bg-ink px-6 py-3.5 text-[15px] font-semibold text-white hover:bg-primary disabled:cursor-not-allowed disabled:bg-[#c2c2ce]"
              >
                {t.bookAndPay}
              </button>
            ) : null}

            <button
              type="button"
              disabled={!bookable}
              onClick={() => setMode("request")}
              className={
                PAYMENTS_ENABLED
                  ? "w-full cursor-pointer rounded-full border-[1.5px] border-ink px-6 py-3.5 text-[15px] font-semibold text-ink hover:bg-ink hover:text-white disabled:cursor-not-allowed disabled:border-[#c2c2ce] disabled:text-[#c2c2ce] disabled:hover:bg-transparent"
                  : "w-full cursor-pointer rounded-full bg-ink px-6 py-3.5 text-[15px] font-semibold text-white hover:bg-primary disabled:cursor-not-allowed disabled:bg-[#c2c2ce]"
              }
            >
              {t.requestToBook}
            </button>

            <p className="mt-1 text-xs leading-relaxed text-muted">
              {PAYMENTS_ENABLED ? t.twoWaysNote : t.requestOnlyNote}
            </p>
          </div>
        )}
      </div>
    </Panel>
  );
}

// -- pieces ---------------------------------------------------------------------

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section
      className="overflow-hidden rounded-panel border border-hairline"
      aria-labelledby="booking"
    >
      <h2
        id="booking"
        className="border-b border-hairline px-5 py-4 font-display text-lg font-bold tracking-[-0.015em]"
      >
        {title}
      </h2>
      {children}
    </section>
  );
}

/**
 * One month of nights.
 *
 * Weeks start on Monday, which is the convention in all three of our markets. The grid is
 * a table because that is what it is -- rows of weeks, columns of weekdays -- and a
 * screen reader announcing "Wednesday 24 December" from the column header is worth more
 * than a div with an aria-label on every cell.
 */
function MonthGrid({
  month,
  nights,
  arrival,
  departure,
  maxDeparture,
  onSelect,
  onMonthChange,
  intl,
  rate,
  t,
}: {
  month: string;
  nights: Map<string, Night>;
  arrival: string | null;
  departure: string | null;
  maxDeparture: string | null;
  onSelect: (date: string) => void;
  onMonthChange: (month: string) => void;
  intl: string;
  rate: Intl.NumberFormat;
  t: Dictionary;
}) {
  const first = parseDate(month);
  const monthLabel = new Intl.DateTimeFormat(intl, {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(first);

  // Monday-first weekday initials, taken from Intl so they translate with the locale.
  const weekdays = useMemo(() => {
    const format = new Intl.DateTimeFormat(intl, { weekday: "short", timeZone: "UTC" });
    // 2024-01-01 was a Monday, which makes it a convenient anchor for seven labels.
    return Array.from({ length: 7 }, (_, index) =>
      format.format(new Date(Date.UTC(2024, 0, 1 + index))),
    );
  }, [intl]);

  const daysInMonth = new Date(
    Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0),
  ).getUTCDate();
  // getUTCDay is Sunday-0; shift so Monday is 0.
  const leading = (first.getUTCDay() + 6) % 7;

  const cells: (string | null)[] = [
    ...Array.from({ length: leading }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => addDays(month, index)),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks = Array.from({ length: cells.length / 7 }, (_, index) =>
    cells.slice(index * 7, index * 7 + 7),
  );

  // Month navigation is bounded by what was actually loaded, so the guest cannot page
  // into empty months and conclude the place is booked out forever.
  const dates = [...nights.keys()].sort();
  const firstLoaded = dates.length ? dates[0].slice(0, 8) + "01" : month;
  const lastLoaded = dates.length ? dates[dates.length - 1].slice(0, 8) + "01" : month;
  const previous = shiftMonth(month, -1);
  const next = shiftMonth(month, 1);

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => onMonthChange(previous)}
          disabled={previous < firstLoaded}
          aria-label={t.previousMonth}
          className="cursor-pointer rounded-full px-2.5 py-1 text-lg leading-none text-muted hover:bg-surface hover:text-ink disabled:cursor-not-allowed disabled:opacity-30"
        >
          ‹
        </button>
        <span className="font-display text-[15px] font-bold tracking-[-0.01em]">{monthLabel}</span>
        <button
          type="button"
          onClick={() => onMonthChange(next)}
          disabled={next > lastLoaded}
          aria-label={t.nextMonth}
          className="cursor-pointer rounded-full px-2.5 py-1 text-lg leading-none text-muted hover:bg-surface hover:text-ink disabled:cursor-not-allowed disabled:opacity-30"
        >
          ›
        </button>
      </div>

      <table className="mt-2.5 w-full table-fixed border-separate border-spacing-y-0.5">
        <thead>
          <tr>
            {weekdays.map((day) => (
              <th
                key={day}
                scope="col"
                className="pb-1 text-[10px] font-semibold uppercase tracking-[0.04em] text-muted"
              >
                {day}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {weeks.map((week, weekIndex) => (
            <tr key={`${month}-w${weekIndex}`}>
              {week.map((date, index) => {
                if (!date) return <td key={`pad-${index}`} />;

                const night = nights.get(date);
                const isArrival = date === arrival;
                const isDeparture = date === departure;
                // A departure date is selectable even though its own night is not part of
                // the stay -- you check out on it. Hence the maxDeparture allowance.
                const selectableAsDeparture =
                  Boolean(arrival) && !departure && maxDeparture === date;
                const free = Boolean(night?.available) || selectableAsDeparture;
                const inRange =
                  arrival && departure ? date > arrival && date < departure : false;

                return (
                  <td key={date} className="p-0 text-center">
                    <button
                      type="button"
                      disabled={!free}
                      onClick={() => onSelect(date)}
                      aria-pressed={isArrival || isDeparture}
                      className={[
                        "w-full cursor-pointer rounded-md py-1.5 text-[13px] leading-tight",
                        isArrival || isDeparture
                          ? "bg-ink font-semibold text-white"
                          : inRange
                            ? "bg-surface-2 text-ink"
                            : free
                              ? "hover:bg-surface"
                              : "cursor-not-allowed text-muted/40 line-through",
                      ].join(" ")}
                    >
                      {parseDate(date).getUTCDate()}
                      {/* The nightly rate under each free night. It is a guide -- the
                          total the guest is quoted comes from Beds24, not from adding
                          these up -- so it is set small and quiet. */}
                      <span
                        className={`block text-[9px] font-normal ${
                          isArrival || isDeparture ? "text-white/70" : "text-muted"
                        }`}
                      >
                        {free && night?.price ? rate.format(night.price) : " "}
                      </span>
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function shiftMonth(month: string, by: number): string {
  const date = parseDate(month);
  date.setUTCMonth(date.getUTCMonth() + by);
  return formatDate(date).slice(0, 8) + "01";
}

function GuestForm({
  t,
  sending,
  error,
  privacyHref,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  t: Dictionary;
  sending: boolean;
  error: string | null;
  privacyHref: string;
  /** Differs by path: "Send request" versus "Continue to payment". */
  submitLabel: string;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
}) {
  return (
    <form onSubmit={onSubmit} className="mt-4 border-t border-hairline pt-4">
      <div className="grid gap-2.5 sm:grid-cols-2">
        <input required name="firstName" autoComplete="given-name" className={field} placeholder={t.firstName} />
        <input required name="lastName" autoComplete="family-name" className={field} placeholder={t.lastName} />
      </div>
      <input
        required
        type="email"
        name="email"
        autoComplete="email"
        className={`${field} mt-2.5 w-full`}
        placeholder="Email"
      />
      <input
        name="phone"
        autoComplete="tel"
        className={`${field} mt-2.5 w-full`}
        placeholder={`${t.phoneOrLine} (${t.optional})`}
      />
      <textarea
        name="message"
        rows={3}
        className={`${field} mt-2.5 w-full resize-y`}
        placeholder={t.anythingElse}
      />

      {/* Honeypot, as on the contact form. */}
      <div className="hidden" aria-hidden="true">
        <label>
          Company
          <input name="company" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      {error ? (
        <p role="alert" className="mt-3 text-[12.5px] text-deep-red">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={sending}
        className="mt-3.5 w-full cursor-pointer rounded-full bg-ink px-6 py-3.5 text-[15px] font-semibold text-white hover:bg-primary disabled:cursor-not-allowed disabled:bg-[#c2c2ce]"
      >
        {sending ? t.sending : submitLabel}
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="mt-2 w-full cursor-pointer text-xs underline underline-offset-4 text-muted hover:text-ink"
      >
        {t.back}
      </button>

      <p className="mt-3 text-xs leading-relaxed text-muted">
        {t.requestPrivacyNote}{" "}
        <Link className="underline hover:text-primary" href={privacyHref}>
          {t.privacy}
        </Link>
        .
      </p>
    </form>
  );
}
