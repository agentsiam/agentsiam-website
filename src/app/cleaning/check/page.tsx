import { OfflineCheck } from "@/components/cleaning/offline-check";
import { requireHolder } from "@/lib/cleaning/guard";

/**
 * The support screen for the one thing in this app that cannot be checked from here.
 *
 * Whether the schedule opens with no signal is decided on a real phone by three things in
 * sequence: the browser accepts a service worker, the worker takes control of the page, and
 * the page it fetched gets written into the worker's cache. All three are invisible to the
 * server, there is no console on a phone, and the registration error is deliberately
 * swallowed so that a browser refusing a worker still gets a schedule over the network.
 *
 * So when the first airplane-mode test on a real phone failed, nothing anywhere could say
 * which of the three it was. This page makes the phone answer for itself.
 *
 * Behind the device cookie like every other page here, and deliberately **not** behind the
 * PIN: a phone that cannot get past the PIN is exactly a phone worth reading. It shows no
 * schedule, no address and no door code, only what this browser thinks of its own worker.
 */

export const dynamic = "force-dynamic";

export default async function CheckPage() {
  const holder = await requireHolder();

  return (
    <main>
      <OfflineCheck person={holder.person} />
    </main>
  );
}
