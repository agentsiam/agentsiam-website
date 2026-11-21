/**
 * Which of the three owner situations on /how-it-works the reader picked, shared with the
 * owner form further down the same page.
 *
 * The tabs ask "Where are you starting from?" and the form then asked again, in its own
 * words: is the property listed, and is it managed by an agency today. The three tabs answer
 * exactly those two questions, so a tab the owner chose fills them in. The form's own chips
 * still win: anything picked there is never overwritten.
 *
 * Set only by a deliberate tab choice. The first tab is open by default, and an owner who
 * never touched the tabs has not said they are unlisted.
 *
 * Values are the form's own English chip values, so the enquiry record reads the same in
 * every language.
 */
export type OwnerSituationKey = "not-listed" | "self-run" | "managed";

export type OwnerSituation = { listed: "Yes" | "No"; agency: "" | "Yes" | "No" };

export const OWNER_SITUATIONS: Record<OwnerSituationKey, OwnerSituation> = {
  "not-listed": { listed: "No", agency: "" },
  "self-run": { listed: "Yes", agency: "No" },
  managed: { listed: "Yes", agency: "Yes" },
};

let current: OwnerSituation | null = null;
const listeners = new Set<() => void>();

export function chooseOwnerSituation(key: OwnerSituationKey): void {
  current = OWNER_SITUATIONS[key];
  listeners.forEach((listener) => listener());
}

export function subscribeOwnerSituation(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function ownerSituation(): OwnerSituation | null {
  return current;
}
