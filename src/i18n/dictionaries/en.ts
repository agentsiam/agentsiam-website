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
    "Property descriptions, legal pages and the detailed owner information below are currently available in English.",

  // -- home ---------------------------------------------------------------
  heroEyebrow: "Chiang Mai · by the night or the month",
  heroTitleA: "A home in Chiang Mai,",
  heroTitleB: "for a week or a year.",
  heroSub: "We run houses in Chiang Mai ourselves, and find privately owned homes for longer stays. The same team on the ground from your first night to your last month.",
  viewProperty: "See the houses",

  forGuests: "For guests",
  forOwners: "For owners",
  guestPanelTitle: "I want to stay here.",
  guestPanelBody:
    "Book direct and you get the rate without the platform markup, and a local number that answers.",
  ownerPanelTitle: "I own a property here.",
  ownerPanelBody:
    "We run the numbers before you sign anything. If it will not earn, we say so.",
  ownerPanelLink: "See how management works",

  featuredTitle: "Our properties",
  featuredSub: "{n} houses in Chiang Mai. Book online, or send us a message and we will take it from there.",

  whyA: "Direct rate, no platform markup",
  whyABody:
    "No platform markup between you and the people who run the house.",
  whyB: "A team actually in Chiang Mai",
  whyBBody: "Not a call centre in another timezone. We can be at the property.",
  whyC: "Reachable through your stay",
  // Was "Phone or LINE, 24/7": neither is published anywhere on the site, and the
  // WhatsApp CTA that was meant to carry this is dark in production, NEXT_PUBLIC_WHATSAPP_NUMBER
  // unset. Email is the one channel actually live, verified against the running site
  // 12/09/2026. Revisit once WhatsApp is confirmed on.
  whyCBody: "Email us any time during your stay. We answer it ourselves, not a support queue.",

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
  route3Take: "Study, then permission, then management. Or meet us through a guest first.",
  route3Why: "There is no history to read, so the numbers have to be modelled before anyone should commit money to it. This is the route the study was built for, and the one where a No-Go saves you the most. And when we have a guest looking for a home like yours, we can place them with you before you sign anything, for a one-off fee on that booking only, so you see us deliver first.",
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
  vpTitle: "Why owners choose AgentSiam",
  vp1Title: "Legal, not just listed",
  vp1Body:
    "We assess your property against the Hotel Act and the non-hotel framework, prepare the documents and file under power of attorney. Most managers skip this step entirely and leave the risk with you.",
  vp2Title: "A team in Chiang Mai",
  vp2Body:
    "We live here. We visit the properties, we meet the guests, and we know which buildings permit short stays. When something breaks at 11pm, someone local reads the message.",
  vp3Title: "Numbers before contracts",
  vp3Body:
    "The feasibility study is paid, and it can end in a No-Go. We judge on the conservative case against a real local long-term comparable, not on the optimistic column.",
  vp4Title: "Seven channels, plus your own",
  vp4Body: "Airbnb, Booking.com, Agoda, Expedia, Vrbo, Trip.com and Google Vacation Rentals run from one calendar and one rate plan, so nothing double-books, plus a direct booking site where a booking pays no platform commission. TM30 guest reporting is included.",
  gatesTitle: "The study has to be able to say no.",
  qualifyTitle: "Is your property a fit?",
  mgmtTitle: "What management actually means",
  weDo: "We do this",
  weDont: "We do not",
  reportTitle: "What the report actually looks like",
  reportBody: "Six sections, with the recommendation last rather than first. The figures below are hidden because inventing them would be worse than showing nothing. The real figures are calculated for your property.",
  proofTitle: "A house we run ourselves",
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
  // A tile for a house listed for enquiry only, where the price would be.
  tileNotOpen: "By enquiry only",
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
  launchingSoon: "By enquiry",
  cityComingTitle: "{city}, by enquiry only.",
  cityComingBody:
    "Looking for a stay in {city}? Tell us your dates and what you need, and we'll let you know whether we can help.",
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
  areaNoneYet: "By enquiry",
  areaEmptyTitle: "Staying in {area}? Ask us first.",
  areaEmptyBody:
    "Tell us your dates and what you need, and we'll let you know whether we can help.",
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
  guideShowMore: "Show {n} more",
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
  metaHomeTitle: "AgentSiam | Stays in Chiang Mai, by the night or the month",
  metaHomeDesc: "Book a privately owned home in Chiang Mai direct, by the night or the month. One team on the ground, looking after every house we list.",
  metaHowTitle: "Vacation rental management in Chiang Mai",
  metaHowDesc: "Six services, chosen against your property rather than sold as a package. Feasibility, the non-hotel exemption filing, and OTA and direct booking management.",
  metaMgmtTitle: "Short-term rental management in {city}",
  metaMgmtDesc: "Feasibility, vacation rental permission and management for short-term rentals in {city}, delivered from our Chiang Mai team.",
  mgmtEyebrow: "For owners",
  mgmtHeroTitle: "Short-term rental management in {city}",
  mgmtHeroSub: "The same three services we run in Chiang Mai, available in {city} by enquiry. Take the ones your property needs.",
  mgmtServicesTitle: "What AgentSiam does",
  mgmtScopeTitle: "How we work in {city}",
  mgmtCtaTitle: "Thinking about short-term letting in {city}?",
  mgmtHowLink: "See how it works",
  metaPropertiesTitle: "Places to stay in Chiang Mai",
  metaPropertiesDesc:
    "Homes, villas and townhouses in Chiang Mai, managed on the ground. Filter by neighbourhood, type and size, and book direct.",
  metaLotusTitle: "Lotus House Chiang Mai, near the Night Bazaar",
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
  outdoorCamera: "There is one security camera, outdoors at the front parking gate, facing away from the house and covering the approach only. No cameras inside.",

  // -- accessible names for chrome and controls ----------------------------
  // Two navigation landmarks per page once a breadcrumb is on it, so both need names.
  mainNav: "Main",
  // The wordmark's link. It went out as "AgentSiam — Guests" on every page, which named a different destination than the one it goes to.
  homeLink: "AgentSiam — home",
  breadcrumbLabel: "Breadcrumb",
  // The verb only. The photo's own description is a separate lang="en" span in photo-gallery.tsx,
  // not spliced into this string, because an aria-label cannot mark part of itself as English.
  openPhoto: "Open photo",
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
  ga7: "Direct bookings are fully refundable 30 days or more before check-in, 50% refundable from 7 to 29 days before, and not refundable within 7 days. The full terms are on our Terms & Conditions page and are shown before you pay. If you book through our team, we'll confirm the cancellation terms for your stay in writing before you book.",
  // -- Direct-booking cancellation policy and guest confirmation email. Wording changes bump CANCELLATION_POLICY_VERSION in src/lib/cancellation-policy.ts.
  cxTitle: "Cancellation",
  cxIntro: "The following cancellation terms apply to direct bookings.",
  cxOverride: "If different terms are stated in your booking confirmation, those terms apply instead.",
  cxRule1: "Cancel 30 days or more before check-in: full refund, less any bank or card fee already charged.",
  cxRule2: "Cancel fewer than 30 days, but at least 7 days, before check-in: 50% refunded.",
  cxRule3: "Cancel fewer than 7 days before check-in, or do not arrive: no refund.",
  cxRebookTitle: "If we rebook your cancelled nights, we refund the amount recovered.",
  cxRebookBody: "If you cancel, we will offer those nights to other guests. If any are rebooked, we will refund the amount recovered for those nights, less a THB 1,000 rebooking fee. Your total refund, including any refund under the rules above, will not exceed what you paid. The fee is deducted only from an additional refund following rebooking; it does not reduce any refund due under the rules above.",
  cxChangeTitle: "Changing your dates:",
  cxChangeBody: "contact us before check-in. We can move your booking if the new dates are available at the same rate. We will confirm any change in writing.",
  cxGoodwill: "If exceptional circumstances affect your stay, write to hi@agentsiam.com before check-in and tell us what has happened. We review each request personally and may offer a refund or a change of dates beyond the terms above. This is considered case by case and is not guaranteed. We will confirm our decision in writing.",
  cxAccept: "I have read and accept the cancellation terms above.",
  cxAccepted: "You accepted these cancellation terms.",
  geSubject: "Your stay at {property} is confirmed",
  geIntro: "Thank you. Your payment has been received and your stay is confirmed. We will be in touch before you arrive.",
  geArrival: "Check-in",
  geDeparture: "Check-out",
  geNights: "Nights",
  geGuests: "Guests",
  gePaid: "Paid",
  geReference: "Booking reference",
  geTermsLead: "The cancellation terms you accepted, version {version}:",
  geReply: "Reply to this email with any question.",
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
  bsPendingLabel: "On request",
  bsLimitLabel: "What this is not",
  bsPillar1Hook: "Structured and compliant from day one.",
  bsPillar1Name: "Business Setup & Compliance Advisory",
  bsPillar1Body: "We coordinate company registration, licensing and tax setup with legal and accounting partners, so the paperwork is right before you open rather than fixed after an inspection.",
  bsPillar1Get1: "Company registration coordinated end to end with a licensed Thai partner.",
  bsPillar1Get2: "The licences and permits your activity actually requires, identified before you commit to premises or staff.",
  bsPillar1Get3: "Tax registration and a working accounting arrangement, set up with an accounting partner.",
  bsPillar1Pending: "We send the document checklist and timeline for your company structure on request.",
  bsPillar1Limit: "We coordinate the work and stay in the room for it. We are not a law firm or an accounting firm, and we do not give legal or tax advice ourselves.",
  bsPillar2Hook: "From product idea to market-ready goods.",
  bsPillar2Name: "OEM & Supply Chain Enablement",
  bsPillar2Body: "We help you find and vet manufacturers, manage sampling, and get production ready inside Thailand's manufacturing ecosystem.",
  bsPillar2Get1: "A shortlist of manufacturers found and vetted against your product, not a directory export.",
  bsPillar2Get2: "Sampling managed through the rounds it takes to reach a sample you approve.",
  bsPillar2Get3: "The production and supply steps prepared, so the first real order can be placed.",
  bsPillar2Pending: "Ask us about our experience in your product category.",
  bsPillar2Limit: "We do not manufacture, and we do not buy, hold or resell your stock. The supply agreement is between you and the factory.",
  bsPillar3Hook: "Live on LINE, TikTok, Shopee, Lazada.",
  bsPillar3Name: "Ecommerce & Local Platform Launch",
  bsPillar3Body: "We set up your store, connect local payment methods, and localize content for the platforms Thai shoppers actually use.",
  bsPillar3Get1: "Your store opened on the platforms that matter for your category, rather than on all of them at once.",
  bsPillar3Get2: "Thai payment methods connected, so a local buyer can pay the way they normally pay.",
  bsPillar3Get3: "Product content written and laid out in Thai for each platform, not translated once and pasted everywhere.",
  bsPillar3Pending: "Ask us which platforms suit your product category and what they cost to run.",
  bsPillar3Limit: "This is launch work. Day-to-day selling, customer service and order fulfilment stay with your team unless we agree otherwise in writing.",
  bsPillar4Hook: "Strategy connected to execution.",
  bsPillar4Name: "Growth, Marketing & Operations Integration",
  bsPillar4Body: "Localized branding and marketing, wired into the operational workflows that actually run day to day.",
  bsPillar4Get1: "Brand and messaging adapted for a Thai audience rather than translated from your home market.",
  bsPillar4Get2: "A marketing plan per channel, saying what each channel is for and how it will be judged.",
  bsPillar4Get3: "The handover points between marketing and operations written down, so an enquiry does not stop at the boundary.",
  bsPillar4Pending: "What we report back, and how often, is agreed with you at the start.",
  bsPillar4Limit: "We build the plan and connect it to your workflows. We do not take over your team, and we do not run your operations for you.",
  bsStartTitle: "How an engagement starts",
  bsStep1Title: "You write to us",
  bsStep1Body: "Tell us what you are planning, where you are starting from, and what is already decided. The address for business enquiries is on the contact page.",
  bsStep2Title: "We come back to you and set up a call",
  bsStep2Body: "The first thing we work out on that call is which of the four areas your project actually needs, and which of them it does not.",
  bsStep3Title: "What happens after that",
  // Deliberate gap. There is no agreed consulting intake process to publish.
  bsStep3Body: "After the call we scope, stage and quote the work for your case. Every engagement differs, so you get a written plan made for you rather than a standard sequence.",
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
  mgmt2Scope1: "Our home market is Chiang Mai. That is where the team, the District Office relationship and the properties we run are. We take on work in {city} by enquiry, and it is delivered by the Chiang Mai team.",
  mgmt2Scope2: "Our team is based in Chiang Mai. We consider work in {city} individually and agree the scope and arrangements before taking it on. If you need a manager with staff based in {city} full time, tell us at the start and we will say plainly whether we are the right fit.",
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
  areaUnsourced: "This is a general overview; our guest guide does not yet cover this neighbourhood in detail. Contact us with any questions and we'll help where we can.",
  // Distance figure with its origin named. CITY_CENTRE in areas.ts is Tha Phae Gate.
  areaKmFromGate: "{n} km from Tha Phae Gate",
  // The method behind the figure. distanceKm() is crow-flies on purpose.
  areaKmNote: "Straight line, not a road distance.",
  areaCloseTitle: "Not sure this is the right neighbourhood?",
  areaCloseBody: "Tell us who is travelling and what you want inside a ten minute walk. We will say which part of Chiang Mai fits, and we answer on the trip rather than on what we would rather fill.",
  areaCloseGuide: "Read the local guide",
  // Index card line: how many guide places sit in this area.
  areaGuideCount: "{n} places in our guide",
  areaGuideCountOne: "1 place in our guide",
  areaGuideCountNone: "Local tips on request",
  areaIndexCloseTitle: "None of them quite right?",
  areaIndexCloseBody: "Tell us the trip rather than the neighbourhood. We answer with what actually fits, rather than with what we would rather sell you.",
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
  areaUnsourcedFrom: "This is a general overview; our guest guide does not yet cover this neighbourhood in detail. Contact us with any questions and we'll help where we can.",
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
  // -- Cosmos House preview copy. Facts only from fields the property profile asserts.
  metaCosmosTitle: "Cosmos House, Chang Khlan, Chiang Mai",
  metaCosmosDesc: "Two bedrooms, two bathrooms and space for four guests in Chang Khlan, Chiang Mai. Booking by enquiry: send us your dates for availability and price.",
  cosmosTagline: "Two bedrooms and two bathrooms for up to four guests, in Chang Khlan, Chiang Mai",
  cosmosNotOpenTitle: "Booking by enquiry",
  cosmosNotOpenBody: "Send us your arrival and departure dates and the number of guests. We'll reply personally with availability and a price for your stay.",
  cosmosEnquire: "Enquire about availability",

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
  hwCore3Get3: "Channel and rate management across all seven channels from one system",
  hwCore3Get4: "Guest communication across the whole stay",
  hwCore3Get5: "Review, Superhost and Guest Favourite management",
  hwCore3Get6: "Compliance upkeep, and TM30 guest reporting",
  hwCore3Limit: "Insurance is outside the fee. We will help you find a policy but we do not arrange or advise on one. Housekeeping, photography and interior work are separate services rather than exclusions — they are below.",
  // S4 housekeeping, card body. EXTRAS[0].body
  hwExtra4Body: "The turnover, the laundry and the upkeep, scheduled, checked and restocked for every stay, so you are not managing suppliers from another country. You pay the suppliers directly, at cost, with no markup from us. Leave it out and you keep your own cleaner.",
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
  hwInc8: "Compliance upkeep once the permission is granted",
  hwInc9: "TM30 foreign guest reporting to Immigration",
  // EXCLUDED[0..6], the We do not column
  hwExc1: "Cleaning, turnover, laundry and maintenance. That is housekeeping, a separate service you can add, and either way you pay the suppliers directly",
  hwExc2: "Insurance. We will help you find a policy but we do not arrange or advise on one",
  hwExc3: "The building work itself. We advise on it and cost it; we do not carry it out",
  hwExc4: "Long-term tenancy, and property sale or valuation",
  hwExc5: "Legal representation — we coordinate with counsel rather than advising",
  hwExc6: "Your tax filing",
  hwExc7: "Your own personal-use admin and your own guests",
  // FAQ[0..7]. The same array feeds faqSchema(), so these keys also fix the FAQPage structured data, which was English on all three locales.
  hwFaq1Q: "What do you charge?",
  hwFaq1A: "A percentage of room revenue for management, plus fixed fees for the one-off services you choose. The percentage is a little higher when you take housekeeping too, because that is where housekeeping is paid for; the turnover cleaning itself is passed on at cost. For a limited time the set-up fee is waived, and the first five properties to sign get a reduced management rate for their first year, in return for a case study and a reference. Exact figures are quoted against your property rather than read off a rate card.",
  hwFaq2Q: "Do I have to take the study first?",
  hwFaq2A: "No. It is one service on the menu, not a gate. If your property is already listed and earning, your own numbers tell us more than a model would, and we will start from those instead. Where we think the study genuinely would change your decision, we will say so.",
  hwFaq3Q: "What if I do not have a licence, and do not want to apply for one?",
  hwFaq3A: "That is your choice, and there is still a lawful way to earn from your home. Under the published rules, stays of 30 nights or more need no hotel registration, so we can run your home for monthly guests only. If you later want shorter stays, a house or villa can be registered as non-hotel accommodation with the district office, and we handle that for you. A condo cannot use that route, so for a condo, monthly stays are the option. Rules change, so we confirm what applies to your property before you sign.",
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
  hwMgmtIntro: "Management runs the listings, the pricing, the guests and the compliance. The physical work on the house is housekeeping, which you can add or leave out. Where we arrange that work, you still pay the suppliers directly. That is a different product from fully hands-off, and it is better that you know which one you are buying now.",
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

  // -- homepage neighbourhood strip ----------------------------------------
  // The eight neighbourhood pages became substantial on 06/09/2026 and the homepage pointed at none of them: they were reachable from the nav and the footer only. This is the third route the spec names.
  homeAreasTitle: "Where in Chiang Mai",
  homeAreasSub: "The neighbourhood decides the holiday more than the house does. Eight of them, described as they actually are.",
  homeAreasLink: "All eight neighbourhoods",

  // -- live chat, privacy policy sentence ----------------------------------
  // Rendered only when NEXT_PUBLIC_CRISP_WEBSITE_ID is set, so the policy cannot describe a chat provider the site is not running and cannot stay silent about one it is. Same shape as the payment-provider sentence above it, because it is the same legal argument: storage set because the visitor asked for something.
  privacyChatCookie: "Our chat provider sets its own cookie when you open the chat, so a reply reaches the conversation you started. It appears only once you open the chat, not while you are browsing, and it is not used for advertising.",

  // -- Google Analytics consent banner -------------------------------------
  // Shown only to visitors from the EEA, UK and Switzerland, and only when NEXT_PUBLIC_GA_MEASUREMENT_ID is set. See src/components/analytics-consent.tsx. consentLabel is the landmark name a screen reader announces, not visible text. The link after consentBody reuses `privacy`.
  consentLabel: "Analytics cookies",
  consentBody: "May we use Google Analytics to see how this site is used? It sets cookies only if you accept.",
  consentAccept: "Accept",
  consentDecline: "Decline",

  // -- cosmos house: description and house rules ---------------------------
  cosmosDesc1: "Cosmos House is a townhouse over three levels in Chang Khlan. The top level is a roof terrace with a freestanding bathtub, an outdoor shower and a table with chairs, and there is a small paved courtyard with a table as well.",
  cosmosDesc2: "Inside are two king bedrooms, two bathrooms, a full kitchen with a breakfast bar, a dining table, and a second lounge that opens onto a balcony. Two work desks, a smart TV, air conditioning, Wi-Fi, a washing machine and a safety box are included.",
  ruleNoSmokingIndoors: "No smoking indoors",
  ruleNoEvents: "No parties or events",

  // -- mae rim house: enquiry-only listing ---------------------------------
  metaMaeRimTitle: "Mae Rim House, Mae Rim, Chiang Mai",
  metaMaeRimDesc: "Two-bedroom detached house with a work room and garden in Mae Rim, Chiang Mai. Booking by enquiry: send us your dates for availability and price.",
  maeRimTagline: "Two bedrooms, a work room and a garden on 1,412 m² of land in Mae Rim, Chiang Mai",
  maeRimDesc1: "Mae Rim House is a detached house with 120 m² of living space, not counting the covered parking, on 1,412 m² of land in Mae Rim, north of Chiang Mai. Garden surrounds the house, and there is an outdoor seating area.",
  maeRimDesc2: "Inside are two bedrooms and a living room, all air-conditioned; two bathrooms, both with water heaters; a work room; and a dining room with a kitchen area and range hood. A washing machine is included.",
  factWorkRoom: "Work room",
  factLivingArea: "Living area",
  factLand: "Land",
  factParking: "Parking",
  maeRimLivingAreaValue: "120 m²",
  maeRimLandValue: "1,412 m²",
  maeRimParkingValue: "2–3 cars",
  maeRimEnquireTitle: "Booking by enquiry",
  maeRimEnquireBody: "Send us your arrival and departure dates and the number of guests. We'll reply personally with availability and a price for your stay.",
  maeRimEnquire: "Enquire about availability",
  nearRajabhatMaeRim: "Chiang Mai Rajabhat University, Mae Rim campus",
  nearTaweerotMarket: "Taweerot Market",
  nearPremSchool: "Prem Tinsulanonda International School",
  nearKadFarangMaeRim: "Kad Farang Mae Rim",
  maeRimGettingAroundBody: "Driving times from the house, measured on Google Maps.",
  kmShort: "{n} km",

  // -- how-it-works hero proof chips ---------------------------------------
  ownerHeroProof1: "Team based in Chiang Mai",
  ownerHeroProof2: "7 booking channels plus a direct site",
  ownerHeroProof3: "Licensing handled for you",
  ownerHeroProof4: "Housekeeping and upkeep",
  ownerHeroProof5: "No lock-in period",

  // -- monthly house rental and licence pages ------------------------------
  // /house-for-rent-chiang-mai. Guest page: Thai takes คุณ.
  hfrMetaTitle: "Houses for rent in Chiang Mai, by the month",
  hfrMetaDesc: "Private houses for rent in Chiang Mai by the month, found for you. Every home is checked first: photos, exact location and a Wi-Fi speed test.",
  hfrCrumb: "House for rent, monthly",
  hfrEyebrow: "Monthly stays · Chiang Mai",
  hfrH1: "Houses for rent in Chiang Mai, by the month.",
  hfrIntro: "Tell us your dates, size, area, budget and must-haves. We find a privately owned home that fits, from owners and never from other agents, and send it to you with the total price.",
  hfrAns1Q: "Monthly rate",
  hfrAns1A: "Priced per home for your dates. We send the total for the whole stay before you decide.",
  hfrAns2Q: "What's included",
  hfrAns2A: "Stated for each home before you book: utilities, cleaning and internet. At the house we run, stays of 28 nights or more include utilities on fair use and one clean a week.",
  hfrAns3Q: "Deposit and terms",
  hfrAns3A: "Any deposit is agreed per home and stated before you book.",
  hfrAns4Q: "Wi-Fi and location",
  hfrAns4A: "Measured at each home: the owner sends a speed test, and we send it to you with the photos and the exact location before you book.",
  hfrHowTitle: "How it works",
  hfrHow1: "You send the request below: dates, bedrooms, area, budget and what the home must have.",
  hfrHow2: "We look for privately owned homes that fit.",
  hfrHow3: "Before we offer a home we check it: photos, exact location, and a Wi-Fi speed test from the owner.",
  hfrHow4: "You get the homes that fit, each with the total price, what is included and the deposit, and decide.",
  hfrHaveBody: "We run houses ourselves too, in Chang Khlan and Mae Rim, so a stay booked through us is handled by the same team on the ground.",
  hfrHaveLink: "See our houses",
  hfrFormTitle: "Tell us what you need",
  hfrFormBody: "A person reads every request and replies by email.",
  hfrFaqTitle: "Questions guests ask",
  hfrFaq1Q: "Do you have a private house free for a month in Chiang Mai?",
  hfrFaq1A: "Send your dates through the form on this page. We look for privately owned houses that are free for those dates and reply with the ones that fit, each with the total price.",
  hfrFaq2Q: "What does the monthly rate cover?",
  hfrFaq2A: "It depends on the home, and we state it for each one before you book: utilities, cleaning and internet. At the house we run, stays of 28 nights or more include utilities on fair use and one clean a week on a fixed day and time. Extra cleans are charged.",
  hfrFaq3Q: "What is the deposit?",
  hfrFaq3A: "Any deposit is agreed per home and stated before you book, so you know it before you pay anything.",
  hfrFaq4Q: "Is the Wi-Fi fast enough for remote work?",
  hfrFaq4A: "Yes, measured: before we offer a home, the owner sends a speed test, and we pass it to you with the photos and the exact location.",
  hfrFaq5Q: "Can you find a house near Nimman, Santitham or the Old City?",
  hfrFaq5A: "Yes, ask. Choose the area in the form, or say anywhere in Chiang Mai, and we tell you plainly if we cannot find a match.",
  hfrFaq6Q: "Do you work with other agents?",
  hfrFaq6A: "No. We find homes from their owners.",
  hfrFormName: "Your name",
  hfrFormEmail: "Email",
  hfrFormPhone: "Phone, WhatsApp or LINE",
  hfrFormOptional: "optional",
  hfrFormArea: "Area",
  hfrFormAreaAny: "Anywhere in Chiang Mai",
  hfrFormCheckIn: "Arrive",
  hfrFormCheckOut: "Leave",
  hfrFormBedrooms: "Bedrooms",
  hfrFormBudget: "Budget",
  hfrFormBudgetHint: "e.g. 30,000 THB a month",
  hfrFormFoundVia: "How did you find us?",
  hfrFormFoundViaHint: "e.g. Google, ChatGPT, a friend, Facebook",
  hfrFormMessage: "Must-haves",
  hfrFormMessageHint: "Private house, outdoor space, fibre Wi-Fi, work desk, quiet, near nature...",
  hfrFormRequired: "required",
  hfrFormSend: "Send request",
  hfrFormSending: "Sending...",
  hfrFormSentTitle: "Request received.",
  hfrFormSentBody: "A person reads it and replies by email. If it is urgent, write to",
  hfrFormError: "Sending failed. Please email us at {email}.",
  hfrFormConsent: "We use what you send only to reply to this request. See our",
  hfrFormPrivacy: "privacy policy",
  // /short-term-rental-licence-chiang-mai. Owner page: Thai takes ท่าน. Every legal line traces to str-legal-overview.md in agentsiam-consulting.
  licMetaTitle: "Short-term rental licence in Chiang Mai",
  licMetaDesc: "Do you need a licence to let your condo or house short term in Chiang Mai? The 30-night rule, the non-hotel route, and why condos cannot use it.",
  licCrumb: "Short-term rental licence",
  licEyebrow: "For owners · Chiang Mai",
  licH1: "Do you need a licence to rent out short term in Chiang Mai?",
  licIntro: "For stays under 30 nights, in most cases yes. Here is what the rules say today, for condos and for houses. Confirm the position for your own property before you list it.",
  licAns1Q: "Stays of 30 nights or more",
  licAns1A: "Legal without hotel registration.",
  licAns2Q: "Stays under 30 nights",
  licAns2A: "Fall under hotel-type registration under Thai law.",
  licAns3Q: "Houses, townhouses and villas",
  licAns3A: "Can take the non-hotel route: notify the local Registrar and obtain a Certificate of Exemption, instead of a full hotel licence.",
  licAns4Q: "Condos",
  licAns4A: "Cannot use the Certificate of Exemption. It is available to landed property only.",
  licExTitle: "The Certificate of Exemption",
  licRow1K: "Who can apply",
  licRow1V: "Owners of landed property: houses, townhouses and villas. Not condominium units.",
  licRow2K: "Limit",
  licRow2V: "Up to 8 rooms and 30 guests. Raised in 2023 from 4 rooms and 20 guests, and the old figure is still widely repeated.",
  licRow3K: "Valid for",
  licRow3V: "5 years, renewable.",
  licRow4K: "Inspection",
  licRow4V: "A safety inspection is mandatory: fire extinguishers, emergency lighting and smoke detectors.",
  licRow5K: "Where",
  licRow5V: "The District Office or the Provincial Administration Office.",
  licCondoTitle: "If you own a condo",
  licCondoBody: "The Certificate of Exemption is not open to condominium units, so a condo has no exemption route for stays under 30 nights. Stays of 30 nights or more do not need hotel registration. Separately from national law, your building's own rules can restrict short-term letting, so check them with the building's juristic person.",
  licHelpTitle: "We can file it for you",
  licHelpBody: "We assess your property against these rules, prepare the documents and file the application under power of attorney, so you do not have to deal with the office yourself.",
  licHelpLink: "See how it works",
  licContactLink: "Ask about your property",
  licFaqTitle: "Questions owners ask",
  licFaq1Q: "Do I need a licence to rent out my condo short term in Chiang Mai?",
  licFaq1A: "For stays under 30 nights, the rules treat it as hotel-type accommodation, and the non-hotel Certificate of Exemption is not available to condominium units. Stays of 30 nights or more do not need hotel registration. Your building's own rules can restrict short-term letting as well. Confirm the position for your unit before you list it.",
  licFaq2Q: "Is Airbnb legal in a Chiang Mai condo?",
  licFaq2A: "For stays of 30 nights or more, it needs no hotel registration, subject to your building's rules. For shorter stays a condo unit has no exemption route, because the Certificate of Exemption covers landed property only.",
  licFaq3Q: "Do I need a short-term rental licence for a house in Chiang Mai?",
  licFaq3A: "For stays under 30 nights, yes. A house, townhouse or villa can take the non-hotel route instead of a full hotel licence: notify the District Office or the Provincial Administration Office and obtain a Certificate of Exemption, valid for 5 years and renewable.",
  licFaq4Q: "How many rooms and guests does the Certificate of Exemption allow?",
  licFaq4A: "Up to 8 rooms and 30 guests, raised in 2023 from 4 rooms and 20 guests. The published sources do not settle whether rooms means bedrooms only or every habitable room.",
  licFaq5Q: "What does the safety inspection check?",
  licFaq5A: "Fire extinguishers, emergency lighting and smoke detectors.",
  licFaq6Q: "Is the 30-night rule enforced in Chiang Mai?",
  licFaq6A: "Enforcement is expanding in tourist-heavy areas, and in Chiang Mai that means Nimman and the Old City.",
  licLimitsTitle: "What this page is",
  licLimitsBody: "A summary of what published sources say today. It is not legal advice: confirm the position for your own property before you list it.",
  licSourcesTitle: "Sources",

  // -- area FAQ and contact guest pointer ----------------------------------
  // Neighbourhood FAQ. Answers 1 to 3 reuse the page's own lines; {area} is the localised name.
  areaFaqTitle: "Questions guests ask about {area}",
  areaFaqWhatQ: "What is {area} like to stay in?",
  areaFaqDistQ: "How far is {area} from Tha Phae Gate?",
  areaFaqDistA: "{n} km from Tha Phae Gate, measured in a straight line rather than by road.",
  areaFaqSuitsQ: "Who is {area} a good fit for?",
  areaFaqMonthQ: "Can I rent a house in {area} by the month?",
  areaFaqMonthA: "Yes, ask. Send your dates, size and budget through our monthly request form, and we look for privately owned homes in {area} that fit. If we cannot find one, we tell you plainly.",
  areaFaqMonthLink: "Ask for a monthly house",
  // /contact is the owner form; this points guests to the monthly request form instead.
  contactGuestNote: "Looking for a place to stay instead? Send your dates, size, area and budget through our monthly request form.",

  // -- homepage, renter hero choices ---------------------------------------
  // Hero choice one of three, by length of stay. Links to Lotus House.
  homeChoiceNightsTitle: "A few nights",
  homeChoiceNightsBody: "Book direct, at the rate without the platform markup.",
  homeChoiceNightsCta: "Check dates",
  // Hero choice two. Facts from hfrAns2A: 28 nights or more, utilities on fair use, one clean a week.
  homeChoiceMonthTitle: "A month or more",
  homeChoiceMonthBody: "Stay 28 nights or more, with utilities on fair use and a weekly clean included.",
  homeChoiceMonthCta: "See the houses",
  // Hero choice three. Links to the monthly request form on /house-for-rent-chiang-mai.
  homeChoiceFindTitle: "Find me a home",
  homeChoiceFindBody: "Tell us your dates, area and budget. We find privately owned homes that fit, checked first, each with the total price.",

  // -- Home page: the long-stay block, for guests here a month or more -----
  // Heading of the long-stay block. Guest register: คุณ, never ท่าน.
  longStayTitle: "Here for a month or more",
  longStaySub: "What a stay of 28 nights or more actually includes.",
  longStay1Title: "Utilities and a weekly clean",
  longStay1Body: "At 28 nights or more, electricity and water are on fair use and the house is cleaned once a week. Both are in the rate, not added at the end.",
  longStay2Title: "A desk, not the dining table",
  longStay2Body: "If you work remotely, every house has somewhere to do it: a desk in each bedroom in the Chang Khlan houses, and a separate work room out at Mae Rim.",
  longStay3Title: "Close to the centre, or out in a garden",
  longStay3Body: "Chang Khlan is about two kilometres out, with the Night Bazaar and the Ping within walking distance. Mae Rim trades that for a garden and 1,412 m² of land around the house.",

  // -- how-it-works Concept 2 (review build, English only) -----------------
  c2HeroTitle: "Your Chiang Mai property, run properly.",
  c2HeroSub: "We list it, price it, look after every guest and keep it legal. Add housekeeping and we run the cleaning and upkeep too. Whether you haven't listed yet, run it yourself today or are with another manager, we start from where you are.",
  c2CtaManage: "Have us manage yours",
  c2CtaStart: "Where are you starting from?",
  c2Proof1: "7 channels, plus your own booking site",
  c2Proof2: "TM30 filed for every foreign guest",
  c2Proof3: "A guest guide for your property",
  c2Proof4: "A team that lives in Chiang Mai",
  c2RouteTitle: "Where are you starting from?",
  c2RouteBody: "Three kinds of owner come to us. Pick yours.",
  c2Route1When: "Not listed yet",
  c2Route1Take: "Is it worth doing, and is it allowed?",
  c2Route1Why: "We model what the property would earn here against real local occupancy, and tell you whether it beats renting it long term. If the numbers say no, we say no. Then we handle the permission application and get the listing live. Your first step: the feasibility study.",
  c2Route2When: "Running it yourself",
  c2Route2Take: "Is handing it over worth what it costs?",
  c2Route2Why: "We take the listings, the pricing, the guests and the paperwork off your hands. Stay on Airbnb only if that is how you run it today, or let us open every channel. Keep your own cleaner if you like. Your first step: send us your last year of bookings. We read them at no cost and tell you what we would change.",
  c2Route3When: "With a manager now",
  c2Route3Take: "Will you actually do better, and is switching a headache?",
  c2Route3Why: "We read your current statements before we suggest anything, and show you what we would run differently. Then we agree a start date with you and take over the listings and the calendar from that day. Your first step: send us your last year of statements.",
  c2VpTitle: "What you get that most managers leave out",
  c2Vp1Title: "Every channel, if you want it",
  c2Vp1Body: "Airbnb, Booking.com, Agoda, Expedia, Vrbo, Trip.com and Google Vacation Rentals, plus a booking site of your own where a booking pays no platform commission. Prefer to stay on Airbnb? We run that too, with your own booking site alongside.",
  c2Vp2Title: "TM30, done for you",
  c2Vp2Body: "Thai law requires every foreign guest to be reported to Immigration. Most managers leave that with the owner. We file it, and it is in the fee.",
  c2Vp3Title: "A guide made for your guests",
  c2Vp3Body: "A page for your property on agentsiam.com, with places to eat, shop and see, measured from your door.",
  c2Vp4Title: "A team on the ground",
  c2Vp4Body: "We live in Chiang Mai. When something breaks at 11pm, someone local reads the message.",
  c2Vp5Title: "Legal, not just listed",
  c2Vp5Body: "We assess the property against the Hotel Act and the non-hotel framework, prepare the documents and file for you. We handle the application. We cannot guarantee the government's decision.",
  c2ScopeTitle: "What we run, and what you choose",
  c2ScopeIntro: "Management is the core. Housekeeping sits on top if you want it. And you can run it on every channel, or on Airbnb only.",
  c2IncTitle: "Management includes",
  c2Inc1: "Listings and marketing",
  c2Inc2: "Your own direct booking site",
  c2Inc3: "Rates and calendar",
  c2Inc4: "Guest messages for the whole stay",
  c2Inc5: "Reviews",
  c2Inc6: "The guest guide",
  c2Inc7: "TM30 reporting",
  c2Inc8: "Keeping your permission in order once it is granted",
  c2ExcTitle: "Management does not include",
  c2Exc1: "Cleaning and upkeep (that is housekeeping)",
  c2Exc2: "Insurance",
  c2Exc3: "Renovation and furnishing",
  c2Exc4: "Long-term tenants",
  c2Exc5: "Your own tax filing",
  c2HkTitle: "Housekeeping adds",
  c2Hk1: "Turnovers between guests",
  c2Hk2: "Hotel-quality linen and laundry",
  c2Hk3: "Consumables restocked",
  c2Hk4: "Maintenance arranged before it becomes a complaint",
  c2BaseTitle: "Airbnb only",
  c2BaseBody: "Everything in management, run on Airbnb and your own booking site only. TM30 and the guest guide are included. It costs less, and you can open every channel at any time.",
  c2SupplierLine: "The line we say out loud: we arrange the work, you pay the supplier, with no markup on the turnover.",
  c2FitTitle: "We take on properties we can make work.",
  c2FitBody: "Houses, townhouses and small buildings in Chiang Mai, and condos where the building permits short stays in writing. We look at the numbers before we sign, and if we cannot make it work, we tell you straight rather than take your money.",
  c2NeedTitle: "When you need them",
  c2NeedBody: "Not every owner needs these. When you do, we do them too.",
  c2Need1Title: "Feasibility study",
  c2Need1Body: "What the property would earn, before you commit.",
  c2Need2Title: "Vacation rental permission",
  c2Need2Body: "What your building and title allow, and the filing done for you.",
  c2Need3Title: "Interior photography",
  c2Need3Body: "Photos that meet the platforms' standards.",
  c2Need4Title: "Interior design and upgrades",
  c2Need4Body: "Where the property could earn more than it does.",
  c2FaqChargeQ: "What do you charge?",
  c2FaqChargeA: "Management fees start from 18% of room revenue. We take a share of what the property earns, so when it earns more, we both do. Contact us and we provide a custom made offer in accordance with your needs.",
  c2FaqCleanQ: "Do I have to use your cleaning?",
  c2FaqCleanA: "No. Housekeeping is an add-on, not a condition. Keep your own cleaner if you prefer.",
  c2FaqBaseQ: "Can I stay on Airbnb only?",
  c2FaqBaseA: "Yes. We run your Airbnb listing and your own booking site, and everything else in management stays the same. It costs less, and you can open every channel whenever you like.",
  c2FaqSwitchQ: "I am with another manager. How does switching work?",
  c2FaqSwitchA: "Send us your last year of statements. We read them before we suggest anything. If you decide to switch, we agree a start date with you and take over the listings and the calendar from that day.",
  c2FaqNotListedQ: "I have not listed yet. Where do I start?",
  c2FaqNotListedA: "With the numbers. The feasibility study models what the property would earn and whether it beats a long-term let. If it does not, we tell you so.",
  c2CloseTitle: "Tell us where you are starting from.",
  c2CloseBody: "A few details about the property, and we come back to you with what we would do.",

  // -- owner form as ICP filter (review build, English only) ---------------
  c2FormListedQ: "Is the property listed on Airbnb or another platform now?",
  c2Yes: "Yes",
  c2No: "No",
  c2FormAgencyQ: "Is it managed by an agency today?",
  c2FormLinkLabel: "Link to the listing",
  c2FormBedrooms: "Bedrooms",
  c2AreaElsewhere: "Elsewhere",
  c2FormPhoneLabel: "Phone or LINE",
  c2FormReachHint: "Email, or phone/LINE. At least one, so we can reply.",
  c2FormSub: "A few things to start. Everything else we can cover on a call.",
  c2FormNeedContact: "Please give an email, or a phone number or LINE ID, so we can reply.",

  // -- owner form required choices -----------------------------------------
  c2FormNeedDetails: "Please choose whether it is listed, the property type, where it is and the number of bedrooms.",

  // -- owner form: Wat Ket -------------------------------------------------
  c2AreaWatKet: "Wat Ket",
} as const;

export type Dictionary = { [K in keyof typeof en]: string };
