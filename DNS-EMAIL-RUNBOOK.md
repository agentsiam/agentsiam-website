# DNS and transactional email — runbook

Written 14 August 2026. Everything in "Where things stand" was read off live DNS and
WHOIS, not assumed. Re-check before acting if much time has passed.

---

## ⚠️ Do this first, whatever else you decide

**`agentsiam.com` expires 23 September 2026.** Registered 23 Sep 2025 on a one-year term.
If it lapses the website, the Zoho mail and the booking flow all stop at once. Renew it,
and turn on auto-renew.

The expiry is also the natural decision point for everything below, because a domain
transfer adds a year — see Path 2.

---

## Where things stand

| | Current |
|---|---|
| Registrar | **Wix.com Ltd** |
| Nameservers | `ns2.wixdns.net`, `ns3.wixdns.net` |
| Website | Wix (`185.230.63.186 / .107 / .171`) |
| Mail | **Zoho EU** (`mx.zoho.eu`) |
| SPF | `v=spf1 include:zohomail.eu ~all` |
| DKIM | **present**, selector `zmail._domainkey` (corrected 24/08/2026) |
| DMARC | **none** |
| Locks | `clientTransferProhibited`, `clientUpdateProhibited` |

Note the SPF include is `zohomail.eu`, **not** `zoho.com`. Zoho's EU tenant. Getting this
wrong breaks all outbound mail, so copy it exactly.

### The complete zone — 12 records

Everything that exists today. Needed if you ever recreate the zone elsewhere.

> **Corrected twice on 24/08/2026. This table said 9 records and there are 12.** Missing were
> `property.agentsiam.com`, `www.property.agentsiam.com` and, most importantly, the **DKIM
> record**, which this file elsewhere claimed did not exist.
>
> Both corrections came from reading the Wix DNS page directly. A `dig` sweep of 40 common
> subdomain names found `www` and `property` but missed `www.property`, and could not have
> found DKIM without already knowing the selector. **The lesson for the September rebuild:
> export the zone from the Wix UI on the day. Do not trust this table, a `dig` sweep, or
> Cloudflare's own scanner, which is documented to miss TXT records.**

> **Stale after 26/08/2026.** This table is the pre-cutover zone. At cutover the apex `A`
> set and the `www` `CNAME` are repointed from Wix to Vercel, so **four of these nine
> records stop being current**. Rebuilding the zone from this table after that date would
> restore the Wix website and undo the launch.
>
> The five that carry over unchanged are the three `MX` and the two `TXT`, which are the
> records that carry the mail, **and the DKIM TXT on `zmail._domainkey` is a sixth that must
> come with them**. **`property` and `www.property` are deliberately not carried over.** Paul,
> 24/08/2026: it is a legacy Wix subdomain, referenced nowhere, and it is being retired
> rather than rebuilt. Leave it working for as long as Wix serves it, which costs nothing,
> and simply omit it from the Cloudflare zone. **Do not recreate it**, and do not treat its
> absence after the transfer as a mistake to fix. Take the apex and `www` targets from the Vercel dashboard on
> the day, never from a document: Vercel's addresses change.
>
> Execution plan for the September registrar transfer, including which records survive:
> `agentsiam-consulting/as-work/2026-08-24-registrar-transfer/transfer-plan.md`.

| Type | Name | Value | Priority |
|---|---|---|---|
| A | `@` | `185.230.63.186` | — |
| A | `@` | `185.230.63.107` | — |
| A | `@` | `185.230.63.171` | — |
| CNAME | `www` | `cdn1.wixdns.net` | — |
| CNAME | `property` | `cdn1.wixdns.net` | — |
| CNAME | `www.property` | `cdn1.wixdns.net` | — |
| MX | `@` | `mx.zoho.eu` | 10 |
| MX | `@` | `mx2.zoho.eu` | 20 |
| MX | `@` | `mx3.zoho.eu` | 30 |
| TXT | `@` | `v=spf1 include:zohomail.eu ~all` | — |
| TXT | `@` | `zoho-verification=zb55231650.zmverify.zoho.eu` | — |
| TXT | `zmail._domainkey` | `v=DKIM1; k=rsa; p=MIGfMA0GCSq...` **copy live, do not transcribe** | — |

**Trap:** querying `www` returns A/MX/TXT values. Those are the CNAME chain resolving, not
real records. `www` is one CNAME. Do not recreate the rest.

---

## The constraint that decides everything

**Wix does not allow nameserver changes on domains registered with Wix.** From Wix's own
help centre: *"Currently, it's not possible to change name servers (edit NS records) for a
Wix domain."* It is not self-service and support cannot do it either. The only route to
external DNS is transferring the domain away.

Wix's DNS editor **does** allow A, CNAME, TXT and root MX. What it does not allow is
**MX on a subdomain** — and that is precisely what Resend requires (`MX` on `send`). Hence
Resend's rejection.

### What this does *not* block

Pointing the domain at Vercel. That needs an A record at the root and a CNAME on `www`,
both of which Wix handles. **The Wix → Vercel migration does not require moving DNS.**
(An earlier version of this plan claimed it did. It was wrong.)

---

## Path 1 — Send through Zoho. Free, no DNS changes. **← IMPLEMENTED 14 Aug 2026**

The code is done. `src/lib/mailer.ts` chooses a transport from the environment: SMTP if the
`SMTP_*` variables are set, Resend otherwise. All three notifications (contact form,
booking request, paid booking) go through it, so switching to Path 2 later means changing
environment variables, not code.

- **Cost:** none. Zoho is already paid for and its SPF already authorises it.
- **DNS work:** none.
- **Risk:** none to existing mail.
- **Code work:** done. `nodemailer` added; `src/lib/mailer.ts` is the single send path used
  by `/api/contact`, `/api/booking/request` and `/api/stripe/webhook`.
- **Limitation:** Zoho's SMTP is built for human mail, not bulk sending. For one property's
  enquiries and booking confirmations that is comfortably inside its limits. It would not
  suit a newsletter or a portfolio of properties.

Remaining steps (configuration only):

1. Zoho Mail → **Settings → Mail Accounts → IMAP/SMTP**, make sure SMTP access is enabled.
2. Generate an **app-specific password** at `accounts.zoho.eu` → **Security → App
   Passwords**. Not the account password: Zoho enforces 2FA and rejects the real one.
3. Fill `SMTP_USER` and `SMTP_PASSWORD` in `.env.local` (already scaffolded), and set the
   same in Vercel at deploy.
4. Leave `CONTACT_FROM_EMAIL` unset unless `noreply@agentsiam.com` genuinely exists as a
   Zoho mailbox or alias. Zoho rejects a From it does not own; unset means the mailer uses
   `SMTP_USER`, which always works.

Settings, confirmed for the EU tenant:

| | Value |
|---|---|
| Host | `smtp.zoho.eu` — **not** `.com`, that is a different tenant |
| Port | `465` (implicit TLS) or `587` (STARTTLS) |
| User | the full mailbox address |
| Password | app-specific password |

---

## Path 2 — Transfer the domain, then Cloudflare DNS, then Resend.

Best if you want a proper email setup and full DNS control. Also the moment to fix the
missing DMARC. DKIM already exists on `zmail._domainkey` and must be carried over, not
recreated.

- **Cost:** ~USD 10.44/year at Cloudflare Registrar (at-cost, no markup). This **replaces**
  the Wix renewal rather than adding to it, and is usually cheaper. Cloudflare's DNS
  service itself is free: unlimited queries, A/CNAME/MX/TXT all supported.
- **Timeline:** 5–7 days for the transfer.
- **Risk:** moderate. Mail is what breaks if a record is wrong.

**Timing matters.** The domain expires 23 Sep 2026 and a transfer takes about a week. Either
start well before that, or renew at Wix first and transfer afterwards — do not let a
transfer run down to the wire.

**Decided 24/08/2026, Paul: transfer rather than renew, in the window 1 to 10 September.**
After the 26/08 cutover has settled, and with at least ten days of margin before expiry. Both
60-day ICANN locks were checked against live WHOIS that day and are clear. One trap that is
not obvious and would cost the whole plan: **do not edit the registrant contact first**, as
that starts a fresh 60-day transfer lock which lands past 23 Sep. Full plan:
`agentsiam-consulting/as-work/2026-08-24-registrar-transfer/transfer-plan.md`.

### Steps

1. **Unlock at Wix.** Domains → `agentsiam.com` → remove the transfer lock, request the
   EPP/auth code. Wix emails it.
2. **Start the transfer** at Cloudflare Registrar with that code. Approve the confirmation
   email. Wait for completion. *(ICANN forbids transfers within 60 days of registration or
   a previous transfer — not an issue here, registered Sep 2025.)*
3. **Recreate the zone** in Cloudflare from the 9-record table above, before changing
   anything else. Cloudflare's scanner routinely misses TXT records — check by hand.
4. **Set every record to "DNS only"** (grey cloud, not orange). Proxying breaks Wix's SSL,
   and MX must never be proxied.
5. **Verify** the site resolves and mail still routes to Zoho before going further. Ask
   Claude to run the checks.
6. **Then add Resend's records:**

   | Type | Name | Value | Priority |
   |---|---|---|---|
   | MX | `send` | from Resend, e.g. `feedback-smtp.<region>.amazonses.com` | 10 |
   | TXT | `send` | from Resend, e.g. `v=spf1 include:amazonses.com ~all` | — |
   | TXT | `resend._domainkey` | from Resend (DKIM) | — |

   **Paste the host only** — `send`, not `send.agentsiam.com`. Cloudflare appends the
   domain itself, and pasting the full name creates `send.agentsiam.com.agentsiam.com`.
   The DKIM record must be **DNS only**.

7. **Then set `RESEND_API_KEY`, `CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL`** in `.env.local`
   and Vercel. The code already expects Resend — no changes needed on this path.

---

## Worth fixing on either path

Both are deliverability gaps that put booking confirmations in spam folders.

- ~~**No DKIM on Zoho.**~~ **Wrong, corrected 24/08/2026.** DKIM is configured and live on
  selector **`zmail._domainkey`**, verified by `dig`. This file previously said there was no
  DKIM record, which was checked only at the apex. It is a subdomain TXT and a plain apex
  query cannot see it. **It must be carried into any new zone**, and the key is long enough
  that transcribing it by hand is how it gets broken: copy the live value.
- **No DMARC.** Start in monitor mode and tighten later:

  ```
  TXT   _dmarc   v=DMARC1; p=none; rua=mailto:hi@agentsiam.com
  ```

---

## Recommendation

**Path 1 now, Path 2 at renewal.** Zoho SMTP gets notifications working this week for
nothing, with no risk to live mail. Then, when the domain comes up for renewal in
September, transferring to Cloudflare Registrar is cheaper than renewing at Wix *and*
brings free DNS, Resend, DKIM and DMARC with it — one decision, at the moment you have to
make a decision anyway.

Doing Path 2 purely to unblock email would mean a domain transfer and a DNS migration to
solve a problem Zoho already solves for free.
