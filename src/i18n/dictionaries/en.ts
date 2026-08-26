// English is the source language. Every other dictionary is typed against this file, so
// adding a key here is a compile error until th.ts and zh.ts carry it too.
//
// Strings are keyed semantically (heroTitleA, not "Stay somewhere") and the keys match
// design_handoff_agentsiam_portal/i18n.js, so a string can be traced back to the design.
// Some values were written for this site rather than taken from the handoff -- the
// handoff's portal has a search bar and 50 listings, this site has one property. All 296
// keys were reviewed in English, Thai and Chinese on 23/08/2026 and the findings applied.
// Everything else is the handoff's own translation. Findings and the reasoning are in
// agentsiam-consulting/as-work/2026-08-18-website-launch-blockers/copy-review-findings.md.

export const en = {
  langName: "English",

  // -- chrome -------------------------------------------------------------
  navStay: "Stay",
  navGuests: "Guests",
  navDestinations: "Destinations",
  navListProperty: "Have us manage yours",
  navOwners: "Property Owners",
  navContact: "Contact",
  skipToContent: "Skip to content",
  languageLabel: "Language",

  footStay: "Stay",
  footOwners: "Owners",
  footCompany: "Company",
  footLegal: "Legal",
  footContact: "Contact",
  footHow: "How it works",
  businessServices: "Business Services",
  terms: "Terms & conditions",
  privacy: "Privacy policy",
  copyright: "© 2026 AgentSiam Co., Ltd.", // replaces the handoff's "Prototype -- sample data"

  // Shown on /th and /zh above long-form copy that has not been translated yet.
  pendingNote:
    "Not yet translated: property descriptions, legal pages and the detailed owner sections below. Shown in English rather than machine-translated.",

  // -- home ---------------------------------------------------------------
  heroEyebrow: "Chiang Mai · book direct",
  heroTitleA: "Stay somewhere",
  heroTitleB: "actually looked after.",
  heroSub:
    "One house in Chiang Mai, managed on the ground by the people who answer the phone. More as we take them on.", // replaces the handoff's portfolio wording
  viewProperty: "See the property",

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
  featuredSub: "One house, live now. We would rather run one well than list ten.",

  whyA: "Direct rate, no platform markup",
  whyABody:
    "No platform markup between you and the people who run the house.",
  whyB: "A team actually in Chiang Mai",
  whyBBody: "Not a call centre in another timezone. We can be at the property.",
  whyC: "Reachable through your stay",
  whyCBody: "Phone or LINE, 24/7, for the whole time you are here.",

  guestReviews: "What guests said",
  guestReviewSource: "Airbnb guest review",

  ownerBandTitle: "Thinking of renting yours out?",
  ownerBandSub: "A menu, not a fixed path. Take the services your property needs and leave the ones it does not. We will tell you which is which.",
  ownerBandFoot: "Houses, townhouses and small buildings in Chiang Mai. Condos too, where the building permits short stays in writing.",
  checkQualify: "Check if yours qualifies",
  bookStudy: "Book a feasibility study",
  step: "Step",
  service: "Service",
  stair1Title: "Feasibility",
  stair1Body:
    "We model what your property would actually earn here, against real occupancy in your area. For when there is no track record to read yet.",
  stair2Title: "Permission",
  stair2Body:
    "Thailand's rules on short stays are specific and often misread. We establish what your building and title genuinely allow, and file for you.",
  stair3Title: "Management",
  stair3Body:
    "Listings, pricing, guests, maintenance. A local team on the ground, not a dashboard. Most owners start here.",

  closingGuest: "Still looking for somewhere to stay?",
  closingOwner: "Thinking about renting yours out?",

  // -- /how-it-works ------------------------------------------------------
  ownerHeroEyebrow: "For property owners · Chiang Mai",
  ownerHeroTitle: "Take the parts you need. Leave the parts you do not.",
  ownerHeroSub: "Six services, chosen against your property rather than sold as a package. Some owners need the numbers first. Some already hold a licence. Some just want the day-to-day run properly. We will tell you which ones actually apply to you.",
  menuTitle: "The menu",
  menuForWho: "Who it is for",
  routeTitle: "Where owners like you usually start",
  routeBody: "Nobody buys all six. What you need depends on whether the property is already earning, and whether it is already licensed. These are the four routes we see most.",
  route1When: "Already listed, and it is doing well",
  route1Take: "Management. Permission too, if you do not hold one.",
  route1Why: "Your own occupancy and rate history is better evidence than anything we could model, so there is nothing for a study to tell you. We read your numbers instead, and it costs you nothing.",
  route2When: "Listed, but the bookings are not coming",
  route2Take: "Start with the study, then management.",
  route2Why: "The question here is diagnostic rather than whether to begin: is it the listing, the pricing, the photographs — or the property. The study answers that against real local comparables instead of guessing, and it is the cheapest thing on this page.",
  route3When: "Not listed yet",
  route3Take: "Study, then permission, then management.",
  route3Why: "There is no history to read, so the numbers have to be modelled before anyone should commit money to it. This is the route the study was built for, and the one where a No-Go saves you the most.",
  route4When: "Already with another manager",
  route4Take: "Bring us your numbers. Management when you are ready.",
  route4Why: "We will look at what the property is actually doing before suggesting anything. If the study would not tell you more than your own statements already do, we will say so rather than sell it to you.",
  addServicesTitle: "Alongside the management",
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
  reportTitle: "What the report actually looks like",
  reportBody: "Six sections, with the recommendation last rather than first. The figures below are hidden because inventing them would be worse than showing nothing. The real figures are calculated for your property.",
  proofTitle: "One we run ourselves",
  proofBody: "Lotus House, in Chang Khlan. Everything on this page is what we actually do for it: permission, channels, TM30 filings and guest care.",
  meetTheTeam: "The people who do it",
  faqTitle: "The questions everyone asks",
  startNumbers: "Start with the numbers.",
  lookingToStay: "Looking for a place to stay instead?",
  step1Name: "Feasibility and ROI study",
  step1Meta: "When there is no track record to read",
  step2Name: "Vacation rental permission",
  step2Meta: "For owners who do not hold one yet",
  step3Name: "Vacation rental management",
  step4Name: "Housekeeping and upkeep",
  step4Meta: "When you would rather not run suppliers",
  step5Name: "Interior photography",
  step5Meta: "Before the listing goes live",
  step6Name: "Interior design and upgrades",
  step6Meta: "When the property could earn more than it does",
  step3Meta: "The day-to-day, no lock-in",

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
  optional: "optional",
  phoneOrLine: "Phone or LINE",
  send: "Send",
  sending: "Sending…",
  whatHappensNext: "What happens next",
  nextStep1: "We read it and reply within two working days.",
  nextStep2: "A call, then a visit to the property if it looks viable.",
  nextStep3: "A written feasibility report with real numbers, including the case for not doing it.",
  businessNote:
    "Asking about business services rather than a property? Write to",
  guestQnNote: "Guest with a question about a booking? Use the booking panel on the property page instead. It carries your dates with it.",  // adapted from the handoff

  // -- shared vocabulary --------------------------------------------------
  typeHouse: "House",
  typeTownhouse: "Townhouse",
  typePoolVilla: "Pool villa",
  typeCondoShort: "Condo / apartment",
  bedSuffix: "{n} bed",
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
  checkDatesAndBook: "Check dates and book",
  showAllPhotos: "Show all photos",
  photosOf: "Photos of {property}",
  close: "Close",
  enquireDates: "Enquire about dates",
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
  // Written for this site: the handoff's portal hands booking to a hosted widget, so it
  // has no strings for a calendar, a quote or a request form.
  pickDate: "Select",
  clearDates: "Clear",
  previousMonth: "Previous month",
  nextMonth: "Next month",
  loadingAvailability: "Loading availability…",
  pricing: "Checking the price…",
  night: "night",
  nights: "nights",
  pickDatesHint: "Pick your dates to see the total. {n}-night minimum.",
  minStayError: "The minimum stay is {n} nights.",
  datesUnavailable: "Those dates are not available.",
  requestToBook: "Request to book",
  bookAndPay: "Book now, pay online",
  continueToPayment: "Continue to payment",
  payNow: "Pay",
  paying: "Taking payment…",
  heldNote:
    "Your dates are held while you pay. Card details go straight to our payment provider and are never stored on this site.",
  paidTitle: "Booked.",
  paidBody:
    "Payment received and your stay is confirmed. A receipt is on its way to your email, and we will be in touch before you arrive.",
  requestOnlyNote:
    "We confirm by email, usually the same day. Nothing is charged now.",
  twoWaysNote:
    "Request to book and we confirm by email, usually the same day. Or pay now and your stay is confirmed straight away.",
  firstName: "First name",
  lastName: "Last name",
  sendRequest: "Send request",
  back: "Back",
  requestPrivacyNote:
    "By sending this you agree to us contacting you about your stay. See our",
  requestSentTitle: "Request sent.",
  requestSentBody:
    "We will confirm by email, usually the same day. Nothing has been charged.",
  bookingFailed: "Something went wrong. Please email us at",
  bookingUnavailable:
    "We could not load the calendar just now. Tell us your dates and we will confirm availability and the total for your stay, usually the same day.",

  // -- legal + 404 --------------------------------------------------------
  legalEyebrow: "Legal",
  lastUpdated: "Last updated",
  notFoundEyebrow: "Error 404",
  notFoundTitle: "That page isn't here.",
  notFoundBody: "The link may be out of date, or the address may contain a typo. Try one of these pages instead:",
  notFoundCta: "Tell us what you were looking for",
  backHome: "Back to the homepage",

  // -- search, filters and results (written for this site) ----------------
  where: "Where",
  any: "Any",
  filters: "Filters",
  applyFilters: "Apply",
  clearFilters: "Clear filters",
  removeFilter: "Remove this filter",
  filteringBy: "Filtering by",
  sort: "Sort",
  sort_area: "By neighbourhood",
  sort_price_asc: "Price, lowest first",
  sort_price_desc: "Price, highest first",
  features: "Features",
  fromPrice: "from",
  perNight: "per night",
  kmToCentre: "{n} km to centre",
  oneProperty: "1 place to stay",
  nProperties: "{n} places to stay",
  browseByArea: "Browse by neighbourhood",
  noMatchTitle: "Nothing matches all of that.",
  noMatchRelax: "Drop the {filter} filter and {n} places come back.",
  noMatchRelaxOne: "Drop the {filter} filter and one place comes back.",
  noMatchNothing:
    "Relaxing any one filter would not change it either. Tell us what you are looking for and we will say honestly whether we can help.",
  launchingSoon: "Launching soon",
  cityComingTitle: "{city} is not open yet.",
  cityComingBody:
    "We manage properties in Chiang Mai today, on the ground, with our own team. {city} is next. Tell us what you need there and we will come back to you when it opens.",
  browseChiangMai: "Browse Chiang Mai",
  tellUsWhatYouNeed: "Tell us what you need",
  type_apartment: "Apartment",
  type_townhouse: "Townhouse",
  type_house: "House",
  type_villa: "Villa",
  feature_pool: "Pool",
  feature_rooftop: "Rooftop",
  feature_kitchen: "Full kitchen",
  feature_wifi: "Fast Wi-Fi",
  feature_parking: "Parking",
  feature_workspace: "Workspace",
  feature_washer: "Washing machine",
  feature_pet_friendly: "Pet friendly",
  filter_areas: "neighbourhood",
  filter_types: "property type",
  filter_features: "features",
  filter_bedrooms: "bedrooms",
  filter_bathrooms: "bathrooms",
  filter_guests: "guests",

  destinationsTitle: "Eight neighbourhoods, honestly described.",
  destinationsIntro:
    "Chiang Mai is small enough to cross in twenty minutes and varied enough that the neighbourhood decides the holiday. Here is what each one is actually like, and what we manage there.",
  areaNoneYet: "Nothing here yet",
  areaEmptyTitle: "We do not manage anywhere in {area} yet.",
  areaEmptyBody:
    "Rather than pad this page out, we would sooner say so. We take on properties one at a time and only where we can look after them properly, so this list grows slowly and on purpose.",
  seeEverything: "See everything we manage",
  otherAreas: "Other neighbourhoods",
  searchThisArea: "Search {area}",

  search: "Search",

  showMap: "Show map",
  hideMap: "Hide map",
  mapLabel: "Map of the places we manage",

  allProperties: "All properties",
  footAreas: "Areas we manage",
  footCities: "Cities we cover",
  homeCity: "Chiang Mai",


  // -- local guide --------------------------------------------------------
  // Strings written for this site: the handoff has no guide.
  guideTitle: "Local guide",
  guideIntro: "Places we have been to ourselves, with how long they take to reach from the house.",
  guideCount: "{n} places",
  guideCountOne: "1 place",
  guideFilterCategory: "What for",
  guideFilterArea: "Neighbourhood",
  guideAll: "Everything",
  guideNearby: "Walkable",
  guidePicks: "Our favourites",
  guideWalk: "{n} min walk",
  guideDrive: "{n} min drive",
  guideNoWalk: "Too far to walk",
  guideDirections: "Directions",
  guideDirectionsApple: "Apple Maps",
  guideDirectionsGoogle: "Google Maps",
  guideOutsideAreas: "Further out",
  guideEmpty: "Nothing matches that combination.",
  guideClear: "Clear filters",
  guideFrom: "Times are from {property}.",
  guideBookDirect: "Book direct with us",
  guideBookDirectSub: "Same hosts who wrote this guide.",
  guideAskTitle: "Talk to the AgentSiam local guide",
  guideAskBody: "Ask us anything about Chiang Mai, or about staying here.",
  guideAskCta: "Message us on WhatsApp",
  guideAskPrefill: "Hello AgentSiam, I am reading the Lotus House local guide and have a question.",
  guideAskDismiss: "Not now",
  // -- page metadata ------------------------------------------------------
  //
  // Titles and descriptions were English in every locale until 18/08/2026: each
  // generateMetadata hardcoded a literal while the body copy was fully translated, so
  // hreflang pointed three URLs at each other and two of them showed an English snippet
  // in search results. These keys are what the pages read now.
  //
  // Area names are deliberately not translated. They render as English on the page
  // itself (they come from AREAS, which has no locale axis), so a translated name in the
  // snippet would not match what the visitor lands on.
  metaHomeTitle: "AgentSiam | Short-term rental management in Chiang Mai",
  metaHomeDesc:
    "Feasibility, vacation rental permission and management for short-term rentals in Chiang Mai. Three separate steps, each one earning the next.",
  metaHowTitle: "Vacation rental management in Chiang Mai",
  metaHowDesc: "Three steps: a paid feasibility and ROI study that may end in a No-Go, the non-hotel exemption filing, then OTA and direct booking management.",
  metaMgmtTitle: "Short-term rental management in {city}",
  metaMgmtDesc: "Feasibility, vacation rental permission and management for short-term rentals in {city}, delivered from our Chiang Mai team.",
  mgmtEyebrow: "For owners",
  mgmtHeroTitle: "Short-term rental management in {city}",
  mgmtHeroSub: "The same three services we run in Chiang Mai, available in {city} when the work comes. It starts with a study that is allowed to say No.",
  mgmtServicesTitle: "What AgentSiam does",
  mgmtScopeTitle: "What we do not do in {city} yet",
  mgmtCtaTitle: "Thinking about short-term letting in {city}?",
  mgmtHowLink: "See how it works",
  metaPropertiesTitle: "Places to stay in Chiang Mai",
  metaPropertiesDesc:
    "Homes, villas and townhouses in Chiang Mai, managed on the ground. Filter by neighbourhood, type and size, and book direct.",
  metaLotusTitle: "Lotus House, a private townhouse near the Night Bazaar",
  metaLotusDesc:
    "A three-storey townhouse with a rooftop terrace in Chang Khlan, Chiang Mai. Two king bedrooms, two bathrooms, a full kitchen and space for four guests.",
  metaGuideTitle: "{property} local guide",
  metaGuideDesc:
    "{n} places around {property} in Chiang Mai, chosen by the hosts, with walking and driving times from the door.",
  metaDestinationsTitle: "Chiang Mai neighbourhoods",
  metaDestinationsDesc: "Eight Chiang Mai neighbourhoods: Nimman, Old City, Santitham, Chang Khlan, Riverside, Hang Dong, Mae Rim and San Sai, and what each is like.",
  metaAreaTitle: "Staying in {area}, Chiang Mai",
  metaAreaDesc:
    "{area}: {vibe}. What the neighbourhood is like, and the places we manage there.",
  metaContactTitle: "Contact",
  metaContactDesc:
    "Tell us about your property in Chiang Mai and we will come back to you about a feasibility study, a permission filing or full management.",
  metaBusinessTitle: "Business services",
  metaBusinessDesc:
    "For businesses entering Thailand: company setup and compliance, OEM and supply chain, ecommerce launch on LINE, TikTok, Shopee and Lazada, and growth.",
  metaTermsTitle: "Terms and conditions",
  metaTermsDesc:
    "The terms covering AgentSiam's feasibility study, vacation rental permission and short-term rental management services, and use of this website.",
  metaPrivacyTitle: "Privacy policy",
  metaPrivacyDesc:
    "How AgentSiam collects, uses and stores the information you send through this site, and the rights you have over it under Thailand's PDPA.",
  addressAfterBooking: "We send the exact address when your booking is confirmed.",
  adults: "Adults",
  children: "Children",
  childrenNote: "Everyone counts toward the maximum, whatever their age.",
  whatThisPlaceIsNot: "Limits to know before booking",
  childSupervision: "Toddlers need supervision on the stairs and the roof terrace.",
} as const;

export type Dictionary = { [K in keyof typeof en]: string };
