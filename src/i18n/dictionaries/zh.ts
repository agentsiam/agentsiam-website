import type { Dictionary } from "./en";

// Simplified Chinese. Strings shared with design_handoff_agentsiam_portal/i18n.js are that
// file's own translations, unchanged. Lines marked NEW were written here and have not been
// reviewed by a Chinese speaker -- flag them for review before this goes to production.

export const zh: Dictionary = {
  langName: "中文",

  navStay: "入住",
  navGuests: "住客", // NEW
  navDestinations: "区域", // NEW
  navListProperty: "出租您的房产", // NEW
  navOwners: "房东",
  navContact: "联系我们",
  skipToContent: "跳到正文", // NEW
  languageLabel: "语言", // NEW

  footStay: "入住",
  footOwners: "房东",
  footCompany: "关于我们",
  footLegal: "法律条款",
  footContact: "联系方式",
  footHow: "服务流程",
  businessServices: "商务咨询服务",
  terms: "条款与条件",
  privacy: "隐私政策",
  copyright: "© 2026 AgentSiam Co., Ltd.", // NEW

  pendingNote:
    "尚未翻译：房源描述、法律条款页面，以及下方房东部分的详细内容——宁可保留英文，也不做机器翻译。", // adapted from the handoff

  heroEyebrow: "清迈 · 官网直订",
  heroTitleA: "住进真正",
  heroTitleB: "有人打理的房子",
  heroSub:
    "清迈的一套住宅，由本地团队亲自打理，电话有人接。以后接手更多，再逐一列上来。", // NEW
  viewProperty: "查看房源", // NEW

  forGuests: "给房客",
  forOwners: "给房东",
  guestPanelTitle: "我想找地方住",
  guestPanelBody:
    "官网直订，没有平台加价，还有一个本地号码真的有人接。",
  ownerPanelTitle: "我在清迈有房子",
  ownerPanelBody: "签约之前我们先把账算清楚。如果不划算，我们会直说。",
  ownerPanelLink: "了解我们如何管理",

  featuredTitle: "这套房源", // NEW
  featuredSub: "一套住宅，现已开放预订。与其挂上十套，不如把一套做好。", // NEW

  whyA: "直订价格最好",
  whyABody: "你和打理这套房子的人之间，没有平台抽成。",
  whyB: "团队真的在清迈",
  whyBBody: "不是别的时区的客服中心。我们能直接到房子里去。",
  whyC: "入住期间随时联系",
  whyCBody: "电话或 LINE，全天候，整个行程都在。",

  guestReviews: "房客怎么说", // NEW
  guestReviewSource: "Airbnb 房客评价", // NEW

  ownerBandTitle: "在考虑把房子租出去？",
  ownerBandSub:
    "三个步骤，顺序固定。第一步是收费的可行性评估，最后给出明确的「做」或「不做」——任何一步之后你都可以停下。",
  ownerBandFoot: "清迈的低层住宅——独栋、联排、小型楼房。",
  checkQualify: "看看你的房子是否符合",
  bookStudy: "预约可行性评估",
  step: "第",
  stair1Title: "可行性评估",
  stair1Body:
    "我们按你所在区域的真实出租率，算出这套房子实际能挣多少。收费，但不构成任何承诺。",
  stair2Title: "合法许可",
  stair2Body:
    "泰国对短租的规定很具体，也常被误读。我们确认你的楼房和产权到底允许做什么。",
  stair3Title: "日常管理",
  stair3Body:
    "房源上线、定价、房客、清洁、维修。由本地团队亲自处理，不是一个后台面板。",

  closingGuest: "还在找住的地方？",
  closingOwner: "在考虑把房子租出去？",

  ownerHeroEyebrow: "给房东 · 清迈",
  ownerHeroTitle: "在争取管理权之前，我们先告诉你该不该做。",
  ownerHeroSub:
    "三项服务，顺序固定。第一项是收费的可行性评估，最后给出「做」或「不做」——而「不做」是我们说得够多、因此算数的答案。",
  staircaseTitle: "是阶梯，不是菜单",
  whatYouGet: "你会得到",
  notIncluded: "不包含的部分，先说清楚",
  vpTitle: "这笔费用到底买到什么",
  vp1Title: "合法，而不只是上线",
  vp1Body:
    "我们按《酒店法》和非酒店住宿框架评估你的房子，准备文件并代为申报。多数管理公司完全跳过这一步，把风险留给你。",
  vp2Title: "团队就在清迈",
  vp2Body:
    "我们住在这里。我们去看房、见房客，知道哪些楼房允许短租。晚上十一点有东西坏了，读到消息的是本地的人。",
  vp3Title: "先看数字，再谈合同",
  vp3Body:
    "可行性评估是收费的，结论也可能是「不要做」。我们按最保守的情形判断，对照真实的本地长租行情，而不是最乐观的那一列。",
  vp4Title: "各大渠道，加上你自己的",
  vp4Body:
    "通过 Beds24 管理主要 OTA 的房源与价格，另有官网直订，让不是每一晚都要付平台佣金。TM30 房客申报已包含在内。",
  gatesTitle: "评估必须敢说不。",
  qualifyTitle: "你的房子合适吗？",
  mgmtTitle: "「管理」到底包含什么",
  weDo: "我们负责",
  weDont: "我们不负责",
  reportTitle: "报告实际长什么样", // NEW
  reportBody:
    "六个部分，结论放在最后，而不是最前。下面的金额被遮去了——编一个数字比不给数字更糟。真实数字按你的房子测算。", // NEW
  proofTitle: "我们自己在管的一套", // NEW
  proofBody:
    "位于昌康的 Lotus House。这一页上写的每一件事，都是我们为它实际在做的——许可、渠道、TM30 申报、房客接待。", // NEW
  meetTheTeam: "做这件事的人", // NEW
  faqTitle: "房东常问的问题",
  startNumbers: "先从数字开始。",
  lookingToStay: "其实是在找住的地方？",
  step1Name: "可行性与投资回报评估",
  step1Meta: "最后给出「做」或「不做」",
  step2Name: "短租合法许可办理",
  step2Meta: "多数管理公司会跳过的一步",
  step3Name: "短租日常管理",
  step3Meta: "长期服务，无锁定期",

  contactEyebrow: "给房东",
  contactTitle: "说说你的房子。",
  contactSub: "先四项。其余的通话时再聊。",
  yourName: "你的姓名",
  contactWay: "邮箱、电话或 LINE",
  propertyType: "房屋类型",
  whereIsIt: "房子在哪个区域",
  anythingElse: "其他想说的（选填）",
  contactMsgHint: "面积、卧室数量、是否带家具，或任何特别情况",
  optional: "选填", // NEW
  phoneOrLine: "电话或 LINE", // NEW
  send: "发送",
  sending: "发送中…", // NEW
  whatHappensNext: "接下来会怎样",
  nextStep1: "我们会亲自阅读，并在两个工作日内回复。",
  nextStep2: "先通一次电话，如果看起来可行，再实地看房。",
  nextStep3: "一份书面可行性报告，附真实数字——包括不该做的理由。",
  businessNote: "想问的是商务咨询服务，而不是房子？请写信到", // NEW
  guestQnNote:
    "房客想问预订的事？请用房源页上的预订面板，它会一并带上你的日期。", // adapted from the handoff

  typeHouse: "独栋住宅",
  typeTownhouse: "联排住宅",
  typePoolVilla: "泳池别墅",
  typeCondoShort: "公寓",
  bedSuffix: "室",
  yes: "有",
  no: "没有",
  areaNimman: "尼曼",
  areaOldCity: "古城",
  areaSantitham: "善提坦",
  areaChangKhlan: "昌康",
  areaRiverside: "滨河",
  areaHangDong: "杭东",
  areaMaeRim: "湄林",
  areaSanSai: "训赛",

  checkDatesAndBook: "查看日期并预订", // NEW
  showAllPhotos: "查看全部照片",
  photosOf: "照片：", // NEW
  close: "关闭",
  enquireDates: "咨询可订日期", // NEW
  whatThisHas: "房源设施",
  whereYoullBe: "位置",
  goodToKnow: "入住须知",
  houseRules: "房屋规则",
  checkIn: "入住时间",
  checkOut: "退房时间",
  bedrooms: "卧室",
  bathrooms: "卫浴",
  maxGuests: "可住人数",
  guests: "人数",
  neighbourhood: "区域",

  // -- booking panel (all NEW, unreviewed) --------------------------------
  pickDate: "选择", // NEW
  clearDates: "清除", // NEW
  previousMonth: "上一个月", // NEW
  nextMonth: "下一个月", // NEW
  loadingAvailability: "正在加载可预订日期…", // NEW
  pricing: "正在计算价格…", // NEW
  night: "晚", // NEW
  nights: "晚", // NEW
  pickDatesHint: "选择日期以查看总价。最少入住 {n} 晚。", // NEW
  minStayError: "最少入住 {n} 晚。", // NEW
  datesUnavailable: "所选日期已被预订。", // NEW
  requestToBook: "提交预订申请", // NEW
  bookAndPay: "立即预订并付款", // NEW
  continueToPayment: "继续付款", // NEW
  payNow: "支付", // NEW
  paying: "正在处理付款…", // NEW
  heldNote:
    "付款期间我们会为您保留所选日期。银行卡信息直接发送至支付服务商，本网站不会存储。", // NEW
  paidTitle: "预订成功。", // NEW
  paidBody:
    "已收到付款，您的入住已确认。收据将发送至您的邮箱，我们会在您抵达前与您联系。", // NEW
  requestOnlyNote:
    "我们会通过邮件确认，通常当天回复。现在不会扣款。", // NEW
  twoWaysNote:
    "提交申请，我们通常当天通过邮件确认；或现在付款，即刻确认入住。", // NEW
  firstName: "名", // NEW
  lastName: "姓", // NEW
  sendRequest: "发送申请", // NEW
  back: "返回", // NEW
  requestPrivacyNote:
    "发送即表示您同意我们就您的入住事宜与您联系。请参阅", // NEW
  requestSentTitle: "申请已发送。", // NEW
  requestSentBody:
    "我们会通过邮件确认，通常当天回复。尚未扣款。", // NEW
  bookingFailed: "出现问题。请发邮件至", // NEW
  bookingUnavailable:
    "暂时无法加载日历。请告知您的日期，我们会确认房态与总价，通常当天回复。", // NEW

  legalEyebrow: "法律条款",
  lastUpdated: "最后更新", // NEW
  notFoundEyebrow: "错误 404", // NEW
  notFoundTitle: "这个页面不在这里。", // NEW
  notFoundBody: "链接可能已经过期，或者地址打错了。整个网站只有这几页：", // NEW
  notFoundCta: "告诉我们你想找什么", // NEW
  backHome: "返回首页", // NEW

  // -- search, filters and results (all NEW, unreviewed) ------------------
  where: "目的地", // NEW
  any: "不限", // NEW
  filters: "筛选", // NEW
  applyFilters: "应用", // NEW
  clearFilters: "清除筛选", // NEW
  removeFilter: "移除此筛选", // NEW
  filteringBy: "筛选条件", // NEW
  sort: "排序", // NEW
  sort_area: "按区域", // NEW
  sort_price_asc: "价格从低到高", // NEW
  sort_price_desc: "价格从高到低", // NEW
  features: "设施", // NEW
  fromPrice: "起价", // NEW
  perNight: "每晚", // NEW
  kmToCentre: "公里至市中心", // NEW
  oneProperty: "1 处住所", // NEW
  nProperties: "{n} 处住所", // NEW
  browseByArea: "按区域浏览", // NEW
  noMatchTitle: "没有同时符合全部条件的住所。", // NEW
  noMatchRelax: "去掉{filter}筛选后有 {n} 处。", // NEW
  noMatchRelaxOne: "去掉{filter}筛选后有 1 处。", // NEW
  noMatchNothing:
    "即使去掉任一筛选条件也仍无结果。请告诉我们您的需求，我们会如实回覆能否帮上忙。",
  launchingSoon: "即将开放", // NEW
  cityComingTitle: "{city}尚未开放。", // NEW
  cityComingBody:
    "我们目前由本地团队管理清迈的房源。{city}是下一站。请告诉我们您的需求，开放后我们会与您联系。",
  browseChiangMai: "浏览清迈房源", // NEW
  tellUsWhatYouNeed: "告诉我们您的需求", // NEW
  type_apartment: "公寓", // NEW
  type_townhouse: "联排别墅", // NEW
  type_house: "独栋住宅", // NEW
  type_villa: "别墅", // NEW
  feature_pool: "泳池", // NEW
  feature_rooftop: "屋顶露台", // NEW
  feature_kitchen: "全套厨房", // NEW
  feature_wifi: "高速 Wi-Fi", // NEW
  feature_parking: "停车位", // NEW
  feature_workspace: "工作区", // NEW
  feature_washer: "洗衣机", // NEW
  feature_pet_friendly: "可携宠物", // NEW
  filter_areas: "区域", // NEW
  filter_types: "房源类型", // NEW
  filter_features: "设施", // NEW
  filter_bedrooms: "卧室", // NEW
  filter_bathrooms: "卫浴", // NEW
  filter_guests: "入住人数", // NEW

  destinationsTitle: "八个区域，如实描述。", // NEW
  destinationsIntro:
    "清迈小到二十分钟即可穿城而过，却又足够多样，以致于选哪个区域基本决定了这趟旅程。以下是每个区域的真实样貌，以及我们在当地管理的房源。",
  areaNoneYet: "暂无房源", // NEW
  areaEmptyTitle: "我们在{area}尚未管理任何房源。", // NEW
  areaEmptyBody:
    "与其把这个页面填满，我们宁可直说。我们一次只接手一处房源，且只接手真正能照管好的，因此这份清单是有意地缓慢增长。",
  seeEverything: "查看我们管理的全部房源", // NEW
  otherAreas: "其他区域", // NEW
  searchThisArea: "搜索{area}", // NEW

  search: "搜索", // NEW
  forkGuestTitle: "我想入住。", // NEW
  forkGuestBody:
    "直接预订不含平台加价，回覆您消息的人，就是实际照管这处房子的人。",
  forkGuestLink: "浏览全部房源", // NEW
  forkOwnerTitle: "我在这里有房产。", // NEW
  forkOwnerBody:
    "我们从付费的可行性评估开始，结论可能是不建议出租。如果您的房子赚不到钱，我们宁可在您签约之前就告诉您。",
  forkOwnerLink: "了解我们如何管理", // NEW

  showMap: "显示地图", // NEW
  hideMap: "隐藏地图", // NEW
  mapLabel: "我们管理房源的地图", // NEW

  allProperties: "全部房源", // NEW
  footAreas: "我们管理的区域", // NEW

};
