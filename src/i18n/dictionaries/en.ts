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
  talkToUs: "Tell us about your property",
  svcStudyTitle: "Feasibility",
  svcStudyBody:
    "We model what your property would actually earn here, against real occupancy in your area. For when there is no track record to read yet.",
  svcPermissionTitle: "Permission",
  svcPermissionBody:
    "Thailand's rules on short stays are specific and often misread. We establish what your building and title genuinely allow, and file for you.",
  svcManagementTitle: "Management",
  svcManagementBody:
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
  vibeNimman: "cafés, co-working and the city's design district",
  vibeOldCity: "inside the moat, temples and the Sunday walking street",
  vibeSantitham: "local markets, quieter streets, walkable to Nimman",
  vibeChangKhlan: "Night Bazaar, riverside restaurants, close to everything",
  vibeRiverside: "along the Ping, slower pace, garden houses",
  vibeHangDong: "pool villas, space and mountain views south of town",
  vibeMaeRim: "valley resorts and rice fields north of the city",
  vibeSanSai: "suburban, family houses, near the international schools",
  formConsent: "By sending this form you agree to us contacting you about your enquiry. See our",
  labelEmail: "Email",
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
  startNumbers: "Not sure it is worth doing?",
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
  nextStep3: "A written proposal covering only the services your property needs, including where we think you need none of them.",
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
    "Feasibility, vacation rental permission and management for short-term rentals in Chiang Mai. Take the services your property needs and leave the ones it does not.",
  metaHowTitle: "Vacation rental management in Chiang Mai",
  metaHowDesc: "Six services, chosen against your property rather than sold as a package. Feasibility, the non-hotel exemption filing, and OTA and direct booking management.",
  metaMgmtTitle: "Short-term rental management in {city}",
  metaMgmtDesc: "Feasibility, vacation rental permission and management for short-term rentals in {city}, delivered from our Chiang Mai team.",
  mgmtEyebrow: "For owners",
  mgmtHeroTitle: "Short-term rental management in {city}",
  mgmtHeroSub: "The same three services we run in Chiang Mai, available in {city} when the work comes. Take the ones your property needs.",
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

  // -- accessible names for chrome and controls ----------------------------
  // Two navigation landmarks per page once a breadcrumb is on it, so both need names.
  mainNav: "Main",
  // The wordmark's link. It went out as "AgentSiam — Guests" on every page, which named a different destination than the one it goes to.
  homeLink: "AgentSiam — home",
  breadcrumbLabel: "Breadcrumb",
  // {alt} is the photo's own description. Without the verb the button is named by the description alone and nothing says it opens anything.
  openPhoto: "Open photo: {alt}",
  newTab: "opens in a new tab",
  // {app} is Google Maps or Apple Maps, {place} the place name. Eighteen identical "Google Maps" links on one screen is a link list nobody can use.
  directionsTo: "{app} directions to {place}",
  filtersPanel: "Filter properties",
  guideFilterPicks: "Shortlist",

  // -- property page: amenities, location, guest questions -----------------
  // Three of the seven features on Lotus House had no label, so they were dropped from the JSON-LD silently and could not be rendered on the page at all.
  feature_smart_tv: "Smart TV",
  feature_safe: "In-room safe",
  feature_soaking_tub: "Rooftop soaking tub",
  // {area} and {type}. The spec asks the eyebrow to name the neighbourhood and the exact property noun, because the noun is the fastest way to tell a townhouse from a condo.
  propertyEyebrow: "{area} · {type}",
  gettingAround: "Getting around",
  // The minutes come from GUIDE_DISTANCES, routed per property. Saying so is the source-in-the-same-unit rule.
  gettingAroundBody: "Walking and driving times measured from the door, on the same routes the guide uses.",
  minWalk: "{n} min walk",
  minDrive: "{n} min drive",
  // The guide had no inbound link from anywhere on the site. 109 places, reachable only from the sitemap.
  guideCardTitle: "The local guide",
  guideCardBody: "{n} places around the house, chosen by the hosts, with walking and driving times from the door. Coffee, street food, temples, markets and the places we send friends to.",
  guideCardLink: "Open the local guide",
  guestFaqTitle: "Before you book",
  gq1: "What time is check-in?",
  // Times are property.checkIn / checkOut, interpolated. Nothing is promised about early arrival because nothing about it is known here.
  ga1: "Check-in from {in}, check-out by {out}. If your flight lands outside those hours, message us and we will tell you what is possible on your dates.",
  gq2: "Is there parking?",
  ga2: "Gated parking for one car. Motorbike rental can be arranged before you arrive.",
  gq3: "Can I bring a pet?",
  ga3: "No, on any stay.",
  gq4: "How many people can stay?",
  ga4: "{n}. Everyone counts toward that, whatever their age.",
  gq5: "What is the shortest stay?",
  ga5: "{n} nights. Some dates carry a longer minimum, and the calendar says so when they do.",
  gq6: "When do I get the address?",
  ga6: "When your booking is confirmed. The listing shows the neighbourhood only, and the confirmation carries the exact address, the Grab address, and how to find the door.",
  gq7: "What happens if I need to cancel?",
  // There is no published cancellation policy anywhere on the site, including the terms. Boilerplate would be inventing legal text, so this says what is true and gives a route. Replace it the day a policy is agreed.
  ga7: "We have not published a standard cancellation policy yet. If your dates might move, write to us before you book and we will put the terms for your stay in writing.",
  // A guest with a question and no dates had nowhere to go: the booking button needs dates, and /contact sends guests back here.
  askTitle: "Still have a question?",
  askBody: "Write to us about this house. A person answers, usually the same day.",
  askEmail: "Email us about this house",
  // The subordinate cross-link to the other audience. Plain text, never a second primary CTA.
  ownerReentry: "Own a place like this in Chiang Mai?",
  ownerReentryLink: "See how management works",
  approxPin: "The pin is approximate until your booking is confirmed.",

  // -- orientation anchors on the property page ----------------------------
  // Short labels for the six guide rows the orientation block measures against. The rows carry full registered names, which are right in a directory of 109 places and wrong in a six-line list.
  anchorShop: "Nearest shop",
  anchorMarket: "Kad Kom local market",
  anchorNightBazaar: "Night Bazaar",
  anchorWalkingStreet: "Sunday Walking Street",
  anchorOldCity: "Old City, Wat Phra Singh",
  anchorAirport: "Airport terminal",

  // -- sticky booking bar --------------------------------------------------
  // The mobile bar's link into the panel. Short on purpose: it sits beside a price in a 390px row.
  checkAvailability: "Check dates",

  // -- business services and city pages ------------------------------------
  // /business-services hero. The page is footer-linked only and stays that way.
  bsEyebrow: "Consulting · entering the Thai market",
  bsHeroTitle: "Consulting work, alongside the rentals.",
  bsHeroSub: "A second line of work beside the rental business. Four areas, taken on where we can do them properly and declined where we cannot. Rental management is what we do day to day, which is why this page is linked from the footer rather than from the main navigation.",
  bsCtaPrimary: "Tell us what you are planning",
  bsCtaSecondary: "How an engagement starts",
  // Cross-line plain-text route out to the owner page, one tier below the CTA pair.
  bsRentalNote: "Here about renting out a property instead?",
  bsPillarsTitle: "The four areas we work in",
  bsPillarsIntro: "Each one is a scope of work rather than a package. Most projects need one or two of them, and where a project needs none of them we will say so.",
  // Marks a deliberate gap. Nothing behind this label is a capability claim.
  bsPendingLabel: "Not published yet",
  bsLimitLabel: "What this is not",
  bsPillar1Hook: "Structured and compliant from day one.",
  bsPillar1Name: "Business Setup & Compliance Advisory",
  bsPillar1Body: "We coordinate company registration, licensing and tax setup with legal and accounting partners, so the paperwork is right before you open rather than fixed after an inspection.",
  bsPillar1Get1: "Company registration coordinated end to end with a licensed Thai partner.",
  bsPillar1Get2: "The licences and permits your activity actually requires, identified before you commit to premises or staff.",
  bsPillar1Get3: "Tax registration and a working accounting arrangement, set up with an accounting partner.",
  bsPillar1Pending: "The document checklist and the timeline for each company structure are not published here yet. We send the current version for your case.",
  bsPillar1Limit: "We coordinate the work and stay in the room for it. We are not a law firm or an accounting firm, and we do not give legal or tax advice ourselves.",
  bsPillar2Hook: "From product idea to market-ready goods.",
  bsPillar2Name: "OEM & Supply Chain Enablement",
  bsPillar2Body: "We help you find and vet manufacturers, manage sampling, and get production ready inside Thailand's manufacturing ecosystem.",
  bsPillar2Get1: "A shortlist of manufacturers found and vetted against your product, not a directory export.",
  bsPillar2Get2: "Sampling managed through the rounds it takes to reach a sample you approve.",
  bsPillar2Get3: "The production and supply steps prepared, so the first real order can be placed.",
  bsPillar2Pending: "Which product categories we have run this in, and the factories behind them, are not published here yet.",
  bsPillar2Limit: "We do not manufacture, and we do not buy, hold or resell your stock. The supply agreement is between you and the factory.",
  bsPillar3Hook: "Live on LINE, TikTok, Shopee, Lazada.",
  bsPillar3Name: "Ecommerce & Local Platform Launch",
  bsPillar3Body: "We set up your store, connect local payment methods, and localize content for the platforms Thai shoppers actually use.",
  bsPillar3Get1: "Your store opened on the platforms that matter for your category, rather than on all of them at once.",
  bsPillar3Get2: "Thai payment methods connected, so a local buyer can pay the way they normally pay.",
  bsPillar3Get3: "Product content written and laid out in Thai for each platform, not translated once and pasted everywhere.",
  bsPillar3Pending: "Which platforms we recommend for which category, and what each one costs to run, are not published here yet.",
  bsPillar3Limit: "This is launch work. Day-to-day selling, customer service and order fulfilment stay with your team unless we agree otherwise in writing.",
  bsPillar4Hook: "Strategy connected to execution.",
  bsPillar4Name: "Growth, Marketing & Operations Integration",
  bsPillar4Body: "Localized branding and marketing, wired into the operational workflows that actually run day to day.",
  bsPillar4Get1: "Brand and messaging adapted for a Thai audience rather than translated from your home market.",
  bsPillar4Get2: "A marketing plan per channel, saying what each channel is for and how it will be judged.",
  bsPillar4Get3: "The handover points between marketing and operations written down, so an enquiry does not stop at the boundary.",
  bsPillar4Pending: "What we report back, and how often, is not published here yet.",
  bsPillar4Limit: "We build the plan and connect it to your workflows. We do not take over your team, and we do not run your operations for you.",
  bsStartTitle: "How an engagement starts",
  bsStep1Title: "You write to us",
  bsStep1Body: "Tell us what you are planning, where you are starting from, and what is already decided. The address for business enquiries is on the contact page.",
  bsStep2Title: "We come back to you and set up a call",
  bsStep2Body: "The first thing we work out on that call is which of the four areas your project actually needs, and which of them it does not.",
  bsStep3Title: "What happens after that",
  // Deliberate gap. There is no agreed consulting intake process to publish.
  bsStep3Body: "How the work is scoped, staged and quoted after that call is not published here. Consulting engagements differ enough that a published sequence would be a guess, and leaving the gap visible is more useful to you than filling it.",
  bsPriceNote: "Nothing on this page carries a price. Work is quoted against the scope once there is one.",
  bsCloseTitle: "Planning something in Thailand?",
  bsCloseBody: "Tell us what you are building and where you are starting from. If the work is outside what we do, we will say so rather than take it on.",
  bsEmailCta: "Email us directly",
  // /management/[city] hero. Replaces the wording that said three services when there are six. {city} is the English city name.
  mgmt2HeroSub: "The same services we run in Chiang Mai, available in {city} when the work comes. Take the ones your property needs and leave the rest.",
  mgmt2ServicesIntro: "A menu, not a fixed path. Six services, and most owners take two or three. Neither the study nor the permission is a step you have to pass before the next one, and we will tell you which ones apply to your property.",
  mgmt2Svc1Body: "A site visit, a written analysis and an hour on a call going through it. We model the property against real comparables and end on a straight Go or No-Go. A projection is not a promise, so we show you the conservative case and judge on that one.",
  mgmt2Svc2Body: "Short-stay letting in Thailand is governed by the Hotel Act and the non-hotel accommodation framework. We assess what the property is allowed to do, prepare the documents and file under power of attorney. We handle the application. We cannot guarantee the government's decision, and the route differs for a condominium, where the building's own written permission is the basis rather than the exemption.",
  mgmt2Svc3Body: "Listings across the main OTA channels, a direct booking site so not every night pays commission, channel and rate management, guest communication, review management, and compliance upkeep including TM30 reporting.",
  mgmt2AlsoIntro: "These three run alongside management rather than in front of it. Take them with it, or on their own.",
  mgmt2Svc4Body: "The turnover, the laundry, the consumables and the maintenance visits, arranged and supervised. Added per turnover, and the supplier cost is passed through to you without a markup.",
  mgmt2Svc5Body: "Interior and exterior photography, shot and edited to the standard the channels reward. Photography is the single biggest lever on how a listing performs.",
  mgmt2Svc6Body: "Where the numbers are held back by the property itself rather than by the listing, we advise on what to change, what it would cost, and whether the return justifies it.",
  mgmt2Fees: "Fees are quoted per property.",
  mgmt2Scope1: "Our home market is Chiang Mai. That is where the team, the District Office relationship and the properties we run are. We take work in {city} when it comes, and it is delivered from Chiang Mai.",
  mgmt2Scope2: "So we do not claim local area knowledge here yet, we have no {city} property to show you, and we have not published market data for this city. If what you need is a manager with people on the ground in {city} this week, we are not that yet, and it is cheaper for both of us to say so now.",
  mgmt2Scope3: "What travels is the work itself: the feasibility model, the licensing route, the channel and rate management, the compliance upkeep. That is most of it, and the study will tell you honestly whether the numbers work before you commit to anything.",
  mgmt2CtaBody: "Tell us what the property is and what it is doing now. If a study would genuinely tell you something your own numbers do not, we will say so, and it ends in a Go or a No-Go we are willing to hand you.",
  // Subordinate cross-audience route out. Plain text, never a second primary CTA.
  mgmt2GuestLink: "See the places we manage in Chiang Mai",

  // -- neighbourhood pages -------------------------------------------------
  // Section heading above the 2-3 paragraph description of the neighbourhood.
  areaWhatTitle: "What it is like",
  // Section heading above the places pulled from GUIDE_PLACES for this area.
  areaGuideTitle: "Places nearby, from our guide",
  // Says where the notes come from. The guide comments are English in all three locales because the source sheet is English, so the Thai and Chinese say so.
  areaGuideSub: "From the guide we write for our own guests. The note under each place is the host's own.",
  // Link out to the local guide filtered to this area.
  areaGuideAll: "See all {n} in the local guide",
  areaWhoTitle: "Who it suits",
  // Marks the block as judgement, not fact.
  areaWhoNote: "Judgement rather than fact. This is how we answer a guest who asks us to choose between neighbourhoods.",
  // Shown on the three areas with no entries in the guide dataset. Marks the description above as general rather than checked.
  areaUnsourced: "We have no first-hand notes on file for this neighbourhood. The guide we write for guests was built outwards from a house in Chang Khlan and does not reach here yet, so the description above is general rather than something we have walked and checked.",
  // Distance figure with its origin named. CITY_CENTRE in areas.ts is Tha Phae Gate.
  areaKmFromGate: "{n} km from Tha Phae Gate",
  // The method behind the figure. distanceKm() is crow-flies on purpose.
  areaKmNote: "Straight line, not a road distance.",
  areaCloseTitle: "Not sure this is the right neighbourhood?",
  areaCloseBody: "Tell us who is travelling and what you want inside a ten minute walk. We will say which part of Chiang Mai fits, including when the answer is one we manage nothing in.",
  areaCloseGuide: "Read the local guide",
  // Index card line: how many guide places sit in this area.
  areaGuideCount: "{n} places in our guide",
  areaGuideCountOne: "1 place in our guide",
  areaGuideCountNone: "Not in our guide yet",
  areaIndexCloseTitle: "None of them quite right?",
  areaIndexCloseBody: "Tell us the trip rather than the neighbourhood. We answer with what actually fits, even when that means pointing you at a part of the city we manage nothing in.",
  // Owner-facing cross-link at the foot of the index. Owner register, so Thai takes ท่าน.
  areaOwnerCross: "Own a property in one of these neighbourhoods?",
  areaNimmanP1: "Nimmanhaemin Road and the numbered sois that run off it. Coffee is close to a local industry here, most cafés are half full of people working, and the lower sois hold the roasters, design shops and restaurants that open late.",
  areaNimmanP2: "It sits west of the Old City, next to the university, with Doi Suthep behind it. Maya and One Nimman anchor either end. Reaching the moat is a ten minute drive or a long flat walk, which is the trade this neighbourhood asks you to make.",
  areaNimmanP3: "Our local guide holds only three places in Nimman. That is a limit of the guide rather than of the neighbourhood: it was written outwards from a house in Chang Khlan and covers what our own guests walk to. Read the list below as our notes, not as a survey.",
  areaNimmanSuitA: "Working trips: reliable Wi-Fi, cafés that tolerate a laptop for three hours, co-working within walking distance.",
  areaNimmanSuitB: "Stays of a week or more, where going back to the same coffee place matters more than being beside the temples.",
  areaNimmanSuitC: "Eating and drinking without ordering a ride first.",
  areaNimmanNot: "Less suited to a short first visit built around the Old City, which is a ride away at the end of every evening.",
  areaOldCityP1: "The square kilometre inside the moat, and the streets immediately around it. Wat Phra Singh, Wat Chedi Luang and Wat Chiang Man all sit within twenty minutes of each other on foot, which is why most first visits to Chiang Mai are spent here.",
  areaOldCityP2: "Sunday evening is the Sunday Walking Street, when Ratchadamnoen closes to traffic end to end. Saturday evening is the Wua Lai street, just outside the south moat. Both are worth planning around, in either direction: some guests book for them and some book to avoid them.",
  areaOldCityP3: "After dark some lanes are loud and some are silent, and sometimes it is the same lane. Our guide has more entries here than anywhere except Chang Khlan, and they lean towards temples, museums and small bars.",
  areaOldCitySuitA: "A first visit, where walking distance to the temples decides how the days are spent.",
  areaOldCitySuitB: "Short stays: three or four nights, no vehicle, no fixed plan.",
  areaOldCitySuitC: "Travellers who want the Sunday market on the doorstep rather than a ride away.",
  areaOldCityNot: "Less suited to a long stay with a car. Parking inside the moat is genuinely difficult and the lanes are narrow.",
  areaSantithamP1: "North of the moat and east of Nimman, Santitham is where a lot of people who live in Chiang Mai actually live. Food is cheap and good, the markets are for residents rather than visitors, and the rents behind that are why the cafés have not taken the whole street.",
  areaSantithamP2: "Nimman is fifteen to twenty five minutes on foot from most of it, and the Old City is a short ride. Our guide holds two places here, so the description above comes from the neighbourhood's own character rather than from notes we have written down.",
  areaSantithamSuitA: "Longer stays where the daily cost of eating shows up in the budget.",
  areaSantithamSuitB: "Guests who want Nimman nearby without paying Nimman prices.",
  areaSantithamSuitC: "Anyone comfortable in a neighbourhood that is not arranged around visitors.",
  areaSantithamNot: "Less suited to a short first visit. Little here is a sight, and the walk to the moat is not a pleasant one at midday.",
  areaChangKhlanP1: "The strip between the south east corner of the Old City and the Ping, built around the Night Bazaar, which trades every evening of the year. Behind the bazaar it turns residential fast: lanes of houses, the wet market at Kad Kom, and small kitchens that open at six in the morning.",
  areaChangKhlanP2: "This is where we manage, and the part of Chiang Mai we know in more detail than any other. The guide we write for our own guests holds more entries here than in the other seven neighbourhoods combined, from the nearest pharmacy to the khao soi place people queue at.",
  areaChangKhlanP3: "Khlong Mae Kha, the canal running through it, has been reopened as a walkway and has changed the character of the blocks it passes. The hotels on the main road bring traffic, and with it the gyms, spas and pools that sell day passes.",
  areaChangKhlanSuitA: "Guests who want the Old City and the river both inside walking distance.",
  areaChangKhlanSuitB: "Anyone who eats where the neighbourhood eats rather than where the guidebooks point.",
  areaChangKhlanSuitC: "Stays where the Night Bazaar is the point, or where late food matters.",
  areaChangKhlanNot: "Less suited to guests who want quiet at all hours. Chang Khlan Road is a main road, and the blocks nearest the bazaar do not go quiet early.",
  areaRiversideP1: "The east bank of the Ping and the lanes behind it. Wat Ket is the old quarter here, and this is the part of the city where the pace drops without you having to leave it: teak houses, gardens, a couple of galleries, restaurants facing the water.",
  areaRiversideP2: "Our guide's entries here are mostly coffee, one temple and places to eat by the water. Crossing a bridge puts you at the Night Bazaar in about ten minutes on foot, and inside the moat in about twenty five.",
  areaRiversideP3: "It is a narrow neighbourhood. Streets one row back from the water read as ordinary city rather than riverside, so the difference between an address that faces the river and one that does not is a real one.",
  areaRiversideSuitA: "Couples and slower trips built around long meals rather than a list of sights.",
  areaRiversideSuitB: "Guests who want the centre reachable on foot but not outside the window.",
  areaRiversideSuitC: "Anyone who would rather have a garden than a lift and a lobby.",
  areaRiversideNot: "Less suited to travellers with no plan for the evening. Choice thins out quickly a few streets back from the water.",
  areaHangDongP1: "South west of the city, past the airport, where the land opens out. Most of Chiang Mai's pool villas are here: single storey houses on their own plots, mountain on one side and rice on the other, with enough between neighbours that the pool is genuinely private.",
  areaHangDongP2: "It works on the assumption that you drive. There is no walkable centre in the way the Old City has one, and a ride into town is twenty to thirty minutes depending on the hour. Ban Tawai, the handicraft village, and the weekend markets around it are why a lot of visitors come out this way.",
  areaHangDongSuitA: "Families and groups who want a pool, a kitchen and rooms that are not stacked on top of each other.",
  areaHangDongSuitB: "Anyone renting a car or a motorbike in any case.",
  areaHangDongSuitC: "Stays where the house is the holiday rather than the base for one.",
  areaHangDongNot: "Less suited to a trip without a vehicle. Every errand becomes a booked ride, and the fares add up faster than the villa saves.",
  areaMaeRimP1: "North of the city along the 107 and then up into the valley. Resorts, gardens, elephant camps and rice fields, with the road climbing gently the whole way. Temperatures run a degree or two below the city and the air is usually better for it.",
  areaMaeRimP2: "It is a district rather than a neighbourhood: two addresses several kilometres apart both say Mae Rim, and what a stay is like depends almost entirely on which side of the road it is on and how far up the valley. Nothing here is walkable to anything else.",
  areaMaeRimSuitA: "Stays where quiet, green and cool are the point rather than being close in.",
  areaMaeRimSuitB: "Guests with a car, or a property that runs its own transport.",
  areaMaeRimSuitC: "The second half of a trip, after the city has been walked.",
  areaMaeRimNot: "Less suited to anyone who needs the city daily. The drive back in is forty minutes in the wrong part of the day.",
  areaSanSaiP1: "North east of the city, on the way to the ring road and the international schools. Suburban in the plain sense: housing estates, family houses with gardens, supermarkets rather than markets, and a lot of residents who drive into Chiang Mai every morning.",
  areaSanSaiP2: "It is somewhere people live rather than somewhere people visit, which is the honest description and also the appeal for a long stay. The city is fifteen to twenty five minutes by car, and the airport is on the far side of it.",
  areaSanSaiSuitA: "Families relocating, or trying the city for a season before committing.",
  areaSanSaiSuitB: "Long stays where a garden, a car park and a supermarket matter more than nightlife.",
  areaSanSaiSuitC: "Guests with children at one of the international schools nearby.",
  areaSanSaiNot: "Less suited to a short holiday. There is very little to walk to, and everything you came to Chiang Mai for is a drive away.",

  // -- neighbourhood pages, second pass ------------------------------------
  // Supersedes areaUnsourced. Same copy, with the neighbourhood name interpolated from areaChangKhlan rather than spelled out inside the sentence: the Chinese transliteration in the first pass did not match the one the dictionary already uses.
  areaUnsourcedFrom: "We have no first-hand notes on file for this neighbourhood. The guide we write for guests was built outwards from a house in {area} and does not reach here yet, so the description above is general rather than something we have walked and checked.",
  // Supersedes areaNimmanP3.
  areaNimmanGuide: "Our local guide holds only three places in Nimman. That is a limit of the guide rather than of the neighbourhood: it was written outwards from a house in {area} and covers what our own guests walk to. Read the list below as our notes, not as a survey.",
  // Supersedes areaOldCityP3.
  areaOldCityGuide: "After dark some lanes are loud and some are silent, and sometimes it is the same lane. Our guide has more entries here than anywhere except {area}, and they lean towards temples, museums and small bars.",
  // Supersedes areaSantithamP1.
  areaSantithamWhere: "North of the moat and east of Nimman, {area} is where a lot of people who live in Chiang Mai actually live. Food is cheap and good, the markets are for residents rather than visitors, and the rents behind that are why the cafés have not taken the whole street.",
  // Supersedes areaSanSaiP2.
  areaSanSaiLiving: "{area} is somewhere people live rather than somewhere people visit, which is the honest description and also the appeal for a long stay. The city is fifteen to twenty five minutes by car, and the airport is on the far side of it.",
  // Supersedes areaChangKhlanNot. The road is named after the neighbourhood, so the name comes from the same key the rest of the site uses.
  areaChangKhlanRoad: "Less suited to guests who want quiet at all hours. {area} Road is a main road, and the blocks nearest the bazaar do not go quiet early.",

  // -- property search -----------------------------------------------------
  // Eyebrow above the results count on /properties.
  psEyebrow: "Places to stay",
  // Sits under the h1 count, before the honest-gap note.
  psSubhead: "Every place we manage in Chiang Mai, with our own photographs and the real distance to the centre.",
  // Says why the list is short. Same register as areaEmptyBody on /destinations.
  psGapNote: "One place is live today and more are being taken on. We add properties one at a time, and only where we can look after them properly.",
  // Owner link inside the gap note, points at /how-it-works.
  psGapLink: "Own a place in Chiang Mai? See how it works.",
  // Ends the chip row. Clears the filters only, never the city, dates or sort.
  psClearAll: "Clear all",
  // Guest-count chip, and the guests entry in the Filtering by line.
  psGuestsN: "{n} guests",
  // Closing CTA at the foot of /properties.
  psCtaTitle: "Not seeing the right place?",
  psCtaBody: "Tell us your dates and what matters to you. We will say honestly whether we can help, and we will not send you somewhere we do not look after.",
  psOwnerCta: "See how it works for owners",

  // -- booking panel: states, errors, calendar labels, hero search ---------
  // The pricing call 5xx'd or the network dropped. Deliberately NOT 'not available' -- we do not know that.
  bkQuoteFailed: "We could not check the price just now.",
  bkQuoteFailedHint: "You can still send a request. We check the price again before we reply.",
  bkTryAgain: "Try again",
  bkPriceTotal: "Total",
  // Labelled as an average on purpose: length-of-stay pricing means the total is not rate x nights.
  bkPriceAverage: "{price} average per night",
  bkPriceNote: "This is the price for your whole stay. It can differ from the nightly rates above, because longer stays are priced differently.",
  // Shown when the calendar has been clamped at maxStay, before any quote is asked for.
  bkLongStayNote: "{n} nights is the longest stay you can book online. For longer, email us and we will arrange it.",
  bkEmailUs: "Email us",
  // Per-night minimum from the live calendar, not the property default.
  bkMinStayOnDate: "Check-in on {date} needs at least {n} nights.",
  // Announced in the live region after the first date is picked.
  bkPickedCheckIn: "Check-in {date} selected. Now pick your check-out date.",
  bkPickedRange: "{from} to {to} selected. {n} nights.",
  bkPickedRangeOne: "{from} to {to} selected. 1 night.",
  // sr-only table caption. The month and year exist nowhere else in the table's accessible name.
  bkCalendarCaption: "Availability in {month}",
  bkCalendarReady: "Availability loaded. Pick your check-in date.",
  bkDayTaken: "{date}, already booked",
  bkDayCheckIn: "{date}, your check-in",
  bkDayCheckOut: "{date}, your check-out",
  bkRequired: "required",
  bkFieldRequired: "Please fill this in.",
  bkEmailInvalid: "Please enter an email address we can reply to.",
  // The guest changed something while the form was open and the dates stopped being bookable.
  bkFormStale: "These dates cannot be booked right now. Please pick your dates again above.",
  bkPickAgain: "We have refreshed the calendar. Please pick your dates again. What you typed is saved.",
  bkErrDatesTaken: "Those dates were taken while you were filling this in.",
  bkErrUnavailable: "Those dates are no longer available.",
  bkErrRateLimited: "That is a lot of attempts from this connection.",
  bkRetryInMinutes: "Please try again in about {n} minutes.",
  bkRetryInAMinute: "Please try again in about a minute.",
  bkOrEmailUs: "Or email us at",
  bkErrQuoteFailed: "We could not check those dates just now.",
  bkErrBadContact: "Please check your name and email address.",
  bkErrPastArrival: "That check-in date has passed. Please pick again.",
  bkErrNotConfigured: "Booking is unavailable right now.",
  bkErrMaxGuests: "This house sleeps up to {n} guests.",
  bkErrMaxStay: "Stays longer than {n} nights are arranged by email.",
  bkErrTooFarAhead: "We take bookings up to {n} months ahead. Please email us for dates further out.",
  bkReference: "Reference",
  bkYourStay: "Your stay",
  bkWeWillEmail: "We will email {email}.",
  bkAmountPaid: "Amount paid",
  bkCheckInFrom: "Check-in from {time}",
  bkCheckOutBy: "Check-out by {time}",
  bkWhatNext: "While you wait",
  bkAskUs: "Ask us a question",
  bkHoldNote: "Your dates are held for {n} minutes while you pay.",
  bkResumePayment: "Resume payment",
  // Backing out of Stripe does not release the hold, so a second checkout would be refused by our own hold. Resume instead.
  bkResumeNote: "Your dates are still held. Carry on where you left off.",
  bkConfirmingPayment: "Checking your payment…",
  bkPaymentUnconfirmed: "We could not confirm your payment here. Please do not pay again. We will email you as soon as it is confirmed.",
  bkPaymentNotTaken: "That payment did not go through, and nothing was charged. You can try again.",
  bkPastCheckIn: "Check-in cannot be in the past.",
  bkCheckOutAfter: "Check-out must be after check-in.",
  bkFewerGuests: "Fewer guests",
  bkMoreGuests: "More guests",
  bkGuestsSelected: "{n} guests",
  bkOneGuestSelected: "1 guest",

  // -- booking panel, second pass ------------------------------------------
  // Heading for the state where the guest came back from a redirect payment and Stripe would not tell us what happened. Never a tick, never 'paid'.
  bkUnconfirmedTitle: "We are still checking your payment.",

  // -- booking panel, payment note -----------------------------------------
  // Paired with bkHoldNote when the hold window is known, so the two sentences do not both say the dates are held.
  bkCardNote: "Card details go straight to our payment provider and are never stored on this site.",

  // -- guide translation state ---------------------------------------------
  // The guide is 551 English text nodes on /th with no note at all: place names, categories and the hosts' own comments all come from an English sheet that is never hand-edited. Its own note rather than the site-wide one, which names property descriptions and legal pages and does not describe this page.
  guidePendingNote: "Place names, categories and the hosts' notes on this page are written in English by the hosts. The walking and driving times work in any language.",

  // -- contact form states -------------------------------------------------
  // The success and error states were hardcoded English on the owner conversion point: a Thai owner who submitted successfully was answered with "Got it."
  ctSentTitle: "Got it.",
  ctSentBody: "We will read this properly rather than send you an autoresponder sequence. If it is urgent, write to",
  // {email} is interpolated so the address stays in one place and renders as a mailto link, not as plain text a phone user has to transcribe.
  ctErrorGeneric: "Something went wrong at our end. Please email {email}.",
  ctErrorNetwork: "We could not reach the server. Check your connection and try again, or email {email}.",
  ctCondoNote: "Worth knowing up front: most Thai condo buildings prohibit stays under 30 days, and the juristic person has to permit it in writing. We check this before anything is listed. If your building has already refused, the honest answer may be no.",
  // The old label said "Anything else (optional)" on a field the form marks required, so the browser blocked submission on a field the label called optional. The same key is correct as a placeholder on the booking form, which is how the mismatch got in.
  ctMessageLabel: "Anything else",
  ctRequired: "required",

  // -- Lotus House copy, moved out of the data layer -----------------------
  // The property's tagline, description, fact labels and house rules were literals in src/lib/property.ts and rendered in English on /th and /zh, on the homepage and the property page both. The guest review quote stays English, because a guest's own words translated are no longer the guest's words; it is marked lang=en instead.
  lotusTagline: "Your base for adventure and local living in Chiang Mai",
  lotusDesc1: "Lotus House is your base for adventure and local living in Chiang Mai. Tucked on a quiet street among friendly neighbours, this three-storey home blends comfort with character, offering spacious rooms and a rooftop terrace to relax after exploring the city's vibrant markets, temples, and nightlife.",
  lotusDesc2: "Lotus House features two king bedrooms, three dining spaces (indoor table, kitchen island, and rooftop terrace), a fully equipped kitchen, and a rooftop soaking tub. Fast Wi-Fi, smart TV, and a safety box are included. Gated parking for one car and motorbike rental are available, with a 7-Eleven a 4-minute walk away.",
  beds: "Beds",
  factKitchen: "Kitchen",
  factRooftop: "Rooftop",
  twoKingBeds: "2 king",
  ruleNoPets: "Pets not allowed",
  ruleLimitedMobility: "Not suitable for individuals with limited mobility",
  ruleWheelchair: "Wheelchair inaccessible",

  // -- how it works: the six service cards ---------------------------------
  // S1 feasibility study, card body. CORE[0].body
  hwCore1Body: "One site visit, a written analysis and an hour on a call going through it with you. We model your property against real local comparables and give you a straight recommendation at the end. Worth taking when there is no occupancy record to read — an unlisted property, or one whose numbers are not telling you what you need to know.",
  hwCore1Get1: "Market and demand analysis — location, competition, achievable nightly rate, seasonality",
  hwCore1Get2: "Property assessment and positioning, including which feature to lead on",
  hwCore1Get3: "Operating cost modelling",
  hwCore1Get4: "Business case across up to three scenarios: rate, occupancy, revenue, NOI, breakeven, ROI",
  hwCore1Get5: "A direct comparison against simply renting it long-term",
  hwCore1Get6: "A written Go or No-Go recommendation",
  // CORE[0].limit, the Not included box
  hwCore1Limit: "A projection is not a promise. Occupancy moves with the season, the economy and the platforms, so we show you the conservative case and judge on that one.",
  // S2 vacation rental permission, card body. CORE[1].body
  hwCore2Body: "Short-stay letting in Thailand is governed by the Hotel Act and the non-hotel accommodation framework, and the rules are specific enough that most owners have never been told which ones apply to them. We work out what your property is actually allowed to do, prepare the documents, and file under power of attorney so you do not have to deal with the office yourself.",
  hwCore2Get1: "Legal feasibility assessment against the Hotel Act framework",
  hwCore2Get2: "Building and safety equipment requirements review",
  hwCore2Get3: "Full document preparation",
  hwCore2Get4: "Submission and follow-up under power of attorney",
  hwCore2Limit: "Government fees, and any fire safety remediation the inspection turns up, are not included. And we handle the application — we cannot guarantee the government's decision.",
  // S3 management, card body. CORE[2].body
  hwCore3Body: "Listings, pricing, guests and compliance, run by the team here in Chiang Mai. This is the service most owners come for, and the only one that runs continuously.",
  hwCore3Get1: "Listing creation and management across the main OTA channels",
  hwCore3Get2: "A direct booking website, so not every night pays platform commission",
  hwCore3Get3: "Channel and rate management in Beds24",
  hwCore3Get4: "Guest communication across the whole stay",
  hwCore3Get5: "Review, Superhost and Guest Favourite management",
  hwCore3Get6: "Compliance upkeep, and TM30 guest reporting",
  hwCore3Limit: "Insurance is outside the fee. We will help you find a policy but we do not arrange or advise on one. Housekeeping, photography and interior work are separate services rather than exclusions — they are below.",
  // S4 housekeeping, card body. EXTRAS[0].body
  hwExtra4Body: "The turnover, the laundry and the upkeep, handled end to end so you are not managing suppliers from another country. Take it and the day-to-day stops being your problem; leave it and we still arrange and supervise the work, you just pay the suppliers yourself.",
  hwExtra4Get1: "Turnover cleaning to a written checklist, scheduled around arrivals",
  hwExtra4Get2: "Laundry on every turnover and mid-stay",
  hwExtra4Get3: "Consumables kept stocked",
  hwExtra4Get4: "Maintenance and vendor visits arranged, supervised and documented",
  // S5 photography, card body. EXTRAS[1].body
  hwExtra5Body: "Photography is the single biggest lever on how a listing performs, and most owner-supplied photographs cost bookings rather than win them. We brief the shoot, direct it, and edit the set to the standard the channels reward.",
  hwExtra5Get1: "Interior and exterior shoot, styled and lit for short-stay listings",
  hwExtra5Get2: "Editing and colour work to a consistent house standard",
  hwExtra5Get3: "A set sized and cropped for every channel, plus the direct site",
  hwExtra5Get4: "Reshoots when the property changes",
  // S6 interior design, card body. EXTRAS[2].body
  hwExtra6Body: "What a property earns is decided partly by what it is like to stay in. Where the numbers are held back by the house rather than the listing, we work out what to change, what it would cost, and whether the return justifies it — with the costing done properly rather than guessed.",
  hwExtra6Get1: "Advice on look, feel and the details guests actually book for",
  hwExtra6Get2: "What to add, what to replace, and what to leave alone",
  hwExtra6Get3: "Investment cost estimates against real supplier pricing",
  hwExtra6Get4: "The return on the spend, modelled the same way the study models the property",

  // -- how it works: included / not included, and the FAQ ------------------
  // INCLUDED[0]. Items 3 and 5 reuse hwCore3Get3 and hwCore3Get5, which are the same sentences.
  hwInc1: "Listings across the main OTA channels, plus testing secondary ones",
  hwInc2: "A direct booking website",
  hwInc4: "Guest communication for the full stay, with automation behind it",
  hwInc6: "Arranging cleaning and turnover — scheduling and quality control",
  hwInc7: "Arranging maintenance and vendor visits",
  hwInc8: "Compliance upkeep once the permission is granted",
  hwInc9: "TM30 foreign guest reporting to Immigration",
  // EXCLUDED[0..6], the We do not column
  hwExc1: "The cost of cleaning, laundry, maintenance and vendors, unless you take housekeeping — you pay the supplier either way",
  hwExc2: "Insurance. We will help you find a policy but we do not arrange or advise on one",
  hwExc3: "The building work itself. We advise on it and cost it; we do not carry it out",
  hwExc4: "Long-term tenancy, and property sale or valuation",
  hwExc5: "Legal representation — we coordinate with counsel rather than advising",
  hwExc6: "Your tax filing",
  hwExc7: "Your own personal-use admin and your own guests",
  // FAQ[0..7]. The same array feeds faqSchema(), so these keys also fix the FAQPage structured data, which was English on all three locales.
  hwFaq1Q: "What do you charge?",
  hwFaq1A: "A percentage of booking revenue for management, plus fixed fees for the services you choose. The percentage depends on how much of the work you want us to carry — it is lower when we handle the housekeeping too. Exact figures are quoted against your property rather than read off a rate card.",
  hwFaq2Q: "Do I have to take the study first?",
  hwFaq2A: "No. It is one service on the menu, not a gate. If your property is already listed and earning, your own numbers tell us more than a model would, and we will start from those instead. Where we think the study genuinely would change your decision, we will say so.",
  hwFaq3Q: "What if I do not have a licence, and do not want to apply for one?",
  hwFaq3A: "Tell us and we will talk it through properly. The permission service exists because most owners have never been told which rules apply to their property, and a lot of them turn out to be straightforward. What we will not do is make the decision for you or pretend the question does not exist.",
  hwFaq4Q: "Am I locked into a contract?",
  hwFaq4A: "No minimum term on management. You give notice, we hand over the listings and calendars, and we do not hold your channel accounts hostage.",
  hwFaq5Q: "What happens if a guest damages something?",
  hwFaq5A: "Every booking carries a deposit held through the channel. We inspect after checkout, document anything found, and pursue the claim ourselves. Above the deposit ceiling it becomes an insurance question, which is why the feasibility study asks what your policy covers.",
  hwFaq6Q: "Can I still use the property myself?",
  hwFaq6A: "Yes. You block the dates and we work around them. Frequent owner use lowers projected revenue, and the feasibility report will show you by how much.",
  hwFaq7Q: "Do you handle tax?",
  hwFaq7A: "We provide the revenue reporting your accountant needs. We are not tax advisers and will not file on your behalf.",
  hwFaq8Q: "My condo says short lets are not allowed. Is that final?",
  hwFaq8A: "Usually, yes. Most Thai condo buildings prohibit stays under 30 days and the juristic person has to permit it in writing. Where a building refuses, we say so rather than list it and hope.",

  // -- how it works: inline page copy and the qualifier --------------------
  // Under the menu h2
  hwMenuIntro: "Six services, taken in whatever combination your property needs. Most owners take two or three. Nobody takes all six.",
  // Under the Alongside the management h3
  hwExtrasIntro: "Take any of these with management, or on their own. Each is quoted for the property rather than sold at a standard rate.",
  // Under gatesTitle, ends on a colon leading into the two gate cards
  hwGatesBody: "Otherwise it is a sales document with a fee attached. Two things have to be true before we will manage a property, and they are different questions. A property that is already earning well answers both of them without a study:",
  hwGate1Label: "Gate one · your side",
  hwGate1Title: "At cautious occupancy, short-let has to beat renting it long-term.",
  hwGate1Body: "Not at the optimistic case — at the conservative one. We pull a real local long-term comparable at the time of the study rather than assuming one, because that number is what decides the verdict.",
  hwGate2Label: "Gate two · our side",
  hwGate2Title: "The property has to be worth managing properly.",
  hwGate2Body: "Our fee is a share of what the property earns, so below a certain level of revenue it does not fund the attention the property needs — and doing it badly helps nobody. A property with a real booking record answers this on its own numbers. This gate applies to management only.",
  hwGatesFoot: "If your case works but we are not the right size of manager for it, we will say that too, and point you somewhere better.",
  hwQualifyIntro: "Four questions. This is the same shape as our intake, so you get the honest answer now rather than after a site visit.",
  hwMgmtIntro: "We arrange the work and supervise it. You pay the suppliers directly. That is a different product from fully hands-off, and it is better that you know which one you are buying now.",
  hwTm30Eyebrow: "The bit most managers leave with you",
  hwTm30Title: "TM30 reporting is included.",
  hwTm30Body: "Every foreign guest has to be reported to Immigration. It is a legal obligation on the property, it is tedious, and most management contracts quietly hand it back to the owner. Ours does not. Keeping the permission compliant once it is granted is part of the same job.",
  // Body of the closing CTA panel, under startNumbers
  hwClosingBody: "One site visit, a written analysis, an hour on a call walking you through it, and a straight Go or No-Go at the end. No management contract attached.",
  // qualifier.tsx, the four fieldset legends. The numbering is part of the label.
  hwQ1Legend: "1 · What kind of property",
  hwQ2Legend: "2 · Bedrooms",
  hwQ3Legend: "3 · Where in Chiang Mai",
  hwQ4Legend: "Does it have a private pool?",
  // Verdict shown before property type and bedrooms are both answered
  hwVEmptyKicker: "Answer the questions",
  hwVEmptyTitle: "We will give you a straight read.",
  hwVEmptyBody: "Property type and bedroom count move the answer more than anything else, so start there.",
  // Condo verdict. Conditional, not a no: the building decides.
  hwVCondoKicker: "It depends on your building",
  hwVCondoTitle: "A condo works when the building permits it in writing.",
  hwVCondoBody: "Condos take a different legal route. The non-hotel exemption that covers houses and townhouses is not available to them, so what matters instead is your building: the juristic person has to permit short stays in writing, and we need that on file before anything is signed. Most Chiang Mai buildings do prohibit stays under 30 days, so this often ends in a no — but it is the building's answer, not ours, and it is worth checking rather than assuming.",
  hwVCondoCta: "Ask us to check your building",
  // One-bedroom verdict. A real no stays a real no.
  hwV1Kicker: "Probably a no",
  hwV1Title: "A one-bedroom rarely beats a tenant.",
  hwV1Body: "On the conservative case, a one-bed usually earns you less than a long-term let would, and it competes head-on against cheap condo rentals we cannot beat on cost. If yours is unusual — a design-led place, or an exceptional location — tell us and we will look properly.",
  hwV1Cta: "Tell us why yours is different",
  // Two-bedroom verdict, the core fit. CTA reuses bookStudy.
  hwV2Kicker: "This is the core fit",
  hwV2Title: "A two-bed landed property is exactly what we look for.",
  hwV2Body: "Two-bedroom stock is the clearest gap between what Chiang Mai lists and what guests actually book, and it serves both the long-stay remote worker and the cultural tourist — so the forecast does not rest on one kind of guest.",
  // Appended to hwV2Body when the area is in the outer ring. Carries its own leading separator, so Chinese does not gain a stray space.
  hwV2Outer: " Out in the ring you will want off-street parking to make it work.",
  // Three-bed with a pool in the outer ring. CTA reuses bookStudy.
  hwV3PoolKicker: "Good fit, with a caveat",
  hwV3PoolTitle: "A three-bed with a pool in the outer ring works.",
  hwV3PoolBody: "It clears the conservative case with a modest margin. Bookings are lumpier than in town, so the seasonality assumptions matter more here than anywhere — which is the part the study is for.",
  // Three-bed without a pool
  hwV3NoPoolKicker: "Likely a no",
  hwV3NoPoolTitle: "A three-bed without a pool tends not to clear its own alternative.",
  hwV3NoPoolBody: "The nightly rate does not climb enough to cover the drop in occupancy, and the long-term let for a three-bed house is strong.",
  // Inserted for areas with thin comparable data. Carries its own leading separator.
  hwV3ThinData: " Riverside also has thin comparable data, which widens the error bars considerably.",
  // Closes hwV3NoPoolBody, after the thin-data clause when there is one. Carries its own leading separator.
  hwV3NoPoolTail: " We would need to see a real reason the rate would run high.",
  hwV3NoPoolCta: "Ask us to look anyway",
  // Three-bed, pool question not yet answered
  hwV3AskPoolKicker: "Depends on the pool",
  hwV3AskPoolTitle: "For a three-bed, the pool is the deciding factor.",
  hwV3AskPoolBody: "With one, in the outer ring, it works. Without one it usually does not, because the rate does not rise enough to offset lower occupancy. Answer the pool question above.",
  // Four bedrooms and up
  hwV4Kicker: "Conditional",
  hwV4Title: "Four bedrooms and up is the highest-variance case we see.",
  hwV4Body: "It has the strongest long-term rental alternative to beat, and thinner occupancy. It works when the property is genuinely design-led and can hold a premium rate — not when it is simply a large house. We will only quote it against real comparables.",
  hwV4Cta: "Send us the details",
  // Footnote at the bottom of the verdict panel
  hwQualifierFoot: "Indicative only. The study prices your property against real local comparables rather than a rule of thumb.",

  // -- how it works: the sample report, and the team roles -----------------
  // sample-report.tsx masthead, under the AgentSiam wordmark. The city name is not translated here because it comes from the same phrase on the real report's cover.
  hwSrKicker: "Feasibility & ROI study · Chiang Mai",
  // Says on the artefact itself that it is a sample. Never move this into a caption.
  hwSrSampleLabel: "Sample — not a client report",
  hwSrSampleBody: "The structure and format of the report a client receives. Figures are illustrative, not a forecast for any property.",
  // The report's cover question, set on two lines. Part A and part B are separated by a <br /> in the markup, so each language decides its own break point.
  hwSrTitleA: "Is short-let worth it",
  hwSrTitleB: "for this property?",
  // The four cover facts. Neighbourhood and Chang Khlan reuse neighbourhood and areaChangKhlan.
  hwSrFactProperty: "Property",
  hwSrFactPropertyValue: "2-bed townhouse",
  hwSrFactVisit: "Site visit",
  hwSrFactVisitValue: "Completed",
  hwSrFactVerdict: "Verdict",
  hwSrFactVerdictValue: "Section 6",
  hwSrContentsTitle: "What is in this report",
  // Page reference in the contents list. {n} is the page number.
  hwSrPage: "p. {n}",
  hwSrSec1: "1. Market and demand analysis",
  hwSrSec2: "2. Property assessment and positioning",
  hwSrSec3: "3. Operating cost model",
  hwSrSec4: "4. Business case, three scenarios",
  hwSrSec5: "5. Against a long-term tenant",
  hwSrSec6: "6. Recommendation: Go or No-Go",
  hwSrCaseTitle: "4 · Business case",
  hwSrCaseIntro: "Three scenarios. The verdict is judged on the conservative column, never the optimistic one.",
  hwSrColConservative: "Conservative",
  hwSrColBase: "Base",
  hwSrColOptimistic: "Optimistic",
  hwSrRowRate: "Average nightly rate",
  hwSrRowOccupancy: "Occupancy, annual",
  hwSrRowGross: "Gross revenue",
  hwSrRowOpex: "Operating cost",
  hwSrRowNoi: "Net operating income",
  hwSrRowBreakeven: "Breakeven occupancy",
  // aria-label on the grey bar standing in for a withheld baht figure. Renders six times.
  hwSrRedacted: "figure withheld in this sample",
  hwSrAltTitle: "5 · The alternative we test against",
  hwSrAlt1: "A real long-term rental comparable, pulled in this street at the time of the study",
  hwSrAlt2: "Net of the costs a tenant does not create: turnover, laundry, utilities, platform fees",
  hwSrAlt3: "Short-let has to beat it on the conservative column to pass",
  hwSrMoversTitle: "What moves the answer most",
  hwSrMover1: "Bedroom count, then off-street parking in the outer ring",
  hwSrMover2: "Seasonality: burning season is modelled, not averaged away",
  hwSrMover3: "Owner use — every blocked week is priced",
  hwSrRecTitle: "6 · Recommendation",
  hwSrRecVerdict: "Go — on the conservative case, with two conditions.",
  // Keeps the 52% figure, which is the occupancy of the conservative column in the table above it.
  hwSrRecBody: "Short-let clears the long-term comparable with margin at 52% occupancy. Conditional on the non-hotel exemption being filed before listing, and on the fire safety items in section 2 being remedied. A projection is not a promise: occupancy moves with the season, the economy and the platforms, which is why the conservative column is the one that decides.",
  hwSrFooterNote: "Sample document · illustrative figures",
  // The four team roles from src/lib/team.ts, which rendered in English on every locale.
  hwRoleFounder: "Co-founder",
  hwRoleAppraisal: "Appraisal & real estate",
  hwRoleDigital: "Digital & creative",
  hwRoleCoordination: "Project coordination",

  // -- footer --------------------------------------------------------------
  // Every page's footer published a Bangkok registered address and nothing else, while three pages claim a Chiang Mai team on the ground. Stated separately from the postal block, which has to match the Google Business Profile character for character and is not touched.
  footWhereWeWork: "Operating in Chiang Mai. The address above is the registered office.",
} as const;

export type Dictionary = { [K in keyof typeof en]: string };
