/**
 * Every word the renter request form shows, read off the dictionary once.
 *
 * It exists because the form is on nine pages now rather than one: the monthly-stay page
 * and every property listed for enquiry. Forty labels written out on each of those pages is
 * nine places for one of them to be missed, and the form is a client component, so it cannot
 * read the dictionary itself without shipping all seven hundred keys to the browser.
 *
 * Nothing here composes a sentence out of two strings. A label is one key, and the two that
 * read as sentences on screen, the reply language and the date flexibility, are each a whole
 * fragment with a select after it, because word order differs in all three languages.
 */

import type { Dictionary } from "@/i18n";
import type { StayRequestLabels } from "@/components/stay-request-form";

export function stayRequestLabels(t: Dictionary): StayRequestLabels {
  return {
    name: t.hfrFormName,
    contactTitle: t.srContactTitle,
    contactPick: t.srContactPick,
    contactKinds: {
      email: t.hfrFormEmail,
      phone: t.srPhone,
      WhatsApp: t.srWhatsApp,
      LINE: t.srLine,
    },
    contactExamples: {
      email: t.srHandleEmail,
      phone: t.srHandlePhone,
      WhatsApp: t.srHandleWhatsApp,
      LINE: t.srHandleLine,
    },
    contactMissing: t.srContactMissing,
    replyLanguage: t.srReplyLanguage,
    answerInline: t.srAnswerInline,
    languages: { en: t.srLangEn, th: t.srLangTh, zh: t.srLangZh },
    optional: t.hfrFormOptional,
    sectionYou: t.srSectionYou,
    sectionLooking: t.srSectionLooking,
    area: t.hfrFormArea,
    areaAny: t.hfrFormAreaAny,
    checkIn: t.hfrFormCheckIn,
    checkOut: t.hfrFormCheckOut,
    flexLabel: t.srFlexLabel,
    datesInline: t.srDatesInline,
    flexibility: {
      exact: t.srFlexExact,
      "a few days either way": t.srFlexFewDays,
      "month only": t.srFlexMonth,
    },
    guests: t.srGuests,
    adults: t.srAdults,
    children: t.srChildren,
    childrenAges: t.srChildrenAges,
    childrenAgesHint: t.srChildrenAgesHint,
    bedroomsMin: t.srBedroomsMin,
    budget: t.hfrFormBudget,
    budgetHint: t.srBudgetHint,
    budgetUnit: t.srBudgetUnit,
    budgetUnits: {
      "per night": t.srUnitNight,
      "per month": t.srUnitMonth,
      "whole stay": t.srUnitStay,
    },
    budgetCurrency: t.srBudgetCurrency,
    mustHavesTitle: t.srMustHavesTitle,
    mustHaves: {
      "fast wifi": t.srMustWifi,
      "a desk": t.srMustDesk,
      "a pool": t.srMustPool,
      parking: t.srMustParking,
      "a kitchen": t.srMustKitchen,
      "air conditioning in every room": t.srMustAircon,
      "a washing machine": t.srMustWasher,
      "walkable to shops": t.srMustWalkable,
    },
    moreTitle: t.srMoreTitle,
    moreHint: t.srMoreHint,
    partyLabel: t.srPartyLabel,
    party: {
      solo: t.srPartySolo,
      couple: t.srPartyCouple,
      family: t.srPartyFamily,
      group: t.srPartyGroup,
      "remote worker": t.srPartyRemote,
    },
    vehicle: t.srVehicle,
    yes: t.yes,
    no: t.no,
    petsLabel: t.srPetsLabel,
    pets: {
      none: t.srPetsNone,
      dog: t.srPetsDog,
      cat: t.srPetsCat,
      other: t.srPetsOther,
    },
    petsCount: t.srPetsCount,
    petsSpecies: t.srPetsSpecies,
    smokingLabel: t.srSmokingLabel,
    smoking: {
      "no one smokes": t.srSmokingNo,
      "outdoors only": t.srSmokingOutdoors,
      indoors: t.srSmokingIndoors,
    },
    notSaid: t.srNotSaid,
    notes: t.srNotes,
    notesHint: t.srNotesHint,
    foundVia: t.hfrFormFoundVia,
    foundViaHint: t.hfrFormFoundViaHint,
    required: t.hfrFormRequired,
    consentOwner: t.srConsentOwner,
    consentOwnerHint: t.srConsentOwnerHint,
    aboutProperty: t.srAboutProperty,
    send: t.hfrFormSend,
    sending: t.hfrFormSending,
    sentTitle: t.hfrFormSentTitle,
    sentBody: t.srSentBody,
    error: t.hfrFormError,
    consent: t.hfrFormConsent,
    privacy: t.hfrFormPrivacy,
  };
}
