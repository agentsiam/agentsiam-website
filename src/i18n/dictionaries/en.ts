// English is the source language. Every other dictionary is typed against this file, so
// adding a key here is a compile error until th.ts and zh.ts carry it too.
//
// Strings are keyed semantically (heroTitleA, not "Stay somewhere") and the keys match
// design_handoff_agentsiam_portal/i18n.js, so a string can be traced back to the design.
// Values marked NEW below were written for this site rather than taken from the handoff --
// the handoff's portal has a search bar and 50 listings, this site has one property -- and
// their Thai and Chinese are unreviewed. Everything else is the handoff's own translation.

export const en = {
  langName: "English",

  // -- chrome -------------------------------------------------------------
  navStay: "Stay",
  navGuests: "Guests", // NEW
  navDestinations: "Destinations", // NEW
  navListProperty: "List your property", // NEW
  navOwners: "Property Owners",
  navContact: "Contact",
  skipToContent: "Skip to content", // NEW
  languageLabel: "Language", // NEW

  footStay: "Stay",
  footOwners: "Owners",
  footCompany: "Company",
  footLegal: "Legal",
  footContact: "Contact",
  footHow: "How it works",
  businessServices: "Business Services",
  terms: "Terms & conditions",
  privacy: "Privacy policy",
  copyright: "© 2026 AgentSiam Co., Ltd.", // NEW (handoff's said "Prototype -- sample data")

  // Shown on /th and /zh above long-form copy that has not been translated yet.
  pendingNote:
    "Not yet translated: property descriptions, legal pages and the detailed owner sections below. Shown in English rather than machine-translated.", // NEW

  // -- home ---------------------------------------------------------------
  heroEyebrow: "Chiang Mai · book direct",
  heroTitleA: "Stay somewhere",
  heroTitleB: "actually looked after.",
  heroSub:
    "One house in Chiang Mai, managed on the ground by the people who answer the phone. More as we take them on.", // NEW (handoff described a portfolio)
  viewProperty: "See the property", // NEW

  forGuests: "For guests",
  forOwners: "For owners",
  guestPanelTitle: "I want to stay here.",
  guestPanelBody:
    "Book direct and you get the rate without the platform markup, and a local number that answers.",
  ownerPanelTitle: "I own a property here.",
  ownerPanelBody:
    "We run the numbers before you sign anything. If it will not earn, we say so.",
  ownerPanelLink: "See how management works",

  featuredTitle: "The property",
  featuredSub: "One house, live now. We would rather run one well than list ten.", // NEW

  whyA: "Best rate, booked direct",
  whyABody:
    "No platform markup between you and the people who run the house.",
  whyB: "A team actually in Chiang Mai",
  whyBBody: "Not a call centre in another timezone. We can be at the property.",
  whyC: "Reachable through your stay",
  whyCBody: "Phone or LINE, 24/7, for the whole time you are here.",

  guestReviews: "What guests said", // NEW
  guestReviewSource: "Airbnb guest review", // NEW

  ownerBandTitle: "Thinking of renting yours out?",
  ownerBandSub:
    "Three steps, in order. The first is a paid study that ends in a straight Go or No-Go — and you can stop after any of them.",
  ownerBandFoot:
    "Landed property in Chiang Mai — houses, townhouses, small buildings.",
  checkQualify: "Check if yours qualifies",
  bookStudy: "Book a feasibility study",
  step: "Step",
  stair1Title: "Feasibility",
  stair1Body:
    "We model what your property would actually earn here, against real occupancy in your area. Costs a fee, commits you to nothing.",
  stair2Title: "Permission",
  stair2Body:
    "Thailand's rules on short stays are specific and often misread. We establish what your building and title genuinely allow.",
  stair3Title: "Management",
  stair3Body:
    "Listings, pricing, guests, cleaning, maintenance. A local team on the ground, not a dashboard.",

  closingGuest: "Still looking for somewhere to stay?",
  closingOwner: "Thinking about renting yours out?",

  // -- /how-it-works ------------------------------------------------------
  ownerHeroEyebrow: "For property owners · Chiang Mai",
  ownerHeroTitle: "We tell you whether to do this before we ask to run it.",
  ownerHeroSub:
    "Three services in a fixed order. The first one is a paid study that ends in a Go or a No-Go — and the No-Go is a real answer we give often enough to mean it.",
  staircaseTitle: "A staircase, not a menu",
  whatYouGet: "What you get",
  notIncluded: "Not included, so there are no surprises",
  vpTitle: "What the fee actually buys",
  vp1Title: "Legal, not just listed",
  vp1Body:
    "We assess your property against the Hotel Act and the non-hotel framework, prepare the documents and file under power of attorney. Most managers skip this step entirely and leave the risk with you.",
  vp2Title: "A team in Chiang Mai",
  vp2Body:
    "We live here. We visit the properties, we meet the guests, and we know which buildings permit short stays. When something breaks at 11pm, someone local reads the message.",
  vp3Title: "Numbers before contracts",
  vp3Body:
    "The feasibility study is paid, and it can end in a No-Go. We judge on the conservative case against a real local long-term comparable, not on the optimistic column.",
  vp4Title: "Channels, plus your own",
  vp4Body:
    "Listings and rates managed across the main OTAs through Beds24, and a direct booking site so not every night pays platform commission. TM30 guest reporting is included.",
  gatesTitle: "The study has to be able to say no.",
  qualifyTitle: "Is your property a fit?",
  mgmtTitle: "What management actually means",
  weDo: "We do this",
  weDont: "We do not",
  reportTitle: "What the report actually looks like", // NEW
  reportBody:
    "Six sections, and the recommendation is the last one rather than the first. The figures below are held back because inventing them would be worse than showing nothing — the real ones are priced against your property.", // NEW
  proofTitle: "One we run ourselves", // NEW
  proofBody:
    "Lotus House, in Chang Khlan. Everything on this page is what we actually do for it — the permission, the channels, the TM30 filings, the guests.", // NEW
  meetTheTeam: "The people who do it", // NEW
  faqTitle: "The questions everyone asks",
  startNumbers: "Start with the numbers.",
  lookingToStay: "Looking for a place to stay instead?",
  step1Name: "Feasibility and ROI study",
  step1Meta: "Ends in a Go or a No-Go",
  step2Name: "Vacation rental permission",
  step2Meta: "The step most managers skip",
  step3Name: "Vacation rental management",
  step3Meta: "Ongoing, no lock-in",

  // -- /contact -----------------------------------------------------------
  contactEyebrow: "For owners",
  contactTitle: "Tell us about your property.",
  contactSub: "Four things to start. Everything else we can cover on a call.",
  yourName: "Your name",
  contactWay: "Email, phone or LINE",
  propertyType: "Property type",
  whereIsIt: "Where is it",
  anythingElse: "Anything else (optional)",
  contactMsgHint:
    "Size, bedrooms, whether it is furnished, anything unusual",
  optional: "optional", // NEW
  phoneOrLine: "Phone or LINE", // NEW
  send: "Send",
  sending: "Sending…", // NEW
  whatHappensNext: "What happens next",
  nextStep1: "We read it and reply within two working days.",
  nextStep2: "A call, then a visit to the property if it looks viable.",
  nextStep3:
    "A written feasibility report with real numbers — including the case for not doing it.",
  businessNote:
    "Asking about business services rather than a property? Write to", // NEW
  guestQnNote:
    "Guest with a question about a booking? Use the booking panel on the property page instead — it carries your dates with it.", // adapted from the handoff

  // -- shared vocabulary --------------------------------------------------
  typeHouse: "House",
  typeTownhouse: "Townhouse",
  typePoolVilla: "Pool villa",
  typeCondoShort: "Condo / apartment",
  bedSuffix: "bed",
  yes: "Yes",
  no: "No",
  areaNimman: "Nimman",
  areaOldCity: "Old City",
  areaSantitham: "Santitham",
  areaChangKhlan: "Chang Khlan",
  areaRiverside: "Riverside",
  areaHangDong: "Hang Dong",
  areaMaeRim: "Mae Rim",
  areaSanSai: "San Sai",

  // -- property page ------------------------------------------------------
  checkDatesAndBook: "Check dates and book", // NEW
  showAllPhotos: "Show all photos",
  photosOf: "Photos of", // NEW
  close: "Close",
  enquireDates: "Enquire about dates", // NEW
  whatThisHas: "What this place has",
  whereYoullBe: "Where you'll be",
  goodToKnow: "Good to know",
  houseRules: "House rules",
  checkIn: "Check-in",
  checkOut: "Check-out",
  bedrooms: "Bedrooms",
  bathrooms: "Bathrooms",
  maxGuests: "Max guests",
  guests: "Guests",
  neighbourhood: "Neighbourhood",

  // -- booking panel ------------------------------------------------------
  // All NEW: the handoff's portal hands booking to a hosted widget, so it has no
  // strings for a calendar, a quote or a request form. Thai and Chinese unreviewed.
  pickDate: "Select", // NEW
  clearDates: "Clear", // NEW
  previousMonth: "Previous month", // NEW
  nextMonth: "Next month", // NEW
  loadingAvailability: "Loading availability…", // NEW
  pricing: "Checking the price…", // NEW
  night: "night", // NEW
  nights: "nights", // NEW
  pickDatesHint: "Pick your dates to see the total. {n}-night minimum.", // NEW
  minStayError: "The minimum stay is {n} nights.", // NEW
  datesUnavailable: "Those dates are not available.", // NEW
  requestToBook: "Request to book", // NEW
  bookAndPay: "Book now, pay online", // NEW
  continueToPayment: "Continue to payment", // NEW
  payNow: "Pay", // NEW
  paying: "Taking payment…", // NEW
  heldNote:
    "Your dates are held while you pay. Card details go straight to our payment provider and are never stored on this site.", // NEW
  paidTitle: "Booked.", // NEW
  paidBody:
    "Payment received and your stay is confirmed. A receipt is on its way to your email, and we will be in touch before you arrive.", // NEW
  requestOnlyNote:
    "We confirm by email, usually the same day. Nothing is charged now.", // NEW
  twoWaysNote:
    "Request to book and we confirm by email, usually the same day. Or pay now and your stay is confirmed straight away.", // NEW
  firstName: "First name", // NEW
  lastName: "Last name", // NEW
  sendRequest: "Send request", // NEW
  back: "Back", // NEW
  requestPrivacyNote:
    "By sending this you agree to us contacting you about your stay. See our", // NEW
  requestSentTitle: "Request sent.", // NEW
  requestSentBody:
    "We will confirm by email, usually the same day. Nothing has been charged.", // NEW
  bookingFailed: "Something went wrong. Please email us at", // NEW
  bookingUnavailable:
    "We could not load the calendar just now. Tell us your dates and we will confirm availability and the total for your stay, usually the same day.", // NEW

  // -- legal + 404 --------------------------------------------------------
  legalEyebrow: "Legal",
  lastUpdated: "Last updated",
  notFoundEyebrow: "Error 404", // NEW
  notFoundTitle: "That page isn't here.", // NEW
  notFoundBody:
    "The link may be out of date, or the address may have a typo in it. Everything on the site is one of these:", // NEW
  notFoundCta: "Tell us what you were looking for", // NEW
  backHome: "Back to the homepage",

  // -- search, filters and results (all NEW) ------------------------------
  where: "Where", // NEW
  any: "Any", // NEW
  filters: "Filters", // NEW
  applyFilters: "Apply", // NEW
  clearFilters: "Clear filters", // NEW
  removeFilter: "Remove this filter", // NEW
  filteringBy: "Filtering by", // NEW
  sort: "Sort", // NEW
  sort_area: "By neighbourhood", // NEW
  sort_price_asc: "Price, lowest first", // NEW
  sort_price_desc: "Price, highest first", // NEW
  features: "Features", // NEW
  fromPrice: "from", // NEW
  perNight: "per night", // NEW
  kmToCentre: "km to centre", // NEW
  oneProperty: "1 place to stay", // NEW
  nProperties: "{n} places to stay", // NEW
  browseByArea: "Browse by neighbourhood", // NEW
  noMatchTitle: "Nothing matches all of that.", // NEW
  noMatchRelax: "Drop the {filter} filter and {n} places come back.", // NEW
  noMatchRelaxOne: "Drop the {filter} filter and one place comes back.", // NEW
  noMatchNothing:
    "Relaxing any one filter would not change it either. Tell us what you are looking for and we will say honestly whether we can help.",
  launchingSoon: "Launching soon", // NEW
  cityComingTitle: "{city} is not open yet.", // NEW
  cityComingBody:
    "We manage properties in Chiang Mai today, on the ground, with our own team. {city} is next. Tell us what you need there and we will come back to you when it opens.",
  browseChiangMai: "Browse Chiang Mai", // NEW
  tellUsWhatYouNeed: "Tell us what you need", // NEW
  type_apartment: "Apartment", // NEW
  type_townhouse: "Townhouse", // NEW
  type_house: "House", // NEW
  type_villa: "Villa", // NEW
  feature_pool: "Pool", // NEW
  feature_rooftop: "Rooftop", // NEW
  feature_kitchen: "Full kitchen", // NEW
  feature_wifi: "Fast Wi-Fi", // NEW
  feature_parking: "Parking", // NEW
  feature_workspace: "Workspace", // NEW
  feature_washer: "Washing machine", // NEW
  feature_pet_friendly: "Pet friendly", // NEW
  filter_areas: "neighbourhood", // NEW
  filter_types: "property type", // NEW
  filter_features: "features", // NEW
  filter_bedrooms: "bedrooms", // NEW
  filter_bathrooms: "bathrooms", // NEW
  filter_guests: "guests", // NEW

  destinationsTitle: "Eight neighbourhoods, honestly described.", // NEW
  destinationsIntro:
    "Chiang Mai is small enough to cross in twenty minutes and varied enough that the neighbourhood decides the holiday. Here is what each one is actually like, and what we manage there.",
  areaNoneYet: "Nothing here yet", // NEW
  areaEmptyTitle: "We do not manage anywhere in {area} yet.", // NEW
  areaEmptyBody:
    "Rather than pad this page out, we would sooner say so. We take on properties one at a time and only where we can look after them properly, so this list grows slowly and on purpose.",
  seeEverything: "See everything we manage", // NEW
  otherAreas: "Other neighbourhoods", // NEW
  searchThisArea: "Search {area}", // NEW

  search: "Search", // NEW
  forkGuestTitle: "I want to stay here.", // NEW
  forkGuestBody:
    "Book direct and you pay no platform markup, and the person who answers your message is the person who looks after the house.",
  forkGuestLink: "Browse all properties", // NEW
  forkOwnerTitle: "I own a property here.", // NEW
  forkOwnerBody:
    "We start with a paid feasibility study that can end in a No-Go. If your place will not earn, we would rather tell you before you sign anything.",
  forkOwnerLink: "See how management works", // NEW

  showMap: "Show map", // NEW
  hideMap: "Hide map", // NEW
  mapLabel: "Map of the places we manage", // NEW

  allProperties: "All properties", // NEW
  footAreas: "Areas we manage", // NEW


  // -- local guide --------------------------------------------------------
  // Strings written for this site: the handoff has no guide. Thai and Chinese unreviewed.
  guideTitle: "Local guide", // NEW
  guideIntro: "Places we have been to ourselves, with how long they take to reach from the house.", // NEW
  guideCount: "{n} places", // NEW
  guideCountOne: "1 place", // NEW
  guideFilterCategory: "What for", // NEW
  guideFilterArea: "Neighbourhood", // NEW
  guideAll: "Everything", // NEW
  guideNearby: "Walkable", // NEW
  guidePicks: "Our favourites", // NEW
  guideWalk: "min walk", // NEW
  guideDrive: "min drive", // NEW
  guideNoWalk: "Too far to walk", // NEW
  guideDirections: "Directions", // NEW
  guideDirectionsApple: "Apple Maps", // NEW
  guideDirectionsGoogle: "Google Maps", // NEW
  guideOutsideAreas: "Further out", // NEW
  guideEmpty: "Nothing matches that combination.", // NEW
  guideClear: "Clear filters", // NEW
  guideFrom: "Times are from {property}.", // NEW
  guideBookDirect: "Book direct with us", // NEW
  guideBookDirectSub: "Same hosts who wrote this guide.", // NEW
  guideAskTitle: "Talk to the AgentSiam local guide", // NEW
  guideAskBody: "Ask us anything about Chiang Mai, or about staying here.", // NEW
  guideAskCta: "Message us on WhatsApp", // NEW
  guideAskPrefill: "Hello AgentSiam, I am reading the Lotus House local guide and have a question.", // NEW
  guideAskDismiss: "Not now", // NEW
} as const;

export type Dictionary = { [K in keyof typeof en]: string };
