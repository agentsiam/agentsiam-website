/**
 * The blocked operators, and the check that refuses one.
 *
 * AgentSiam goes to owners directly and never sources through another management company's
 * channels. The list lives in the document store, at
 * as-salesmarketing/01-crm/blocked-operators.json in agentsiam-consulting, which is the
 * source of truth; the CRM README points at it rather than restating it. This module only
 * reads that shape and decides whether a candidate matches it.
 *
 * What the check cannot do is as important as what it can. A blocked operator that co-hosts
 * on an owner's own Airbnb account produces a listing that reads as the owner's, and no
 * amount of string matching catches that. Those outlets carry `matchable: false` and the
 * screen says so instead of implying the check is complete.
 */

export type BlockedOutlet = {
  kind: string;
  value: string;
  channel?: string;
  known_as?: string;
  /** Absent means the identification is settled. False means it is believed but not
   * established, and the outlet is still refused. */
  confirmed?: boolean;
  /** False means no automatic check can catch it. */
  matchable?: boolean;
  note?: string;
};

export type BlockedOperator = {
  operator: string;
  blocked_since: string;
  outlets: BlockedOutlet[];
};

export type BlockedList = {
  about?: string;
  outlet_kinds?: Record<string, string>;
  fields?: Record<string, string>;
  operators: BlockedOperator[];
};

export type BlockedMatch = {
  operator: string;
  outlet: BlockedOutlet;
  /** Which field of the candidate matched, in words a person reads. */
  field: string;
  /** What that field held. */
  value: string;
};

export const OUTLET_KINDS = ["domain", "link", "phone", "handle", "name"] as const;

/** Letters and digits only, lowercased. Everything else is punctuation someone typed one of
 * several ways: @poolvilla-cnx, poolvilla cnx and Poolvilla-CNX are one handle. */
function letters(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/** Digits only. Phone numbers are written with and without a country code, with spaces,
 * dashes and brackets, so the last nine digits are what actually identify one in Thailand. */
function digits(value: string): string {
  return value.replace(/[^0-9]/g, "");
}

function host(link: string): string | null {
  const trimmed = link.trim();
  if (!trimmed) return null;
  try {
    const url = new URL(trimmed.includes("://") ? trimmed : `https://${trimmed}`);
    return url.hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return null;
  }
}

function flatLink(link: string): string {
  return link
    .trim()
    .toLowerCase()
    .replace(/^[a-z]+:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/+$/, "");
}

export type CandidateFacts = {
  propertyName: string;
  /** Source link, map link, photo links: anywhere a blocked outlet's address can hide. */
  links: string[];
  /** The owner or manager contact handle, and anything else handle-shaped. */
  handles: string[];
};

/**
 * The first outlet the candidate matches, or null.
 *
 * First rather than all, because one match is already a refusal and the person needs to
 * know which outlet caught it rather than a list. Unconfirmed outlets refuse exactly like
 * confirmed ones; the refusal says which it was.
 */
export function findBlocked(list: BlockedList, facts: CandidateFacts): BlockedMatch | null {
  const links = facts.links.map((link) => link.trim()).filter(Boolean);
  const handles = facts.handles.map((handle) => handle.trim()).filter(Boolean);
  const name = facts.propertyName.trim();

  for (const operator of list.operators ?? []) {
    for (const outlet of operator.outlets ?? []) {
      if (outlet.matchable === false) continue;
      const found = matchOutlet(outlet, { name, links, handles });
      if (found) return { operator: operator.operator, outlet, ...found };
    }
  }
  return null;
}

function matchOutlet(
  outlet: BlockedOutlet,
  candidate: { name: string; links: string[]; handles: string[] },
): { field: string; value: string } | null {
  const target = outlet.value.trim();
  if (!target) return null;

  if (outlet.kind === "domain") {
    const wanted = host(target);
    if (!wanted) return null;
    for (const link of candidate.links) {
      const found = host(link);
      if (found && (found === wanted || found.endsWith(`.${wanted}`))) {
        return { field: "a link", value: link };
      }
    }
    return null;
  }

  if (outlet.kind === "link") {
    const wanted = flatLink(target);
    if (wanted.length < 4) return null;
    for (const link of candidate.links) {
      if (flatLink(link).includes(wanted)) return { field: "a link", value: link };
    }
    for (const handle of candidate.handles) {
      if (flatLink(handle).includes(wanted)) return { field: "the contact", value: handle };
    }
    return null;
  }

  if (outlet.kind === "phone") {
    const wanted = digits(target).slice(-9);
    if (wanted.length < 8) return null;
    for (const handle of candidate.handles) {
      if (digits(handle).endsWith(wanted)) return { field: "the contact", value: handle };
    }
    for (const link of candidate.links) {
      if (digits(link).endsWith(wanted)) return { field: "a link", value: link };
    }
    return null;
  }

  if (outlet.kind === "handle") {
    const wanted = letters(target);
    // A two-letter handle would match half the world. Four is the shortest that identifies.
    if (wanted.length < 4) return null;
    for (const handle of candidate.handles) {
      if (letters(handle).includes(wanted)) return { field: "the contact", value: handle };
    }
    for (const link of candidate.links) {
      if (letters(link).includes(wanted)) return { field: "a link", value: link };
    }
    if (letters(candidate.name).includes(wanted)) {
      return { field: "the property name", value: candidate.name };
    }
    return null;
  }

  if (outlet.kind === "name") {
    const wanted = letters(target);
    if (wanted.length < 4) return null;
    if (letters(candidate.name).includes(wanted)) {
      return { field: "the property name", value: candidate.name };
    }
    for (const handle of candidate.handles) {
      if (letters(handle).includes(wanted)) return { field: "the contact", value: handle };
    }
    return null;
  }

  return null;
}

/** The sentence a refusal shows. Written here so the screen and the API cannot word it two
 * different ways. */
export function refusalReason(match: BlockedMatch): string {
  const outlet = match.outlet.known_as
    ? `${match.outlet.value} (${match.outlet.known_as})`
    : match.outlet.value;
  const channel = match.outlet.channel ? `${match.outlet.channel} ` : "";
  const unconfirmed =
    match.outlet.confirmed === false
      ? " That identification is not established yet, and the outlet is blocked until it is."
      : "";
  const field = match.field.charAt(0).toUpperCase() + match.field.slice(1);
  return (
    `Refused. ${field} is ${match.value}, which matches the blocked ${channel}outlet ` +
    `${outlet}, belonging to ${match.operator}. AgentSiam goes to owners directly and never ` +
    `sources through another management company's channels.${unconfirmed}`
  );
}

/** Outlets no check can catch, for the screen to show as a standing warning. */
export function unmatchableOutlets(list: BlockedList): Array<{ operator: string; outlet: BlockedOutlet }> {
  const found: Array<{ operator: string; outlet: BlockedOutlet }> = [];
  for (const operator of list.operators ?? []) {
    for (const outlet of operator.outlets ?? []) {
      if (outlet.matchable === false) found.push({ operator: operator.operator, outlet });
    }
  }
  return found;
}

export function candidateFacts(candidate: {
  property_name: string;
  source_link: string;
  map_link: string;
  photo_links: string[];
  contact_handle: string;
}): CandidateFacts {
  return {
    propertyName: candidate.property_name,
    links: [candidate.source_link, candidate.map_link, ...candidate.photo_links],
    handles: [candidate.contact_handle],
  };
}
