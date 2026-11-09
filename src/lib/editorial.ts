import { resolvePublishedLocale, type Locale } from "@/i18n/config";

/**
 * The two editorial outlets and every article in them.
 *
 * Why two and not one. The site already splits by audience everywhere else: a guest reads
 * /properties and /destinations, an owner reads /how-it-works and /management. The
 * dictionaries even split register, คุณ for guests and ท่าน for owners. An editorial
 * section that mixed the two would be the one place on the site that does not, and the
 * reader it would confuse is the owner, who is the expensive one to lose.
 *
 * | | Journal of Chiang Mai | Chiang Mai Host Newsletter |
 * |---|---|---|
 * | Route | /journal | /host-newsletter |
 * | Reader | Deciding whether and when to come | Deciding whether to let a property |
 * | Published in | English, Thai, Chinese | **Thai**, English, Chinese |
 * | Links out to | Destinations, properties, the local guides | How it works, the licence page, contact |
 *
 * **Each outlet is published in the languages its own audience reads, and the two differ.**
 * `service-model.md` in agentsiam-consulting, under "Who the owner is", records decision #67:
 * the owners of Chiang Mai houses and townhouses are mostly Thai, so the owner market is a
 * Thai market, owner material is written Thai-first in the owner register, and foreign owners
 * are reached in English. The host newsletter is therefore written in Thai, and published in
 * all three: Paul set the owner audience on 09/11/2026 as Thai, then English, then Chinese,
 * largest to smallest, which is the order HOST_LOCALES is written in.
 *
 * The guest journal is published in all three too, because the guest-facing site already is:
 * the homepage, the property pages and the neighbourhood pages all serve renters in English,
 * Thai and Chinese, and an editorial section that did not would be the one guest page that
 * picks its readers. It is written in English and translated, which is why English is first
 * in JOURNAL_LOCALES; the owner article is written in Thai and so leads with th.
 *
 * So both outlets now carry all three languages, and the ordering is the only difference.
 * That ordering is not cosmetic: the first entry is the language a piece was written in, and
 * `resolvePublishedLocale` falls back through it when a visitor asks for a language a piece
 * does not carry.
 *
 * Register follows the audience and not the language: guest copy takes คุณ, owner copy takes
 * ท่าน, which is the same split the dictionaries keep and the easiest thing here to get
 * wrong, since both outlets now carry Thai.
 *
 * **Why the prose is here and not in the dictionaries.** Every reader-facing string on this
 * site belongs in src/i18n/dictionaries, and that rule is right: it is the only place a
 * translation can be checked, and the recurring i18n bug in this repo is copy that lived in
 * a lib/ array because it felt like data. The line drawn here is between chrome and
 * editorial. Chrome, the labels framing a piece, "Read next" and "Sources", is navigation
 * and lives in the dictionaries in all three languages, under the `article` keys. Editorial
 * copy, the words of the piece itself, lives here, because R9 makes a dictionary copy pass
 * one scripted three-language patch and that is the correct cost for a navigation label and
 * an absurd one for an article that should be revised freely.
 *
 * What that costs, stated rather than hidden: a piece can exist in one language and not
 * another, which `publishedIn` declares per article and per outlet, and which the hreflang
 * tags, the sitemap and the canonical all read so that a locale a piece does not carry falls
 * back rather than publishing a duplicate URL.
 *
 * **Every figure here was verified on the date in `checkedOn`, not taken from memory and not
 * taken from the document store on its own.** The document store's own instruction on the
 * market data is to re-verify before quoting any figure to an owner, and publishing is
 * quoting. Two figures that agentsiam-consulting carries did not survive that check and are
 * deliberately absent: a count of DTV visa holders, which no public source appears to
 * publish, and an estimate of Chiang Mai's remote-worker population, which the 04/11/2026
 * content plan marks as modelled and says explicitly must not go on the site.
 */

export type OutletSlug = "journal" | "host-newsletter";

/** All three. Written in English, then translated, which is why English is first. */
export const JOURNAL_LOCALES = ["en", "th", "zh"] as const satisfies readonly Locale[];

/**
 * Thai, then English, then Chinese, in that order deliberately: it is the owner audience
 * from largest to smallest, per Paul 09/11/2026 extending decision #67. Thai is also the
 * language the pieces are written in, so it is first on both counts.
 */
export const HOST_LOCALES = ["th", "en", "zh"] as const satisfies readonly Locale[];

/** The masthead and framing for one outlet, in one language. */
export type OutletCopy = {
  /** The masthead. */
  name: string;
  /** One line under it, saying who it is for. */
  standfirst: string;
  metaTitle: string;
  metaDesc: string;
  ctaLabel: string;
};

export type Outlet = {
  slug: OutletSlug;
  publishedIn: readonly Locale[];
  /** Where the index sends a reader who wants the service rather than the reading. */
  ctaPath: string;
  copy: Partial<Record<Locale, OutletCopy>>;
};

export const OUTLETS: Record<OutletSlug, Outlet> = {
  journal: {
    slug: "journal",
    publishedIn: JOURNAL_LOCALES,
    ctaPath: "/properties",
    copy: {
      en: {
        name: "Journal of Chiang Mai",
        standfirst:
          "Written for people deciding whether to come to Chiang Mai, and when. Published by AgentSiam, who manage houses here and answer the questions guests actually ask before they book.",
        metaTitle: "Journal of Chiang Mai: honest guides to visiting and staying",
        metaDesc:
          "Guides to visiting Chiang Mai from the people who manage houses here. Air quality by month, neighbourhoods, and the things most travel posts leave out.",
        ctaLabel: "See the houses we manage",
      },
      th: {
        name: "วารสารเชียงใหม่",
        standfirst:
          "เขียนสำหรับคนที่กำลังตัดสินใจว่าจะมาเชียงใหม่หรือไม่ และควรมาเมื่อไร เผยแพร่โดย AgentSiam ผู้ดูแลบ้านพักในเชียงใหม่ และตอบคำถามที่ผู้เข้าพักถามจริงก่อนจอง",
        metaTitle: "วารสารเชียงใหม่ คู่มือที่ตรงไปตรงมาสำหรับการมาเยือนและเข้าพัก",
        metaDesc:
          "คู่มือเที่ยวเชียงใหม่จากคนที่ดูแลบ้านพักที่นี่ คุณภาพอากาศรายเดือน ย่านต่าง ๆ และเรื่องที่บทความท่องเที่ยวส่วนใหญ่ไม่ได้บอก",
        ctaLabel: "ดูบ้านที่เราดูแล",
      },
      zh: {
        name: "清迈纪事",
        standfirst:
          "写给正在考虑是否来清迈、以及何时来的人。由 AgentSiam 发布，我们在此地管理房屋，并回答房客在预订前真正会问的问题。",
        metaTitle: "清迈纪事：关于到访与住宿的诚实指南",
        metaDesc:
          "来自在清迈管理房屋的团队的旅行指南。逐月空气质量、各个街区，以及大多数旅游文章略过的内容。",
        ctaLabel: "查看我们管理的房屋",
      },
    },
  },
  "host-newsletter": {
    slug: "host-newsletter",
    publishedIn: HOST_LOCALES,
    ctaPath: "/how-it-works",
    copy: {
      th: {
        name: "จดหมายข่าวสำหรับเจ้าของบ้านเชียงใหม่",
        standfirst:
          "เขียนสำหรับเจ้าของทรัพย์สินในเชียงใหม่ที่กำลังพิจารณาปล่อยเช่าระยะสั้น เผยแพร่โดย AgentSiam เป็นภาษาไทย อังกฤษ และจีน ไม่มีรายชื่อรับข่าวสารและไม่ต้องสมัคร ทุกอย่างที่เราเผยแพร่สำหรับเจ้าของทรัพย์สินอยู่บนหน้านี้",
        metaTitle: "จดหมายข่าวสำหรับเจ้าของบ้านเชียงใหม่ โดย AgentSiam",
        metaDesc:
          "บันทึกสำหรับเจ้าของทรัพย์สินในเชียงใหม่ เรื่องอัตราการเข้าพัก ฤดูกาล และสิ่งที่การคาดการณ์บอกได้และบอกไม่ได้ จากผู้จัดการที่ดำเนินงานในพื้นที่",
        ctaLabel: "บริการจัดการทำงานอย่างไร",
      },
      en: {
        name: "Chiang Mai Host Newsletter",
        standfirst:
          "Written for people who own property in Chiang Mai and are weighing whether to offer it as a short-term rental. Published by AgentSiam in Thai, English and Chinese. No mailing list and no sign-up: everything we publish for owners sits on this page.",
        metaTitle: "Chiang Mai Host Newsletter: what owners need to know",
        metaDesc:
          "Notes for Chiang Mai property owners on occupancy, seasonality and what a short-let forecast can and cannot tell you. From a manager operating here.",
        ctaLabel: "How management works",
      },
      zh: {
        name: "清迈房东通讯",
        standfirst:
          "写给在清迈拥有物业、正在考虑是否用于短租的业主。AgentSiam 以泰文、英文和中文发布；没有邮件订阅，我们为业主发布的内容都在本页。",
        metaTitle: "清迈房东通讯：业主需要知道的事",
        metaDesc:
          "写给清迈业主的笔记，关于入住率、季节性，以及一份短租预测能说明什么、不能说明什么。来自在当地实际运营的管理方。",
        ctaLabel: "管理服务如何运作",
      },
    },
  },
};

export type ArticleSection = {
  /** An h2, written as far as possible as the question a reader would type. */
  heading: string;
  body: string[];
  /** Rendered after this section's paragraphs, where the section is what sets it up. */
  table?: ArticleTable;
};

export type ArticleTable = {
  title: string;
  head: string[];
  rows: string[][];
  /** The line under the table. A table of figures without its caveat is a claim. */
  note: string;
};

/** Everything in an article that is written per language. */
export type ArticleBody = {
  /** The h1, and the Article headline in markup. */
  title: string;
  /** <title>, where a long h1 would be truncated in a result. */
  metaTitle: string;
  metaDesc: string;
  /** Shown under the h1, and the Article description in markup. */
  standfirst: string;
  /**
   * The first screen. Four questions with answers short enough to be lifted whole.
   * This is the shape /short-term-rental-licence-chiang-mai uses, and it is the shape an
   * answer engine can quote without reading the rest of the page.
   */
  answers: { q: string; a: string }[];
  sections: ArticleSection[];
  /** Rendered as an accordion and published as FAQPage markup. The two must agree. */
  faq: { q: string; a: string }[];
  /** What the piece does not settle. There is no article without a limit. */
  limits: string;
  /** Internal links out. An article that sends nobody anywhere earns its keep once. */
  related: { label: string; path: string }[];
};

export type Article = {
  slug: string;
  outlet: OutletSlug;
  /** ISO, per C28. Read by articleSchema(), never defaulted to today. */
  datePublished: string;
  dateModified?: string;
  /** ISO, per C28. Printed on the page through localeDate(), never printed raw. */
  checkedOn: string;
  /** The first entry is the language the piece was written in. */
  publishedIn: readonly Locale[];
  body: Partial<Record<Locale, ArticleBody>>;
  /** The same sources whichever language the piece is read in. */
  sources: { name: string; url: string }[];
};

const WHEN_TO_VISIT: Article = {
  slug: "when-to-visit-chiang-mai",
  outlet: "journal",
  datePublished: "2026-11-09",
  checkedOn: "2026-11-09",
  publishedIn: JOURNAL_LOCALES,
  body: {
    en: {
      title: "When to come to Chiang Mai, and the weeks to think twice about",
      metaTitle: "Best time to visit Chiang Mai: weather and burning season",
      metaDesc:
        "When to visit Chiang Mai: cool-season weather, burning-season risks, rainy-season trade-offs and dated air-quality readings.",
      standfirst:
        "Most guides to Chiang Mai bury the air quality in a paragraph near the bottom. It belongs at the top, because for two months of the year it is the single thing most likely to spoil a trip, and because it is the one part of the decision a booking site has no reason to tell you about.",
      answers: [
        {
          q: "The best months",
          a: "November to January. Dry, cool, clear, and the stretch of the year the city is at its most comfortable. It is also the busiest, so accommodation is tighter and dearer.",
        },
        {
          q: "The months to think twice about",
          a: "Late February through March, and often into early April. This is burning season, when smoke from agricultural and forest fires settles over the valley. March is usually the worst of it.",
        },
        {
          q: "How bad does it actually get",
          a: "In March 2026 Chiang Mai repeatedly ranked first in IQAir's live ranking of major cities by air pollution. IQAir recorded an Air Quality Index of 233 on 30 March and a reading of 263 on 29 March, with PM2.5 at 188 micrograms per cubic metre.",
        },
        {
          q: "If March is your only window",
          a: "A March trip can still work, but plan around the air: check the AQI daily, choose a well-sealed room with an appropriately sized air purifier, and build indoor options into the itinerary. If the AQI reaches very unhealthy levels, follow public-health guidance and be ready to change plans.",
        },
      ],
      sections: [
        {
          heading: "What burning season actually is",
          body: [
            "Every year between roughly February and April, farmland across northern Thailand and the countries bordering it is cleared by fire, and forest fires start in the dry hills at the same time. Chiang Mai sits in a bowl ringed by mountains, so the smoke that would disperse over flat ground collects over the city instead and stays until the weather changes.",
            "IQAir attributes the problem mainly to biomass burning tied to agricultural practice and seasonal forest fires. NASA FIRMS recorded more than 2,090 hotspots in Chiang Mai Province between 1 January and 27 March 2026. The season does not end on a fixed date: on 7 April the city still ranked first in IQAir's live ranking of major cities.",
            "The important thing for a visitor is that this is seasonal and not a description of Chiang Mai generally. IQAir put the city's 2025 annual average for fine particulates at 18.2 micrograms per cubic metre, which it classes as moderate. The problem is concentrated, severe, and over by roughly the end of April.",
          ],
        },
        {
          heading: "The measured figures, with their dates",
          body: [
            "Air quality claims are worth very little without a timestamp, so here are the readings rather than an adjective. On 4 March 2026 IQAir classed the air as unhealthy, above an index of 150, and ranked Chiang Mai third in its live ranking of major cities. On 26 March the air was very unhealthy and the city ranked first. On 29 March a reading of 263 was recorded, with PM2.5 at 188 micrograms per cubic metre. On 30 March at 10am the index stood at 233 and the city again ranked first. Set against those hours, IQAir puts Chiang Mai's average PM2.5 across the whole of 2025 at 18.2 micrograms per cubic metre, an index of 63 and moderate, which is 3.6 times the World Health Organization's annual guideline. The year is not March.",
            "Two cautions on those numbers, and they matter. They are instantaneous readings taken at a moment, not monthly averages, and the index moves through the day, usually worst in the morning. And the figures published by different outlets for the same week do not match exactly, because they are snapshots from different hours. Treat them as the right order of magnitude rather than as precise measurements of a month.",
          ],
        },
        {
          heading: "How the year is shaped",
          body: [
            "Chiang Mai has three seasons rather than four, and they are more useful to plan around than months are.",
          ],
          table: {
            title: "The three seasons",
            head: ["Roughly", "What it is", "Worth knowing"],
            rows: [
              [
                "November to January",
                "Cool and dry",
                "The most comfortable weather of the year and the busiest. Book early, expect higher rates, and expect company at the well-known places.",
              ],
              [
                "February to April",
                "Hot, and burning season",
                "Heat climbs through March and April. Smoke arrives in late February and peaks in March. April brings Songkran, which is a genuine reason to come in spite of the air.",
              ],
              [
                "May to October",
                "Green and wet",
                "Rain often comes in afternoon bursts rather than lasting all day, although heavier spells can disrupt plans more substantially. August and September are typically the wettest months and are often among the quietest and most affordable.",
              ],
            ],
            note: "The season boundaries shift by a few weeks each year. The air quality dates above are the measured ones; the seasonal shape is the ordinary pattern and not a forecast.",
          },
        },
        {
          heading: "If you can only come in February, March or April",
          body: [
            "This is a real trip, not a write-off, and plenty of people have a very good time then. What separates them from the people who leave early is that they planned for the air instead of hoping.",
            "Check the AQI each morning rather than the weather, because a clear-looking sky in March is not evidence of clean air. Treat time in well-filtered indoor venues as part of the holiday: Chiang Mai has many cafes, cooking schools, massage venues, museums and covered markets. Before booking, ask whether the room seals properly and has an air purifier sized for the space; a typical room air conditioner is not a substitute for fine-particle filtration. If you want to leave the city, check the destination's AQI first: northern mountain areas can be affected by the same smoke. Some coastal or southern destinations may have cleaner air, but conditions should be checked on the day.",
            "People with asthma, lung or heart conditions, older adults, children and pregnant travellers are at higher risk and should seek medical advice and consider different dates. When the AQI is very unhealthy, everyone should reduce exposure and follow public-health guidance.",
          ],
        },
        {
          heading: "What the quiet months give you instead",
          body: [
            "The flip side of a season many travellers overlook is that fewer people are competing for rooms and space. The rains, roughly May to October, are among Chiang Mai's least-booked months and in several ways its best: the hills are green, the waterfalls are running and the temples are less crowded. Rain often comes in afternoon bursts rather than lasting all day, although heavier spells can disrupt plans more substantially. September is typically the wettest month.",
            "November to January is the genuinely excellent stretch and everybody knows it, which is the only argument against it. If you want the city at its best and do not mind sharing it, that is the window. If you want the city to yourself and will trade an afternoon shower for it, come in the rains.",
          ],
        },
      ],
      faq: [
        {
          q: "When is the best time to visit Chiang Mai?",
          a: "November to January, when the weather is cool and dry and the air is at its clearest. It is also the busiest and most expensive period. For fewer people and lower prices at the cost of afternoon rain, the green season from May to October is the better trade.",
        },
        {
          q: "Which months have the worst air quality in Chiang Mai?",
          a: "Late February, March and sometimes early April. March is usually the worst. In March 2026 Chiang Mai repeatedly ranked first in IQAir's live ranking of major cities by air pollution, with readings of 233 on 30 March and 263 on 29 March.",
        },
        {
          q: "Is Chiang Mai still worth visiting during burning season?",
          a: "A trip can still work if you plan around the air: check the AQI daily, choose a well-sealed room with an appropriately sized air purifier, and build indoor options into the itinerary. People with asthma, lung or heart conditions, older adults, children and pregnant travellers are at higher risk and should seek medical advice and consider different dates.",
        },
        {
          q: "How long does burning season last in Chiang Mai?",
          a: "Roughly February to April, usually with the worst of it in March. It does not end on a fixed date. In 2026 the city still ranked first in IQAir's live ranking of major cities on 7 April, before conditions returned close to normal around May.",
        },
        {
          q: "Does air conditioning help with the smoke?",
          a: "A typical room air conditioner is not a substitute for fine-particle filtration. What helps is a well-sealed room plus an appropriately sized purifier with a HEPA filter, or an HVAC system fitted with a suitable high-efficiency filter. Ask what a property actually has before booking in March.",
        },
        {
          q: "Is the rainy season a bad time to visit Chiang Mai?",
          a: "Less than its reputation suggests. Rain often comes in afternoon bursts rather than lasting all day, although heavier spells can disrupt plans more substantially. August and September are typically the wettest, and the countryside is at its greenest. It is often among the quietest and most affordable parts of the year.",
        },
      ],
      limits:
        "The air quality readings above are instantaneous measurements on the dates given, taken from IQAir and from reporting of IQAir data, not monthly averages, and figures published for the same week differ between outlets because they are snapshots from different hours. Burning season varies year to year in both severity and timing, so last year's dates are a guide and not a prediction. We manage houses in Chiang Mai; we are not an air quality authority. Anyone making a health decision should check the index on the day, follow public-health guidance and seek medical advice if they are in a higher-risk group.",
      related: [
        { label: "Neighbourhoods in Chiang Mai", path: "/destinations" },
        { label: "Houses we manage", path: "/properties" },
        { label: "Our local guide for guests", path: "/lotushouse/local-guide" },
      ],
    },
    th: {
      title: "ควรมาเชียงใหม่เมื่อไร และช่วงไหนที่ควรคิดให้ดีก่อน",
      metaTitle: "เที่ยวเชียงใหม่ช่วงไหนดี เดือนที่ดีที่สุดและฤดูหมอกควัน",
      metaDesc:
        "เที่ยวเชียงใหม่ช่วงไหนดี ทั้งอากาศเย็น ฤดูหมอกควัน ฤดูฝน และตัวเลขคุณภาพอากาศที่ระบุวันที่และแหล่งอ้างอิง",
      standfirst:
        "คู่มือเที่ยวเชียงใหม่ส่วนใหญ่ซ่อนเรื่องคุณภาพอากาศไว้ในย่อหน้าท้าย ๆ แต่เรื่องนี้ควรอยู่ด้านบน เพราะสองเดือนของปีมันคือสิ่งเดียวที่มีโอกาสทำให้ทริปของคุณเสียมากที่สุด และเพราะเป็นส่วนเดียวของการตัดสินใจที่เว็บจองที่พักไม่มีเหตุผลจะบอกคุณ",
      answers: [
        {
          q: "เดือนที่ดีที่สุด",
          a: "พฤศจิกายนถึงมกราคม อากาศแห้ง เย็น ฟ้าใส และเป็นช่วงที่เมืองน่าอยู่ที่สุดของปี ขณะเดียวกันก็เป็นช่วงที่คนมากที่สุด ที่พักจึงหายากและราคาสูงขึ้น",
        },
        {
          q: "เดือนที่ควรคิดให้ดี",
          a: "ปลายกุมภาพันธ์ถึงมีนาคม และมักลามถึงต้นเมษายน นี่คือฤดูหมอกควัน ช่วงที่ควันจากการเผาในภาคเกษตรและไฟป่าลอยมาสะสมในแอ่งเมือง เดือนมีนาคมหนักที่สุดแทบทุกปี",
        },
        {
          q: "หนักแค่ไหนจริง ๆ",
          a: "ในเดือนมีนาคม 2026 เชียงใหม่ขึ้นอันดับหนึ่งในการจัดอันดับเมืองใหญ่ด้านมลพิษทางอากาศแบบเรียลไทม์ของ IQAir หลายครั้ง IQAir บันทึกดัชนีคุณภาพอากาศที่ 233 เมื่อวันที่ 30 มีนาคม และ 263 เมื่อวันที่ 29 มีนาคม โดยมี PM2.5 ที่ 188 ไมโครกรัมต่อลูกบาศก์เมตร",
        },
        {
          q: "ถ้ามาได้แค่เดือนมีนาคม",
          a: "ทริปเดือนมีนาคมยังเป็นไปได้ แต่ต้องวางแผนตามสภาพอากาศ ดูค่าดัชนีคุณภาพอากาศทุกวัน เลือกห้องที่ปิดได้สนิทและมีเครื่องฟอกอากาศขนาดเหมาะสม และเตรียมกิจกรรมในร่มไว้ หากค่าฝุ่นอยู่ในระดับไม่ดีต่อสุขภาพมาก ให้ทำตามคำแนะนำของหน่วยงานสาธารณสุขและพร้อมเปลี่ยนแผน",
        },
      ],
      sections: [
        {
          heading: "ฤดูหมอกควันคืออะไรกันแน่",
          body: [
            "ทุกปีราวเดือนกุมภาพันธ์ถึงเมษายน พื้นที่เกษตรทั่วภาคเหนือของไทยและประเทศเพื่อนบ้านถูกเผาเพื่อเตรียมดิน และไฟป่าก็เกิดขึ้นในเขาที่แห้งในช่วงเดียวกัน เชียงใหม่ตั้งอยู่ในแอ่งที่มีภูเขาล้อมรอบ ควันที่ควรกระจายไปในพื้นที่ราบจึงสะสมอยู่เหนือเมืองแทน และอยู่อย่างนั้นจนกว่าสภาพอากาศจะเปลี่ยน",
            "IQAir ระบุว่าสาเหตุหลักมาจากการเผาชีวมวลที่เกี่ยวข้องกับการเกษตรและไฟป่าตามฤดูกาล ข้อมูลจาก NASA FIRMS ระบุว่า จังหวัดเชียงใหม่มีจุดความร้อนมากกว่า 2,090 จุดระหว่างวันที่ 1 มกราคมถึง 27 มีนาคม 2026 ฤดูนี้ไม่ได้จบลงในวันที่แน่นอน และเมื่อวันที่ 7 เมษายน เมืองยังอยู่อันดับหนึ่งในการจัดอันดับเมืองใหญ่แบบเรียลไทม์ของ IQAir",
            "สิ่งสำคัญสำหรับผู้มาเยือนคือ นี่เป็นเรื่องตามฤดูกาล ไม่ใช่คำอธิบายเชียงใหม่โดยทั่วไป IQAir ระบุค่าเฉลี่ยฝุ่นละอองขนาดเล็กทั้งปี 2025 ของเมืองไว้ที่ 18.2 ไมโครกรัมต่อลูกบาศก์เมตร ซึ่งจัดอยู่ในระดับปานกลาง ปัญหานี้กระจุกตัว รุนแรง และจบลงราวปลายเดือนเมษายน",
          ],
        },
        {
          heading: "ตัวเลขที่วัดได้ พร้อมวันที่",
          body: [
            "การพูดถึงคุณภาพอากาศโดยไม่ระบุเวลาแทบไม่มีความหมาย นี่คือค่าที่วัดได้จริงแทนคำบรรยาย วันที่ 4 มีนาคม 2026 IQAir จัดระดับอากาศว่าไม่ดีต่อสุขภาพ สูงกว่าดัชนี 150 และจัดให้เชียงใหม่อยู่อันดับสามในการจัดอันดับเมืองใหญ่แบบเรียลไทม์ วันที่ 26 มีนาคม อากาศอยู่ในระดับไม่ดีต่อสุขภาพอย่างมาก และเมืองอยู่อันดับหนึ่ง วันที่ 29 มีนาคม บันทึกค่าได้ 263 โดยมี PM2.5 ที่ 188 ไมโครกรัมต่อลูกบาศก์เมตร และวันที่ 30 มีนาคม เวลา 10 นาฬิกา ดัชนีอยู่ที่ 233 โดยเมืองยังอยู่อันดับหนึ่ง ในทางกลับกัน IQAir ระบุค่าเฉลี่ย PM2.5 ของเชียงใหม่ทั้งปี 2025 ไว้ที่ 18.2 ไมโครกรัมต่อลูกบาศก์เมตร เท่ากับดัชนี 63 ระดับปานกลาง ซึ่งเป็น 3.6 เท่าของค่าแนะนำรายปีขององค์การอนามัยโลก ทั้งปีไม่ได้เป็นเหมือนเดือนมีนาคม",
            "มีข้อควรระวังสองข้อเกี่ยวกับตัวเลขเหล่านี้ และทั้งสองข้อสำคัญ ค่าเหล่านี้เป็นค่าที่วัด ณ ขณะหนึ่ง ไม่ใช่ค่าเฉลี่ยรายเดือน และดัชนีเปลี่ยนไปตลอดวัน โดยมักแย่ที่สุดในช่วงเช้า อีกทั้งตัวเลขที่สื่อแต่ละแห่งเผยแพร่สำหรับสัปดาห์เดียวกันก็ไม่ตรงกันเป๊ะ เพราะเป็นภาพถ่าย ณ คนละชั่วโมง จึงควรมองว่าเป็นระดับความรุนแรงโดยประมาณ ไม่ใช่การวัดค่าทั้งเดือนอย่างแม่นยำ",
          ],
        },
        {
          heading: "ปีของเชียงใหม่เป็นอย่างไร",
          body: [
            "เชียงใหม่มีสามฤดูมากกว่าสี่ และการวางแผนตามฤดูมีประโยชน์กว่าการดูเป็นเดือน",
          ],
          table: {
            title: "สามฤดูของเชียงใหม่",
            head: ["ช่วงเวลาโดยประมาณ", "ลักษณะ", "สิ่งที่ควรรู้"],
            rows: [
              [
                "พฤศจิกายนถึงมกราคม",
                "เย็นและแห้ง",
                "อากาศสบายที่สุดของปีและคนมากที่สุด ควรจองล่วงหน้า ราคาสูงขึ้น และสถานที่ยอดนิยมจะมีคนเยอะ",
              ],
              [
                "กุมภาพันธ์ถึงเมษายน",
                "ร้อน และเป็นฤดูหมอกควัน",
                "อากาศร้อนขึ้นเรื่อย ๆ ตลอดมีนาคมและเมษายน ควันมาถึงปลายกุมภาพันธ์และหนักสุดในมีนาคม เมษายนมีสงกรานต์ ซึ่งเป็นเหตุผลที่ดีพอจะมาทั้งที่อากาศไม่ดี",
              ],
              [
                "พฤษภาคมถึงตุลาคม",
                "เขียวและฝนชุก",
                "ฝนมักตกหนักเป็นช่วง ๆ ในตอนบ่ายมากกว่าตกทั้งวัน แต่ฝนต่อเนื่องอาจกระทบแผนได้มากกว่านั้น สิงหาคมและกันยายนมักมีฝนมากที่สุด และเป็นหนึ่งในช่วงที่เงียบและประหยัดที่สุดของปี",
              ],
            ],
            note: "ขอบเขตของแต่ละฤดูขยับได้ปีละไม่กี่สัปดาห์ วันที่ของค่าคุณภาพอากาศข้างต้นคือค่าที่วัดได้จริง ส่วนรูปแบบฤดูกาลเป็นแบบแผนปกติ ไม่ใช่การพยากรณ์",
          },
        },
        {
          heading: "ถ้าคุณมาได้แค่เดือนกุมภาพันธ์ มีนาคม หรือเมษายน",
          body: [
            "นี่คือทริปที่เป็นไปได้จริง ไม่ใช่ทริปที่ต้องตัดทิ้ง และหลายคนก็เที่ยวได้สนุกมาก สิ่งที่แยกพวกเขาออกจากคนที่กลับก่อนกำหนดคือ พวกเขาวางแผนเรื่องอากาศไว้แล้ว ไม่ใช่แค่หวัง",
            "ดูค่าดัชนีทุกเช้าแทนการดูพยากรณ์อากาศ เพราะท้องฟ้าที่ดูใสในเดือนมีนาคมไม่ได้หมายความว่าอากาศสะอาด ให้ถือว่ากิจกรรมในอาคารที่มีระบบกรองอากาศเป็นส่วนหนึ่งของการเที่ยว เชียงใหม่มีคาเฟ่ โรงเรียนสอนทำอาหาร ร้านนวด พิพิธภัณฑ์ และตลาดในร่มให้เลือกมาก ก่อนจองควรถามว่าห้องปิดได้สนิทหรือไม่ และมีเครื่องฟอกอากาศที่เหมาะกับขนาดห้องหรือเปล่า เครื่องปรับอากาศในห้องทั่วไปไม่ใช่สิ่งทดแทนระบบกรองฝุ่นละเอียด หากต้องการออกนอกเมือง ให้ตรวจค่าคุณภาพอากาศของจุดหมายก่อน เพราะพื้นที่ภูเขาทางเหนืออาจได้รับผลกระทบจากควันเช่นกัน จุดหมายริมทะเลหรือทางใต้บางแห่งอาจมีอากาศดีกว่า แต่ควรตรวจข้อมูลในวันเดินทาง",
            "ผู้ที่เป็นโรคหอบหืด โรคปอดหรือโรคหัวใจ ผู้สูงอายุ เด็ก และผู้ตั้งครรภ์มีความเสี่ยงสูงกว่า ควรปรึกษาแพทย์และพิจารณาเปลี่ยนวันเดินทาง เมื่อดัชนีคุณภาพอากาศอยู่ในระดับไม่ดีต่อสุขภาพมาก ทุกคนควรลดการสัมผัสและทำตามคำแนะนำของหน่วยงานสาธารณสุข",
          ],
        },
        {
          heading: "สิ่งที่เดือนเงียบ ๆ มอบให้แทน",
          body: [
            "อีกด้านของฤดูที่นักเดินทางจำนวนมากมองข้าม คือมีคนแย่งพื้นที่และที่พักน้อยลง ฤดูฝนราวพฤษภาคมถึงตุลาคมเป็นหนึ่งในช่วงที่มีนักท่องเที่ยวและการจองน้อยที่สุดของปีในเชียงใหม่ และในหลายแง่คือช่วงที่ดีที่สุด ภูเขาเขียว น้ำตกมีน้ำ และวัดไม่แน่น ฝนมักตกหนักเป็นช่วง ๆ ในตอนบ่ายมากกว่าตกทั้งวัน แต่ฝนต่อเนื่องอาจกระทบแผนได้มากกว่านั้น โดยทั่วไปกันยายนเป็นเดือนที่มีฝนมากที่สุด",
            "พฤศจิกายนถึงมกราคมคือช่วงที่ดีเยี่ยมจริง และทุกคนก็รู้ ซึ่งเป็นข้อเสียเพียงข้อเดียวของมัน ถ้าคุณอยากเห็นเมืองในสภาพดีที่สุดและไม่รังเกียจการแบ่งปันกับคนอื่น นั่นคือช่วงเวลานั้น ถ้าคุณอยากได้เมืองเกือบทั้งเมืองไว้คนเดียวและยอมแลกกับฝนช่วงบ่าย ให้มาหน้าฝน",
          ],
        },
      ],
      faq: [
        {
          q: "ควรไปเที่ยวเชียงใหม่ช่วงไหนดีที่สุด",
          a: "พฤศจิกายนถึงมกราคม ช่วงที่อากาศเย็น แห้ง และอากาศใสที่สุด ขณะเดียวกันก็เป็นช่วงที่คนมากและราคาสูงที่สุด หากต้องการคนน้อยกว่าและราคาถูกกว่า โดยแลกกับฝนช่วงบ่าย ฤดูฝนตั้งแต่พฤษภาคมถึงตุลาคมเป็นตัวเลือกที่คุ้มกว่า",
        },
        {
          q: "เดือนไหนที่เชียงใหม่มีคุณภาพอากาศแย่ที่สุด",
          a: "ปลายกุมภาพันธ์ มีนาคม และบางครั้งต้นเมษายน โดยทั่วไปมีนาคมแย่ที่สุด ในเดือนมีนาคม 2026 เชียงใหม่ขึ้นอันดับหนึ่งในการจัดอันดับเมืองใหญ่ด้านมลพิษทางอากาศแบบเรียลไทม์ของ IQAir หลายครั้ง โดยบันทึกดัชนีได้ 233 เมื่อวันที่ 30 มีนาคม และ 263 เมื่อวันที่ 29 มีนาคม",
        },
        {
          q: "ช่วงฤดูหมอกควันยังควรไปเที่ยวเชียงใหม่หรือไม่",
          a: "ยังเที่ยวได้หากวางแผนตามสภาพอากาศ ดูค่าดัชนีคุณภาพอากาศทุกวัน เลือกห้องที่ปิดสนิทพร้อมเครื่องฟอกอากาศขนาดเหมาะสม และเตรียมกิจกรรมในร่มไว้ ผู้ที่เป็นโรคหอบหืด โรคปอดหรือโรคหัวใจ ผู้สูงอายุ เด็ก และผู้ตั้งครรภ์มีความเสี่ยงสูงกว่า ควรปรึกษาแพทย์และพิจารณาเลือกวันอื่น",
        },
        {
          q: "ฤดูหมอกควันที่เชียงใหม่ยาวนานแค่ไหน",
          a: "ราวกุมภาพันธ์ถึงเมษายน โดยทั่วไปหนักที่สุดในมีนาคม และไม่ได้จบในวันที่ตายตัว ในปี 2026 เมืองยังอยู่อันดับหนึ่งในการจัดอันดับเมืองใหญ่แบบเรียลไทม์ของ IQAir เมื่อวันที่ 7 เมษายน ก่อนที่สภาพอากาศจะกลับมาใกล้ปกติราวเดือนพฤษภาคม",
        },
        {
          q: "เครื่องปรับอากาศช่วยเรื่องหมอกควันได้หรือไม่",
          a: "เครื่องปรับอากาศในห้องทั่วไปไม่ใช่สิ่งทดแทนระบบกรองฝุ่นละเอียด สิ่งที่ช่วยได้คือห้องที่ปิดสนิท ร่วมกับเครื่องฟอกอากาศที่มีแผ่นกรอง HEPA และมีขนาดเหมาะกับห้อง หรือระบบปรับอากาศที่ติดตั้งแผ่นกรองประสิทธิภาพสูง ควรถามว่าที่พักมีอุปกรณ์ใดจริงก่อนจองในเดือนมีนาคม",
        },
        {
          q: "ฤดูฝนเป็นช่วงที่ไม่ควรไปเที่ยวเชียงใหม่หรือไม่",
          a: "ไม่แย่เท่าที่เล่าลือกัน ฝนมักตกหนักเป็นช่วง ๆ ในตอนบ่ายมากกว่าตกทั้งวัน แต่ฝนต่อเนื่องอาจกระทบแผนได้มากกว่านั้น สิงหาคมและกันยายนมักมีฝนมากที่สุด และชนบทเขียวที่สุด เป็นหนึ่งในช่วงที่เงียบและประหยัดที่สุดของปี",
        },
      ],
      limits:
        "ค่าคุณภาพอากาศข้างต้นเป็นค่าที่วัด ณ ขณะหนึ่งในวันที่ระบุ นำมาจาก IQAir และจากการรายงานข้อมูลของ IQAir ไม่ใช่ค่าเฉลี่ยรายเดือน และตัวเลขที่สื่อแต่ละแห่งเผยแพร่สำหรับสัปดาห์เดียวกันต่างกัน เพราะเป็นภาพถ่าย ณ คนละชั่วโมง ฤดูหมอกควันแตกต่างกันไปในแต่ละปีทั้งความรุนแรงและช่วงเวลา วันที่ของปีก่อนจึงเป็นแนวทาง ไม่ใช่การพยากรณ์ เราบริหารบ้านพักในเชียงใหม่ เราไม่ใช่หน่วยงานด้านคุณภาพอากาศ ผู้ที่ต้องตัดสินใจเรื่องสุขภาพควรตรวจค่าดัชนีในวันนั้น ทำตามคำแนะนำของหน่วยงานสาธารณสุข และปรึกษาแพทย์หากอยู่ในกลุ่มเสี่ยง",
      related: [
        { label: "ย่านต่าง ๆ ในเชียงใหม่", path: "/destinations" },
        { label: "บ้านที่เราดูแล", path: "/properties" },
        { label: "คู่มือท้องถิ่นสำหรับผู้เข้าพัก", path: "/lotushouse/local-guide" },
      ],
    },
    zh: {
      title: "什么时候来清迈，以及哪几周需要再三考虑",
      metaTitle: "清迈旅行时间指南：最佳月份与烟霾季（烧山季）",
      metaDesc:
        "清迈最佳旅行时间：凉季天气、烟霾季风险、雨季取舍，以及注明日期的空气质量实测数据。",
      standfirst:
        "大多数清迈指南把空气质量放在文章末尾附近。它应该出现在最前面：一年中大约有两个月，空气质量最可能影响旅行体验，而预订平台也没有动力主动提醒你。",
      answers: [
        {
          q: "最佳月份",
          a: "十一月至一月。天气干燥凉爽、天空清澈，是这座城市一年中最舒适的时段。这也是最繁忙的时候，因此住宿选择更少、价格更高。",
        },
        {
          q: "需要再三考虑的月份",
          a: "二月下旬至三月，常常延续到四月初。这是烟霾季，农业焚烧和森林火灾产生的烟霾会滞留在山谷上空。三月通常最为严重。",
        },
        {
          q: "实际有多严重",
          a: "2026 年三月，清迈多次在 IQAir 的全球主要城市实时污染排名中位列第一。IQAir 在 3 月 30 日录得空气质量指数 233，3 月 29 日录得 263，PM2.5 浓度为每立方米 188 微克。",
        },
        {
          q: "如果只能在三月前来",
          a: "三月仍可成行，但要围绕空气质量做好准备：每天查看 AQI，选择密闭良好且配有适合房间面积的空气净化器的住宿，并预留室内活动。若 AQI 达到“非常不健康”水平，请遵循公共卫生建议，并准备调整行程。",
        },
      ],
      sections: [
        {
          heading: "烟霾季到底是什么",
          body: [
            "每年大约二月至四月，泰国北部及周边国家的农田会以焚烧方式清理，同一时间干燥的山地也会发生森林火灾。清迈坐落在群山环抱的盆地中，本应在平地上扩散的烟霾因此积聚在城市上空，直到天气改变才会散去。",
            "IQAir 将问题主要归因于与农业活动相关的生物质燃烧和季节性森林火灾。NASA FIRMS 的数据表明，2026 年 1 月 1 日至 3 月 27 日，清迈府记录到超过 2,090 个火点。烟霾季不会在固定日期结束：4 月 7 日，清迈仍在 IQAir 的全球主要城市实时排名中位列第一。",
            "对访客而言，关键在于这是季节性的，而不是对清迈的整体描述。IQAir 将该市 2025 年细颗粒物年均值定为每立方米 18.2 微克，归类为中等。问题集中、严重，并在大约四月底结束。",
          ],
        },
        {
          heading: "实测数据及其日期",
          body: [
            "没有时间戳的空气质量说法价值很低，因此这里给出读数而不是形容词。2026 年 3 月 4 日，IQAir 将空气判定为“不健康”，指数高于 150，清迈在其全球主要城市实时排名中位列第三。3 月 26 日，空气达到“非常不健康”水平，清迈位列第一。3 月 29 日录得指数 263，PM2.5 浓度为每立方米 188 微克。3 月 30 日上午十点，指数为 233，清迈再次位列第一。 另一方面，IQAir 给出的清迈 2025 全年 PM2.5 平均值为每立方米 18.2 微克，指数 63，属于中等水平，是世界卫生组织年度指导值的 3.6 倍。整年并不等于三月。",
            "关于这些数字有两点提醒，而且都很重要。它们是某一时刻的瞬时读数，不是月度平均值，指数全天都在变化，通常清晨最差。而且不同媒体就同一周发布的数字并不完全一致，因为它们是不同时段的快照。应把它们当作大致的严重程度，而不是对整个月份的精确测量。",
          ],
        },
        {
          heading: "清迈一年的季节变化",
          body: ["清迈只有三个季节，而不是四个，按季节安排行程比按月份更有用。"],
          table: {
            title: "三个季节",
            head: ["大致时间", "季节特点", "出行提示"],
            rows: [
              [
                "十一月至一月",
                "凉爽干燥",
                "一年中天气最舒适、游客也最多的时段。请尽早预订；住宿价格会更高，热门景点也更拥挤。",
              ],
              [
                "二月至四月",
                "炎热，烟霾季",
                "三月和四月气温持续攀升。烟霾通常从二月下旬加重，三月达到高峰。四月的宋干节仍是许多人专程前来的理由，但出发前应查看空气质量。",
              ],
              [
                "五月至十月",
                "翠绿多雨",
                "雨水往往集中在午后，而不是持续一整天，但连续强降雨也可能更明显地影响行程。八月和九月通常最为潮湿，也往往是一年中较安静、较实惠的月份。",
              ],
            ],
            note: "季节分界每年可能前后移动几周。上述日期对应实际读数；季节划分只是一般规律，并非预报。",
          },
        },
        {
          heading: "如果你只能在二月、三月或四月前来",
          body: [
            "这趟旅行仍然可行，并非注定泡汤；很多人在这段时间也玩得很尽兴。能够顺利完成行程的人，通常会提前为空气质量做好准备，而不是心存侥幸。",
            "每天早上查看 AQI，而不只是天气预报，因为三月里看似晴朗的天空并不代表空气干净。把有空气过滤的室内活动作为行程的一部分；清迈有许多咖啡馆、烹饪学校、按摩场所、博物馆和室内市场。预订前应确认房间能否妥善密闭，以及净化器是否适合房间面积；普通房间空调不能替代细颗粒物过滤。如果想离开市区，请先查看目的地的 AQI，因为北部山区也可能受到同一片烟霾影响。部分海滨或南部目的地的空气可能更好，但仍应在出发当天核实。",
            "哮喘、肺部或心血管疾病患者，以及老年人、儿童和孕妇面临更高风险，应咨询医生并考虑更改日期。当 AQI 达到“非常不健康”水平时，所有人都应减少暴露，并遵循公共卫生建议。",
          ],
        },
        {
          heading: "淡季也有它的回报",
          body: [
            "许多旅行者会忽略雨季，而它的另一面是住宿和景点都没有那么拥挤。雨季大约从五月持续到十月，是清迈一年中预订较少的时段，在不少方面却也是最好的季节：山色翠绿、瀑布水量充足，寺庙也较为清静。雨水往往集中在午后，但连续强降雨也可能更明显地影响行程。通常九月最为潮湿。",
            "十一月至一月确实出色，而所有人都知道，这是反对它的唯一理由。如果你想看到这座城市最好的样子，又不介意与人分享，那就是那个窗口。如果你想把这座城市留给自己，并愿意用一场午后阵雨来交换，就在雨季来。",
          ],
        },
      ],
      faq: [
        {
          q: "什么时候去清迈最好？",
          a: "十一月至一月，天气凉爽干燥，空气也最清澈。这同样是最繁忙、最昂贵的时段。若想避开人潮并享受更低价格，代价是午后的雨，那么五月至十月的绿色季节是更划算的选择。",
        },
        {
          q: "清迈哪几个月空气质量最差？",
          a: "二月下旬、三月，有时还有四月初。通常三月最为严重。2026 年三月，清迈多次在 IQAir 的全球主要城市实时污染排名中位列第一；3 月 30 日录得指数 233，3 月 29 日录得 263。",
        },
        {
          q: "烟霾季期间还值得去清迈吗？",
          a: "做好空气质量方面的准备，行程仍可成行：每天查看 AQI，选择密闭良好且配有适合房间面积的空气净化器的住宿，并预留室内活动。哮喘、肺部或心血管疾病患者，以及老年人、儿童和孕妇面临更高风险，应咨询医生并考虑更改日期。",
        },
        {
          q: "清迈的烟霾季持续多久？",
          a: "大约从二月持续到四月，通常三月最为严重，而且不会在固定日期结束。2026 年 4 月 7 日，清迈仍在 IQAir 的全球主要城市实时排名中位列第一；到五月前后，空气质量才基本恢复正常。",
        },
        {
          q: "空调对烟霾有帮助吗？",
          a: "普通房间空调不能替代细颗粒物过滤。更有效的是密闭良好的房间，加上一台适合房间面积、配有 HEPA 滤网的空气净化器，或安装了合适高效滤网的中央空调系统。三月预订前，应确认住宿实际配备了什么。",
        },
        {
          q: "雨季是去清迈的糟糕时间吗？",
          a: "没有传闻中那么糟。雨水往往集中在午后，而不是持续一整天，但连续强降雨也可能更明显地影响行程。八月和九月通常最为潮湿，乡野也最为翠绿。这往往是一年中较安静、较实惠的时段。",
        },
      ],
      limits:
        "上文的空气质量读数是所给日期上的瞬时测量值，取自 IQAir 以及对 IQAir 数据的报道，并非月度平均值；不同媒体就同一周发布的数字存在差异，因为它们是不同时段的快照。烟霾季的严重程度和时间逐年不同，因此往年日期只能作为参考，不能当作预测。我们在清迈管理房屋，并非空气质量权威机构。任何涉及健康的决定，都应以当天指数和公共卫生建议为准；高风险人群还应咨询医生。",
      related: [
        { label: "清迈的各个街区", path: "/destinations" },
        { label: "我们管理的房屋", path: "/properties" },
        { label: "给房客的本地指南", path: "/lotushouse/local-guide" },
      ],
    },
  },
  sources: [
    {
      name: "Chiang Mai among top 10 most polluted cities in the world, 27 March 2026 (IQAir)",
      url: "https://www.iqair.com/th-en/newsroom/chiang-mai-among-top-10-most-polluted-cities-in-the-world-3-27-2026",
    },
    {
      name: "Chiang Mai among the top 10 most polluted cities during Thailand's burning season, 4 March 2026 (IQAir)",
      url: "https://www.iqair.com/newsroom/chiang-mai-ranks-among-the-top-10-most-polluted-cities-during-thailand-s-burning-season-3-4-2026",
    },
    {
      name: "Chiang Mai Air Quality Index and Thailand Air Pollution (IQAir)",
      url: "https://www.iqair.com/air-quality/thailand/chiang-mai/chiang-mai",
    },
    {
      name: "2026 Chiang Mai Smog (Wikipedia)",
      url: "https://en.wikipedia.org/wiki/2026_Chiang_Mai_Smog",
    },
    {
      name: "Chiang Mai tops global air pollution ranking as haze worsens (The Nation Thailand)",
      url: "https://www.nationthailand.com/news/general/40064449",
    },
    {
      name: "Chiang Mai haze worsens as hotspot count jumps to 136, reporting NASA FIRMS cumulative hotspots (The Nation Thailand)",
      url: "https://www.nationthailand.com/news/general/40064363",
    },
  ],
};

const OCCUPANCY_FORECAST: Article = {
  slug: "what-an-occupancy-forecast-cannot-tell-you",
  outlet: "host-newsletter",
  datePublished: "2026-11-09",
  checkedOn: "2026-11-09",
  publishedIn: HOST_LOCALES,
  body: {
    th: {
      title: "สิ่งที่การคาดการณ์อัตราการเข้าพักในเชียงใหม่บอกท่านไม่ได้",
      metaTitle: "อัตราการเข้าพัก Airbnb เชียงใหม่ ตัวเลขต่างกัน 31 จุด",
      metaDesc:
        "ผู้ให้บริการสี่รายเผยแพร่ตัวเลขอัตราการเข้าพักของเชียงใหม่รวมหกค่า ตั้งแต่ 36 ถึง 67 เปอร์เซ็นต์ บทความนี้อธิบายสาเหตุที่ต่างกัน และหลักฐานที่เจ้าของควรขอดู",
      standfirst:
        "เราตรวจสอบตัวเลขอัตราการเข้าพัก Airbnb ในเชียงใหม่ที่ผู้ให้บริการข้อมูลสี่รายเผยแพร่ ทั้งสี่รายให้ตัวเลขรวมหกค่า ต่ำสุด 36 เปอร์เซ็นต์ สูงสุด 67 เปอร์เซ็นต์ และสองค่าในจำนวนนั้นอยู่บนหน้าเว็บเดียวกันของผู้ให้บริการรายเดียว หากมีผู้แสดงตัวเลขอัตราการเข้าพักเพียงค่าเดียวอย่างมั่นใจให้ท่านดู นี่คือสิ่งที่อยู่เบื้องหลังตัวเลขนั้น",
      answers: [
        {
          q: "คำตอบสั้น ๆ",
          a: "ไม่มีอัตราการเข้าพักเฉลี่ยค่าเดียวที่เชื่อถือได้สำหรับเชียงใหม่ ตัวเลขที่เผยแพร่อยู่ระหว่าง 36 ถึง 67 เปอร์เซ็นต์ ห่างกัน 31 จุดเปอร์เซ็นต์ และทุกค่ากำลังอธิบายตลาดเดียวกัน",
        },
        {
          q: "เหตุใดจึงต่างกัน",
          a: "ส่วนใหญ่เป็นเรื่องขอบเขตพื้นที่และวิธีคำนวณ ระดับเมืองหรือระดับจังหวัด ค่าเฉลี่ยหรือค่ามัธยฐาน นับเดือนใดบ้าง และสัดส่วนของสตูดิโอ คอนโด และบ้านในกลุ่มตัวอย่าง ที่พักให้เช่าในเชียงใหม่ส่วนใหญ่เป็นคอนโดขนาดเล็ก ค่าเฉลี่ยทั้งเมืองจึงอธิบายคอนโดเป็นหลัก",
        },
        {
          q: "สิ่งนี้มีความหมายอย่างไรต่อท่าน",
          a: "ค่าเฉลี่ยทั้งเมืองแทบไม่มีประโยชน์ในการคาดการณ์ทรัพย์สินหลังเดียว ตัวเลขที่สำคัญคือผลประกอบการจริงของทรัพย์สินที่เทียบเคียงได้ ในย่านเดียวกันและจำนวนห้องนอนเท่ากัน",
        },
        {
          q: "เราจะอธิบายตัวเลขของเราเองอย่างไร",
          a: "อัตราการเข้าพักเป็นข้อมูลนำเข้าที่มีความไม่แน่นอนสูงที่สุดในแบบจำลองความเป็นไปได้ของเรา และมีอิทธิพลต่อผลลัพธ์มากที่สุด เราระบุข้อนี้ไว้ในทุกการศึกษา แทนที่จะนำเสนอผลตอบแทนราวกับเป็นค่าที่วัดได้",
        },
      ],
      sections: [
        {
          heading: "ผู้ให้บริการสี่ราย ห้าคำตอบ",
          body: [
            "ตัวเลขเหล่านี้คือค่าที่ผู้ให้บริการแต่ละรายเผยแพร่ ณ วันที่ 09/11/2026 พร้อมช่วงเวลาและพื้นที่ที่แต่ละรายครอบคลุมจริง เราไม่ได้ปรับหรือเฉลี่ยรวมกัน เพราะการเฉลี่ยตัวเลขที่วัดคนละสิ่งคือวิธีสร้างตัวเลขที่ทำให้เข้าใจผิด",
          ],
          table: {
            title: "ตัวเลขอัตราการเข้าพักของเชียงใหม่ที่เผยแพร่ ตรวจสอบเมื่อ 09/11/2026",
            head: ["ผู้ให้บริการ", "ตัวเลข", "พื้นที่และช่วงเวลา"],
            rows: [
              [
                "AirDNA",
                "67%",
                "ตลาดเชียงใหม่ ปรับปรุง 5 พฤศจิกายน 2026 ข้อมูลถึงตุลาคม 2026 ประกาศที่ยังเปิดอยู่ 7,286 รายการ ลดลง 42.3% จากปีก่อน",
              ],
              ["Airbtics", "64% (มัธยฐาน)", "ค่ามัธยฐานสำหรับสิบสองเดือน กันยายน 2025 ถึงสิงหาคม 2026"],
              [
                "BnBCalc",
                "52% และ 36%",
                "เชียงใหม่ ค่าเฉลี่ยสิบสองเดือน ณ ตุลาคม 2026 ประกาศราว 5,900 รายการ หน้าแดชบอร์ดระบุ 52% ขณะที่คำถามที่พบบ่อยในหน้าเดียวกันระบุ 36%",
              ],
              ["AirROI เชียงใหม่", "44.2%", "เชียงใหม่ สิบสองเดือนถึงตุลาคม 2026"],
              [
                "AirROI เขตเทศบาลนคร",
                "44.2%",
                "เขตเทศบาลนครเชียงใหม่ สิบสองเดือนถึงตุลาคม 2026 เท่ากับตัวเลขที่ AirROI ให้สำหรับตัวเมือง",
              ],
            ],
            note: "ตัวเลขตามที่ผู้ให้บริการแต่ละรายเผยแพร่เมื่อ 09/11/2026 โดยเราไม่ได้ปรับแก้ ทั้งหมดเป็นค่าประมาณจากแบบจำลองที่สร้างจากข้อมูลประกาศที่เก็บรวบรวมมา ไม่ใช่ผลประกอบการที่ผ่านการตรวจสอบ และแต่ละรายวัดพื้นที่และช่วงเวลาต่างกัน ซึ่งเป็นประเด็นของตารางนี้ ไม่ใช่ข้อบกพร่อง",
          },
        },
        {
          heading: "เหตุใดตลาดเดียวกันจึงให้ตัวเลขห่างกัน 31 จุดเปอร์เซ็นต์",
          body: [
            "มีเหตุผลสี่ประการ และไม่มีข้อใดเลยที่บอกว่าผู้ให้บริการรายใดผิด",
            "ขอบเขตพื้นที่ เมืองเชียงใหม่ เขตเทศบาลนครเชียงใหม่ และจังหวัดเชียงใหม่ เป็นสามพื้นที่ที่มีส่วนผสมของที่พักต่างกัน ระดับจังหวัดรวมอำเภอรอบนอกที่อัตราการเข้าพักไม่เหมือนย่านนิมมานเลย",
            "วิธีคำนวณ ค่าเฉลี่ยกับค่ามัธยฐานตอบคำถามคนละข้อ ในตลาดที่มีประกาศซึ่งแทบไม่มีการจองอยู่เป็นจำนวนมาก ค่าเฉลี่ยอาจถูกดึงให้ต่ำลง ส่วนค่ามัธยฐานอาจได้รับผลกระทบน้อยกว่า ทั้งนี้ขึ้นอยู่กับวิธีคัดกลุ่มตัวอย่าง ผู้ให้บริการหลายรายเผยแพร่ตัวเลขโดยไม่ระบุว่าเป็นค่าเฉลี่ยหรือค่ามัธยฐาน",
            "ช่วงเวลา ตัวเลขเหล่านี้ใช้ช่วงสิบสองเดือนที่สิ้นสุดในเดือนสิงหาคม กันยายน หรือตุลาคม 2026 แต่ละช่วงจึงมีสัปดาห์ของฤดูหมอกควันและสัปดาห์ของฤดูท่องเที่ยวในสัดส่วนต่างกัน",
            "กลุ่มตัวอย่าง คอนโด อพาร์ตเมนต์ และที่พักขนาดเล็กมีสัดส่วนสูงในตลาดเช่าระยะสั้นของเชียงใหม่ ค่าเฉลี่ยทั้งเมืองจึงไม่ใช่กลุ่มเทียบเคียงที่เหมาะสำหรับบ้านสามห้องนอน หน้าเว็บของผู้ให้บริการรายหนึ่งระบุอัตราการเข้าพักสองค่าสำหรับตลาดเดียวกัน คือ 52 เปอร์เซ็นต์ บนแดชบอร์ด และ 36 เปอร์เซ็นต์ ในคำถามที่พบบ่อยของหน้าเดียวกัน ซึ่งเป็นเครื่องเตือนใจว่าตัวเลขเหล่านี้เป็นค่าประมาณจากแบบจำลอง ไม่ใช่ค่าที่อ่านจากมิเตอร์",
          ],
        },
        {
          heading: "สัปดาห์ที่ค่าเฉลี่ยทั้งเมืองไม่เคยแสดงให้ท่านเห็น",
          body: [
            "ความต้องการที่พักในเชียงใหม่ไม่ได้ราบเรียบตลอดปี และช่วงอ่อนแรงก็ไม่ตรงกับปฏิทินท่องเที่ยวเสมอไป ฤดูหมอกควันกินเวลาราวกุมภาพันธ์ถึงเมษายน โดยทั่วไปหนักที่สุดช่วงปลายกุมภาพันธ์และมีนาคม ในเดือนมีนาคม 2026 เชียงใหม่ขึ้นอันดับหนึ่งในการจัดอันดับเมืองใหญ่ด้านมลพิษทางอากาศแบบเรียลไทม์ของ IQAir หลายครั้ง ความต้องการจากผู้เข้าพักลดลงในสัปดาห์เหล่านั้น และป้ายฤดูสูงหรือฤดูต่ำแบบเดิมอธิบายการเปลี่ยนแปลงนี้ได้ไม่หมด",
            "เรื่องนี้สำคัญต่อการคาดการณ์ เพราะแบบจำลองตามฤดูกาลหลายแบบ รวมถึงของเราเอง จัดกุมภาพันธ์ถึงเมษายนไว้ในช่วงรอยต่อฤดูท่องเที่ยว และใช้ตัวคูณอัตราค่าเช่าเดียวกันตลอดช่วงนั้น เราเผยแพร่ข้อนี้ในฐานะจุดอ่อนที่ทราบอยู่ของแบบจำลองความเป็นไปได้ของเรา แทนที่จะปล่อยให้ท่านไปค้นพบเอง ช่วงดังกล่าวจึงมีทั้งสัปดาห์ที่อ่อนแรงที่สุดของปีและสัปดาห์ปกติรวมอยู่ในอัตราสมมติเดียวกัน ผลในทางปฏิบัติคือมันทำให้ทรัพย์สินที่ไม่มีเครื่องกรองอากาศดูดีเกินจริง และประเมินค่าทรัพย์สินที่มีเครื่องกรองอากาศต่ำเกินไป",
            "หากทรัพย์สินของท่านปิดห้องได้สนิทและมีระบบกรองอากาศที่ดี นั่นคือข้อได้เปรียบทางการค้าที่แท้จริงตลอดหนึ่งในสี่ของปี และไม่มีตัวเลขอัตราการเข้าพักเฉลี่ยทั้งเมืองใดจะแสดงให้ท่านเห็น",
          ],
        },
        {
          heading: "ควรขออะไรแทนค่าเฉลี่ย",
          body: [
            "คำถามสี่ข้อที่เปลี่ยนการคาดการณ์จากตัวเลขให้เป็นข้อโต้แย้งที่ตรวจสอบได้",
            "ขอกลุ่มทรัพย์สินเทียบเคียงแทนตัวเลขระดับเมือง คือทรัพย์สินจริง ระบุชื่อหรืออย่างน้อยอธิบายลักษณะ ที่มีจำนวนห้องนอนเท่ากันและอยู่ในย่านเดียวกับท่าน พร้อมผลประกอบการและช่วงเวลาที่วัด เราสร้างอัตราค่าเช่าฐานจากกลุ่มเทียบเคียงที่คัดด้วยมือด้วยเหตุผลนี้ ไม่เคยใช้ค่าเฉลี่ยทั้งเมือง เพราะค่าเฉลี่ยทั้งเมืองคือคอนโดสตูดิโอเป็นส่วนใหญ่",
            "ถามว่าเป็นค่าเฉลี่ยหรือค่ามัธยฐาน และครอบคลุมเดือนใดบ้าง หากไม่มีใครตอบได้ ตัวเลขนั้นเป็นเพียงเครื่องประดับ",
            "ถามว่าการคาดการณ์ตั้งสมมติฐานอย่างไรกับปีแรก ประกาศใหม่ไม่ได้เริ่มต้นที่อัตราการเข้าพักของที่พักที่ดำเนินการมานาน และแบบจำลองที่ใช้ตัวเลขระยะยาวตั้งแต่เดือนแรกจะประเมินปีแรกสูงเกินไปอย่างมาก",
            "ถามผู้ที่นำการคาดการณ์มาเสนอว่าเขาคิดว่าข้อมูลนำเข้าใดมีความไม่แน่นอนสูงที่สุดในแบบจำลอง ผู้ที่สร้างแบบจำลองอย่างตรงไปตรงมาจะมีคำตอบ หากคำตอบคือไม่มีเลย นั่นคือสิ่งที่มีประโยชน์ที่สุดที่ท่านจะได้จากการประชุมครั้งนั้น",
          ],
        },
        {
          heading: "เหตุใดเราจึงเผยแพร่สิ่งนี้แทนตัวเลขที่ดูมั่นใจ",
          body: [
            "เราขายการศึกษาความเป็นไปได้ ในเชิงการค้าแล้ว การเสนออัตราการเข้าพักค่าเดียวและปล่อยให้มันนำไปสู่ตัวเลขผลตอบแทนและการตัดสินใจนั้นง่ายกว่ามาก เราไม่ทำเช่นนั้น เพราะการตัดสินใจของเจ้าของทรัพย์สินเรื่องการปล่อยเช่าระยะสั้นมักย้อนกลับไม่ได้เป็นเวลาหนึ่งปีหรือมากกว่า และผลตอบแทนที่สร้างบนความไม่แน่นอน 31 จุดเปอร์เซ็นต์แต่นำเสนอราวกับเป็นค่าที่วัดได้ ไม่ใช่การคาดการณ์ แต่เป็นเครื่องมือขาย",
            "สิ่งที่เราจะบอกเกี่ยวกับแบบจำลองของเราเอง ทั้งในการศึกษาและที่นี่ อัตราการเข้าพักเป็นข้อมูลนำเข้าที่มีความไม่แน่นอนสูงที่สุดและมีอิทธิพลต่อผลลัพธ์มากที่สุด ยังไม่แปรผันตามย่าน แปรผันตามจำนวนห้องนอนและกลุ่มผู้เข้าพักเท่านั้น และฤดูหมอกควันไม่ได้ถูกคิดราคาแยกจากช่วงรอยต่อฤดูท่องเที่ยว นี่คือสามจุดที่ตัวเลขของเรามีโอกาสผิดพลาดมากที่สุด และท่านมีสิทธิ์ทราบก่อนที่จะใช้ผลลัพธ์นั้น",
          ],
        },
      ],
      faq: [
        {
          q: "อัตราการเข้าพัก Airbnb เฉลี่ยในเชียงใหม่คือเท่าไร",
          a: "ไม่มีตัวเลขเดียวที่เชื่อถือได้ ตรวจสอบเมื่อ 09/11/2026 ตัวเลขที่ผู้ให้บริการสี่รายเผยแพร่อยู่ระหว่าง 36 ถึง 67 เปอร์เซ็นต์ ห่างกัน 31 จุดเปอร์เซ็นต์ เพราะครอบคลุมพื้นที่ ช่วงเวลา และส่วนผสมของที่พักต่างกัน อีกทั้งบางรายเผยแพร่ค่าเฉลี่ย ขณะที่บางรายเผยแพร่ค่ามัธยฐาน",
        },
        {
          q: "เหตุใดตัวเลขอัตราการเข้าพักของเชียงใหม่จึงต่างกันมากระหว่างผู้ให้บริการ",
          a: "สี่เหตุผล พื้นที่ที่วัดเป็นระดับเมือง เขตเทศบาล หรือจังหวัด ตัวเลขเป็นค่าเฉลี่ยหรือค่ามัธยฐาน นับสิบสองเดือนช่วงใด เพราะแต่ละช่วงมีสัปดาห์ฤดูหมอกควันไม่เท่ากัน และส่วนผสมของที่พัก ซึ่งคอนโด อพาร์ตเมนต์ และที่พักขนาดเล็กมีสัดส่วนสูงในเชียงใหม่",
        },
        {
          q: "ฤดูหมอกควันกระทบการจองที่พักระยะสั้นในเชียงใหม่หรือไม่",
          a: "กระทบ ความต้องการจากผู้เข้าพักลดลงในช่วงปลายกุมภาพันธ์และมีนาคม ซึ่งเป็นช่วงที่หมอกควันจากการเผาในภาคเกษตรและไฟป่าปกคลุมเมือง แบบจำลองราคาตามฤดูกาลหลายแบบ รวมถึงของเรา รวมสัปดาห์เหล่านั้นไว้ในช่วงรอยต่อฤดูท่องเที่ยว จึงไม่แสดงผลกระทบนี้แยกออกมา",
        },
        {
          q: "ใช้ค่าเฉลี่ยอัตราการเข้าพักทั้งเมืองคาดการณ์ทรัพย์สินของท่านได้หรือไม่",
          a: "ใช้ได้ไม่ดีนัก ค่าเฉลี่ยทั้งเมืองของเชียงใหม่อธิบายคอนโดสตูดิโอขนาดเล็กเป็นหลัก เพราะที่พักส่วนใหญ่เป็นแบบนั้น การคาดการณ์สำหรับบ้านหรือทรัพย์สินหลายห้องนอนต้องใช้กลุ่มเทียบเคียงที่มีจำนวนห้องนอนเท่ากันในย่านเดียวกัน",
        },
        {
          q: "ควรถามผู้จัดการทรัพย์สินอะไรเกี่ยวกับการคาดการณ์อัตราการเข้าพัก",
          a: "ถามว่าเป็นค่าเฉลี่ยหรือค่ามัธยฐานและครอบคลุมเดือนใด มาจากกลุ่มเทียบเคียงหรือค่าเฉลี่ยทั้งเมือง ตั้งสมมติฐานอย่างไรกับปีแรกซึ่งมักอ่อนกว่าภาวะปกติ และเขาคิดว่าข้อมูลนำเข้าใดมีความไม่แน่นอนสูงที่สุดในแบบจำลองของตนเอง",
        },
      ],
      limits:
        "ตัวเลขของผู้ให้บริการทุกรายข้างต้นเป็นค่าประมาณจากแบบจำลองที่สร้างจากข้อมูลประกาศที่เก็บรวบรวมมา เผยแพร่โดยผู้ขายข้อมูลเชิงพาณิชย์ และอ่านเมื่อ 09/11/2026 ไม่มีรายใดเป็นผลประกอบการที่ผ่านการตรวจสอบ และเราไม่ได้ตรวจสอบความถูกต้องของรายใดด้วยตนเอง ความไม่ตรงกันระหว่างตัวเลขเหล่านี้คือข้อค้นพบ ไม่ใช่ตัวเลขใดตัวเลขหนึ่ง ตัวเลขสองค่าที่อยู่ในงานวิจัยภายในของเรา จงใจไม่นำมาแสดงในหน้านี้ เพราะเราไม่สามารถยืนยันกับแหล่งข้อมูลต้นทางได้ คือจำนวนผู้ถือวีซ่า DTV และประมาณการจำนวนผู้ทำงานทางไกลในเชียงใหม่ ไม่มีสิ่งใดในหน้านี้เป็นการคาดการณ์สำหรับทรัพย์สินใดโดยเฉพาะ และไม่มีสิ่งใดเป็นคำแนะนำการลงทุน",
      related: [
        { label: "บริการจัดการทำงานอย่างไร", path: "/how-it-works" },
        { label: "ท่านต้องมีใบอนุญาตให้เช่าระยะสั้นหรือไม่", path: "/short-term-rental-licence-chiang-mai" },
        { label: "ขอการศึกษาความเป็นไปได้สำหรับทรัพย์สินของท่าน", path: "/contact" },
      ],
    },
    en: {
      title: "What a Chiang Mai occupancy forecast cannot tell you",
      metaTitle: "Chiang Mai Airbnb occupancy: a 31-point gap between providers",
      metaDesc:
        "Four providers publish six conflicting occupancy figures for Chiang Mai, from 36 to 67 percent. Why they differ and what to ask for instead.",
      standfirst:
        "We checked what four data providers publish for Airbnb occupancy in Chiang Mai. Between them they publish six figures, from 36 to 67 percent, and two of those sit on one provider's own page. If someone has shown you a single confident occupancy figure for this city, this is what sits behind it.",
      answers: [
        {
          q: "The short answer",
          a: "There is no reliable single average occupancy rate for Chiang Mai. The published figures currently run from 36 to 67 percent, a spread of 31 percentage points, and all of them describe the same market.",
        },
        {
          q: "Why they differ",
          a: "Mostly boundaries and arithmetic: city against province, mean against median, which months are counted, and what mix of studios, condos and houses is in the sample. Chiang Mai's listing stock is dominated by small condo units, so a city average mostly describes them.",
        },
        {
          q: "What it means for you",
          a: "A city average is close to useless for forecasting one property. The number that matters is what comparable properties, in your area and at your bedroom count, actually achieved.",
        },
        {
          q: "What we will tell you about our own figures",
          a: "Occupancy is the weakest input in our feasibility model and it dominates the result. We say so in every study rather than presenting a yield as if it were a measurement.",
        },
      ],
      sections: [
        {
          heading: "Four providers, five answers",
          body: [
            "These are the figures each provider published as of 9 November 2026, with the period and the area each one actually covers. We have not adjusted or averaged them, because averaging numbers that measure different things is how a misleading figure gets made.",
          ],
          table: {
            title: "Published occupancy figures for Chiang Mai, checked 9 November 2026",
            head: ["Provider", "Figure", "Area and period"],
            rows: [
              [
                "AirDNA",
                "67%",
                "Chiang Mai market, updated 5 November 2026 with data through October 2026. 7,286 active listings, down 42.3% year on year",
              ],
              ["Airbtics", "64% median", "Median for the twelve months from September 2025 to August 2026"],
              [
                "BnBCalc",
                "52% and 36%",
                "Chiang Mai, twelve-month average as of October 2026, about 5,900 listings. The dashboard gives 52% and the FAQ on the same page gives 36%",
              ],
              ["AirROI, Chiang Mai", "44.2%", "Chiang Mai, twelve months to October 2026"],
              [
                "AirROI, city municipality",
                "44.2%",
                "Chiang Mai City Municipality, twelve months to October 2026, the same figure AirROI gives for the city",
              ],
            ],
            note: "Figures as published by each provider on 9 November 2026 and not adjusted by us. They are modelled estimates from scraped listing data, not audited results, and they measure different areas over different periods, which is the point of the table rather than a flaw in it.",
          },
        },
        {
          heading: "Why the same market produces a 31-point spread",
          body: [
            "Four reasons, and none of them is that one provider is simply wrong.",
            "The boundary. Chiang Mai city, Chiang Mai city municipality and Chiang Mai province are three different areas with different listing mixes. The province includes rural districts where occupancy behaves nothing like Nimman.",
            "The arithmetic. A mean and a median answer different questions. In a market with a long tail of barely active listings, the mean may be pulled down while the median may be less affected, depending on how the sample is filtered. Several providers publish a figure without saying which measure it is.",
            "The window. These figures use twelve-month periods ending in August, September or October 2026, so each contains a different mix of burning-season and high-season weeks.",
            "The sample. Condos, apartments and smaller units are heavily represented in Chiang Mai's short-let stock, so a city-wide average is the wrong comparison set for a three-bedroom house. One provider's own page carries two different occupancy figures for the same market, 52 percent on its dashboard and 36 percent in its own FAQ, which is a useful reminder that these are modelled estimates and not meter readings.",
          ],
        },
        {
          heading: "The weeks that no city average shows you",
          body: [
            "Demand in Chiang Mai is not flat through the year, and its softest stretch does not fit neatly into the conventional tourism calendar. Burning season runs from roughly February to April and is usually worst in late February and March. In March 2026 the city repeatedly ranked first in IQAir's live ranking of major cities by air pollution. Guest demand falls in those weeks, a change that conventional high- and low-season labels do not fully explain.",
            "This matters for a forecast because many seasonal models, including our own, put February to April inside an ordinary shoulder band and apply one rate multiplier across it. We publish that as a known weakness of our feasibility model rather than leaving an owner to find it: the shoulder band therefore contains both the softest weeks of the year and perfectly ordinary ones at the same assumed rate. The practical effect is that it flatters a property with no air filtration and understates the value of one that has it.",
            "If you own a property with sealed rooms and good filtration, that is a genuine commercial advantage for one quarter of the year, and no city-average occupancy figure will ever show it to you.",
          ],
        },
        {
          heading: "What to ask for instead of an average",
          body: [
            "Four questions that move a forecast from a number to an argument.",
            "Ask for a comparable set rather than a city figure: the actual properties, named or at least described, at your bedroom count and in your area, with what they achieved and over what period. We build our base rate from a hand-built comparable set for exactly this reason and never from the city average, because the city average is mostly condo studios.",
            "Ask whether it is a mean or a median, and over which months. If nobody can answer that, the figure is decoration.",
            "Ask what the forecast assumes about the first year. A new listing does not start at a mature occupancy rate, and a model that applies a steady-state figure from month one will overstate year one substantially.",
            "Ask what the person showing you the forecast thinks its weakest input is. Anyone who has built one honestly will have an answer. If the answer is that there isn't one, that is the most useful thing you will learn in the meeting.",
          ],
        },
        {
          heading: "Why we publish this rather than a confident number",
          body: [
            "We sell a feasibility study. It would be commercially easier to quote one occupancy rate and let it carry a yield figure to a decision. We do not, because the decision an owner makes on a short-let is usually irreversible for a year or more. A yield built on a 31-point uncertainty and presented as a measurement is not a forecast; it is a sales aid.",
            "What we will say about our own model, in the study and here: occupancy is its weakest input and it dominates the output; it does not yet vary by area, only by bedroom count and persona; and the burning season is not priced separately from the ordinary shoulder. Those are the three places our own numbers are most likely to be wrong, and an owner is entitled to know them before relying on the result.",
          ],
        },
      ],
      faq: [
        {
          q: "What is the average Airbnb occupancy rate in Chiang Mai?",
          a: "There is no single dependable figure. Checked on 9 November 2026, the occupancy figures published across four providers ranged from 36 to 67 percent, a spread of 31 percentage points. They cover different areas, periods and listing mixes, and some are means while others are medians.",
        },
        {
          q: "Why do Chiang Mai occupancy figures differ so much between providers?",
          a: "Four reasons: whether the area measured is the city, the municipality or the province; whether the figure is a mean or a median; which twelve months are counted, since each window holds a different number of burning-season weeks; and the listing mix, in which condos, apartments and smaller units are heavily represented.",
        },
        {
          q: "Does burning season affect short-term rental bookings in Chiang Mai?",
          a: "Yes. Guest demand thins through late February and March, when smoke from agricultural and forest burning settles over the city. Many seasonal pricing models, including ours, fold those weeks into an ordinary shoulder band and so do not show the effect separately.",
        },
        {
          q: "Can I use a city average occupancy rate to forecast my property?",
          a: "Not usefully. A Chiang Mai city average mostly describes small condo studios, because that is what most of the listing stock is. A forecast for a house or a multi-bedroom property needs a comparable set at the same bedroom count in the same area.",
        },
        {
          q: "What should I ask a property manager about their occupancy forecast?",
          a: "Whether the figure is a mean or a median and over which months; whether it comes from a comparable set or a city average; what it assumes about the first year, which is typically weaker than steady state; and what they consider the most uncertain input in their own model.",
        },
      ],
      limits:
        "Every provider figure above is a modelled estimate built from scraped listing data, published by a commercial data vendor, and read on 9 November 2026. None is an audited result and we have not independently validated any of them; the disagreement between them is the finding here, not any one number. Two figures carried in our own internal research are deliberately not repeated on this page because we could not verify them against a primary source: a count of DTV visa holders and an estimate of Chiang Mai's remote-worker population. Nothing here is a forecast for any particular property, and nothing here is investment advice.",
      related: [
        { label: "How management works", path: "/how-it-works" },
        { label: "Do you need a short-term rental licence?", path: "/short-term-rental-licence-chiang-mai" },
        { label: "Request a property-specific feasibility study", path: "/contact" },
      ],
    },
    zh: {
      title: "清迈入住率预测无法告诉您的事",
      metaTitle: "清迈 Airbnb 入住率：各家数据相差 31 个百分点",
      metaDesc:
        "四家数据提供商发布的清迈入住率共有六个数字，从 36% 到 67%。了解差异原因，以及业主应要求查看哪些依据。",
      standfirst:
        "我们核对了四家数据提供商发布的清迈 Airbnb 入住率。它们共给出六个数字，最低 36%，最高 67%，其中两个出现在同一家提供商的同一个页面上。如果有人向您出示过一个看似确定的清迈入住率，这就是该数字背后的实际情况。",
      answers: [
        {
          q: "简短答案",
          a: "清迈没有一个可靠的单一平均入住率。目前发布的数字从 36% 到 67% 不等，相差 31 个百分点，而它们描述的是同一个市场。",
        },
        {
          q: "为何不一致",
          a: "主要差异来自统计范围和计算方法：清迈市区还是清迈府、平均数还是中位数、统计哪些月份，以及样本中开间公寓、公寓房源和独栋住宅的比例。清迈房源中小户型公寓占比较高，因此全市平均值更接近这类房源。",
        },
        {
          q: "这对您意味着什么",
          a: "全市平均值对预测单一物业几乎没有用处。真正重要的是同一区域、同样卧室数量的可比物业实际取得的经营表现。",
        },
        {
          q: "我们如何说明自己的数据",
          a: "入住率是我们可行性模型中最不确定的输入项，却对结果影响最大。我们在每一份研究中都会明确说明这一点，而不是把收益率当作实测值来呈现。",
        },
      ],
      sections: [
        {
          heading: "四家提供商，五个答案",
          body: [
            "以下是各提供商截至 2026 年 11 月 9 日发布的数字，以及每一家实际覆盖的区域与时间段。我们没有对它们进行调整或求平均，因为把测量对象不同的数字平均起来，正是制造误导性数字的方式。",
          ],
          table: {
            title: "已发布的清迈入住率数据（核对日期：2026 年 11 月 9 日）",
            head: ["提供商", "数字", "区域与时间段"],
            rows: [
              [
                "AirDNA",
                "67%",
                "清迈市场，2026 年 11 月 5 日更新，数据截至 2026 年 10 月；7,286 个活跃房源，同比下降 42.3%",
              ],
              ["Airbtics", "64%（中位数）", "2025 年 9 月至 2026 年 8 月这十二个月的中位数"],
              [
                "BnBCalc",
                "52% 与 36%",
                "清迈，截至 2026 年 10 月的十二个月平均值，约 5,900 个房源。仪表板显示 52%，同一页面的常见问题却显示 36%",
              ],
              ["AirROI 清迈", "44.2%", "清迈，截至 2026 年 10 月的十二个月"],
              [
                "AirROI 市辖区",
                "44.2%",
                "清迈市辖区，截至 2026 年 10 月的十二个月，与 AirROI 给出的市区数字相同",
              ],
            ],
            note: "数字为各提供商于 2026 年 11 月 9 日发布的原貌，我们未作调整。它们都是基于抓取房源数据的模型估算，而非经过审计的经营结果，并且测量的区域与时间段各不相同，这正是本表的要点，而不是它的缺陷。",
          },
        },
        {
          heading: "同一个市场为何会产生 31 个百分点的差距",
          body: [
            "有四个原因，而且没有一个是某家提供商出了错。",
            "地理边界。清迈市、清迈市辖区与清迈府是三个不同的区域，房源构成各异。府级范围包含了周边郊县，那里的入住率与宁曼区完全不同。",
            "计算方法。平均数和中位数回答的是不同问题。在存在大量几乎没有预订的房源时，平均数可能被拉低，中位数受到的影响可能较小，但这取决于样本的筛选方式。有些提供商公布数字时并不说明采用的是平均数还是中位数。",
            "时间窗口。这些数字采用的十二个月统计期分别截至 2026 年 8 月、9 月或 10 月，因此每个时间窗口包含的烟霾季和旺季周数并不相同。",
            "样本构成。公寓和小户型房源在清迈短租市场中占比较高，因此全市平均值并不适合作为三卧室住宅的可比依据。有一家提供商在同一页面上为同一市场列出两个入住率数字：仪表板上是 52%，而同一页面的常见问题里是 36%。这提醒我们，这些数字是模型估算，而不是直接测量结果。",
          ],
        },
        {
          heading: "没有任何城市平均值会让您看到的那几周",
          body: [
            "清迈的住宿需求并非全年平稳，低谷也不完全符合传统旅游淡旺季划分。烟霾季大约从二月持续到四月，通常二月下旬和三月最为严重；2026 年三月，清迈多次在 IQAir 的全球主要城市实时污染排名中位列第一。那几周的预订需求会下降，而传统淡旺季标签并不能完全解释这种变化。",
            "这一点对预测很重要，因为许多季节性模型，包括我们自己的，都把二月至四月归入普通的旅游过渡期，并在整个区间套用同一个价格系数。我们公开说明这是自家可行性模型的已知弱点：这个区间既包含一年中需求最弱的几周，也包含表现正常的周次，却使用同一个假定价格。实际效果是高估没有空气过滤设备的物业，同时低估配有过滤设备的物业。",
            "如果您的物业房间能够密闭且配有良好的过滤设备，那在一年四分之一的时间里都是实实在在的商业优势，而任何城市平均入住率数字都永远不会让您看到它。",
          ],
        },
        {
          heading: "该索取什么来替代平均值",
          body: [
            "四个问题，能让预测从单一数字变成可以检验的判断依据。",
            "索取可比房源组，而不是全市数字：列出实际房源的名称，或至少说明其特征；房源应位于同一区域、卧室数量相同，并附上经营表现和统计期间。我们因此以人工筛选的可比房源组来确定基准租金，而不采用全市平均值。",
            "询问这是平均数还是中位数，以及涵盖哪些月份。如果没有人答得上来，这个数字就只是包装。",
            "询问该预测对第一年作了什么假设。新房源不会从成熟期的入住率起步，而一个从第一个月就套用稳定期数字的模型，会大幅高估第一年。",
            "询问展示预测的人：模型中哪个输入项最不确定。认真构建过模型的人都会有答案。如果对方声称没有任何不确定项，这或许就是您在那场会面中获得的最有用信息。",
          ],
        },
        {
          heading: "我们为何发布这个，而不是一个信心十足的数字",
          body: [
            "我们销售可行性研究。从商业角度看，报出一个入住率，再以此计算收益率并推动决策，要容易得多。我们不这样做，因为业主作出的短租决定通常在一年或更长时间内难以逆转。建立在 31 个百分点的不确定性之上、却被当作实测值呈现的收益率，不是预测，而是销售工具。",
            "关于我们自己的模型，无论在研究报告中还是在这里，我们都会说明：入住率是最不确定、同时对结果影响最大的输入项；目前尚未按区域区分，只按卧室数量和客群类型变化；烟霾季也没有与普通旅游过渡期分开计价。这是我们的数字最可能出错的三个地方，业主在依据结果作决定之前有权知道。",
          ],
        },
      ],
      faq: [
        {
          q: "清迈的 Airbnb 平均入住率是多少？",
          a: "没有单一可靠的数字。截至 2026 年 11 月 9 日，四家提供商公布的入住率从 36% 到 67% 不等，相差 31 个百分点。它们覆盖的区域、时间段和房源构成各不相同，而且有些是平均数，有些是中位数。",
        },
        {
          q: "为什么各提供商给出的清迈入住率数字差异这么大？",
          a: "四个原因：测量范围是清迈市区、市政府辖区还是清迈府；数字是平均数还是中位数；统计的是哪十二个月，因为每个时间窗口包含的烟霾季周数不同；以及样本中的房源构成。",
        },
        {
          q: "烟霾季会影响清迈的短租预订吗？",
          a: "会。二月下旬至三月，农业焚烧和森林火灾产生的烟霾笼罩全城，预订需求随之下降。许多季节性定价模型，包括我们的，都把那几周并入普通旅游过渡期，因此不会单独呈现这一影响。",
        },
        {
          q: "我可以用城市平均入住率来预测自己的物业吗？",
          a: "用处不大。公寓和小户型在清迈短租房源中占比较高。针对独栋住宅或多卧室物业的预测，需要使用同一区域、卧室数量相同的可比房源组。",
        },
        {
          q: "关于入住率预测，我应该问物业管理方什么？",
          a: "询问数字是平均数还是中位数、涵盖哪些月份；它来自可比房源组还是全市平均值；它对第一年作了什么假设，因为第一年通常弱于稳定期；以及对方认为模型中哪个输入项最不确定。",
        },
      ],
      limits:
        "上述每一个提供商数字都是基于抓取房源数据建立的模型估算，由商业数据供应商发布，读取于 2026 年 11 月 9 日。它们都不是经过审计的经营结果，我们也没有独立验证其中任何一个；这里的发现是它们之间的不一致，而不是其中任何单一数字。我们内部研究中载有的两个数字刻意没有在本页重复，因为我们无法对照原始来源加以核实：DTV 签证持有人数量，以及清迈远程工作者人数的估算。本页任何内容都不是针对任何特定物业的预测，也都不构成投资建议。",
      related: [
        { label: "管理服务如何运作", path: "/how-it-works" },
        { label: "您是否需要短租许可证", path: "/short-term-rental-licence-chiang-mai" },
        { label: "获取针对您物业的可行性分析", path: "/contact" },
      ],
    },
  },
  sources: [
    {
      name: "Chiang Mai Airbnb and Short-Term Rental Data (AirDNA)",
      url: "https://www.airdna.co/vacation-rental-data/app/th/default/chiang-mai/overview",
    },
    {
      name: "Annual Airbnb Revenue in Chiang Mai, Thailand (Airbtics)",
      url: "https://airbtics.com/annual-airbnb-revenue-in-chiang-mai-thailand/",
    },
    {
      name: "Chiang Mai, Chiang Mai Province Airbnb Data 2026 (AirROI)",
      url: "https://www.airroi.com/airbnb-data/thailand/chiang-mai-province/chiang-mai",
    },
    {
      name: "Chiang Mai City Municipality Airbnb Data 2026 (AirROI)",
      url: "https://www.airroi.com/airbnb-data/thailand/chiang-mai-province/chiang-mai-city-municipality",
    },
    {
      name: "Chiang Mai Airbnb Market Data Dashboard (BnBCalc)",
      url: "https://www.bnbcalc.com/markets/th/chiang-mai",
    },
    {
      name: "Chiang Mai among top 10 most polluted cities in the world, 27 March 2026 (IQAir)",
      url: "https://www.iqair.com/th-en/newsroom/chiang-mai-among-top-10-most-polluted-cities-in-the-world-3-27-2026",
    },
  ],
};

/** Every article, newest first. The outlet index filters this. */
export const ARTICLES: Article[] = [WHEN_TO_VISIT, OCCUPANCY_FORECAST];

export function articlesForOutlet(outlet: OutletSlug): Article[] {
  return ARTICLES.filter((article) => article.outlet === outlet);
}

export function articleBySlug(outlet: OutletSlug, slug: string): Article | undefined {
  return ARTICLES.find((article) => article.outlet === outlet && article.slug === slug);
}

/** The bare English route for an article, which is what ROUTES, pageMeta and sitemap all take. */
export function articlePath(article: Article): string {
  return `/${article.outlet}/${article.slug}`;
}

/**
 * The body served to a visitor who asked for `locale`.
 *
 * Non-null assertion rather than a fallback branch: `publishedIn` and the keys of `body` are
 * written together above, resolvePublishedLocale only ever returns a member of the set it is
 * given, and a mismatch is a typo in this file rather than a runtime condition worth
 * branching on. The invariant is asserted below so a mismatch fails the typecheck's own test
 * run rather than rendering a blank page.
 */
export function articleBody(article: Article, locale: Locale): ArticleBody {
  return article.body[resolvePublishedLocale(locale, article.publishedIn)]!;
}

export function outletCopy(outlet: Outlet, locale: Locale): OutletCopy {
  return outlet.copy[resolvePublishedLocale(locale, outlet.publishedIn)]!;
}
