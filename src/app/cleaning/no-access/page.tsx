import { Message } from "@/components/cleaning/blocks";
import { TEAM_STRINGS } from "@/lib/cleaning/strings";

/**
 * The only thing a phone with no working access is ever told.
 *
 * One message, and it is the whole of the recovery flow: ask Paul for a new link in LINE.
 * There is no form here, nothing to type, and nothing that mails or texts a way back in,
 * which is deliberate. A "forgot my code" that a stranger can drive is the hole, not the
 * feature.
 *
 * A dead link, a link already used, a link opened on a second phone and a device Paul has
 * revoked all land here and all read the same. Saying which of them happened would tell
 * whoever is holding the phone something about the others.
 */

export const dynamic = "force-dynamic";

export default function NoAccessPage() {
  return (
    <main>
      <Message text={TEAM_STRINGS.askPaul} />
    </main>
  );
}
