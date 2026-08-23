import type { Dictionary } from "./en";

// Simplified Chinese. Strings shared with design_handoff_agentsiam_portal/i18n.js are that
// file's own translations, unchanged. Lines marked NEW were written here rather than taken from
// the handoff. All 296 keys were reviewed on 23/08/2026, see
// as-work/2026-08-18-website-launch-blockers/copy-review-findings.md.

export const zh: Dictionary = {
  langName: "中文",

  navStay: "入住",
  navGuests: "住客", // NEW
  navDestinations: "区域", // NEW
  navListProperty: "交给我们托管", // NEW
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

  pendingNote: "尚未翻译：房源描述、法律条款页面，以及下方房东部分的详细内容。我们保留英文，不使用机器翻译。",  // adapted from the handoff

  heroEyebrow: "清迈·官网直订",
  heroTitleA: "住进真正",
  heroTitleB: "有人打理的房子",
  heroSub: "清迈现有一套房源，由接听电话的本地团队亲自打理。今后每接手一套，再上线一套。", // NEW
  viewProperty: "查看房源", // NEW

  forGuests: "给住客",
  forOwners: "给房东",
  guestPanelTitle: "我想住这里",
  guestPanelBody: "官网直订，没有平台加价，本地电话由团队亲自接听。",
  ownerPanelTitle: "我在清迈有房子",
  ownerPanelBody: "签约之前我们先把账算清楚。如果不划算，我们会直说。",
  ownerPanelLink: "了解我们如何管理",

  featuredTitle: "这套房源", // NEW
  featuredSub: "一套住宅，现已开放预订。与其挂上十套，不如把一套做好。", // NEW

  whyA: "官网直订，无平台加价",
  whyABody: "官网直订，房价不含平台加价，直接联系管理房源的团队。",
  whyB: "团队真的在清迈",
  whyBBody: "不是其他时区的客服中心。需要时，本地团队能到房源现场处理。",
  whyC: "入住期间随时联系",
  whyCBody: "入住全程可通过电话或LINE联系我们，24小时有人回应。",

  guestReviews: "住客怎么说", // NEW
  guestReviewSource: "Airbnb住客评价", // NEW

  ownerBandTitle: "在考虑把房子租出去？",
  ownerBandSub: "三个步骤，顺序固定。第一步是收费的可行性研究，结论为“可行/不可行”。每完成一步，您都可以选择停止。",
  ownerBandFoot: "清迈的低层房产，包括独栋住宅、联排住宅和小型楼房。",
  checkQualify: "看看您的房产是否符合条件",
  bookStudy: "预约可行性研究",
  step: "第",
  stair1Title: "可行性研究",
  stair1Body: "我们根据您所在区域的实际入住率测算房源收入。研究收费，且不要求您购买后续服务。",
  stair2Title: "短租许可办理",
  stair2Body: "泰国的短租规定具体且常被误读。我们会核实您的建筑类型和产权文件实际允许的用途。",
  stair3Title: "日常管理",
  stair3Body: "房源上线、定价、住客接待、清洁和维修，全部由本地团队现场管理，不只交给后台系统。",

  closingGuest: "还在找住的地方？",
  closingOwner: "在考虑把房子租出去？",

  ownerHeroEyebrow: "房东服务·清迈",
  ownerHeroTitle: "提出托管服务之前，我们先告诉您是否值得做。",
  ownerHeroSub: "三项服务，顺序固定。第一项是收费的可行性研究，结论为“可行/不可行”。数据不支持时，我们会明确给出“不可行”。",
  staircaseTitle: "是阶梯，不是菜单",
  whatYouGet: "您将获得",
  notIncluded: "不包含的部分，先说清楚",
  vpTitle: "这笔费用包含什么",
  vp1Title: "合法，而不只是上线",
  vp1Body: "我们依据《酒店法》及非酒店住宿相关规定审核您的房产，准备文件，并凭授权书代为提交。多数管理公司会跳过这一步，把风险留给您。",
  vp2Title: "团队就在清迈",
  vp2Body: "我们住在清迈，会到现场看房、接待住客，也了解哪些建筑允许短租。晚上11点出现故障时，消息由本地团队直接处理。",
  vp3Title: "先看数字，再谈合同",
  vp3Body: "可行性研究是收费服务，结论也可能是“不可行”。我们以审慎情形为依据，并与本地真实长租房源比较，不采用乐观预测。",
  vp4Title: "主要渠道，也包括您自己的渠道",
  vp4Body: "通过Beds24管理主要OTA上的房源和价格，并提供官网直订，让官网订单无需支付平台佣金。服务也包括住客的TM30申报。",
  gatesTitle: "评估必须敢说不。",
  qualifyTitle: "你的房子合适吗？",
  mgmtTitle: "「管理」到底包含什么",
  weDo: "我们负责",
  weDont: "我们不负责",
  reportTitle: "报告实际长什么样", // NEW
  reportBody: "报告共六部分，建议放在最后。下方数字已隐藏，因为虚构数字比不展示更糟。实际数字会根据您的房产测算。", // NEW
  proofTitle: "我们实际管理的一套房源", // NEW
  proofBody: "Lotus House位于昌康。这一页列出的每项工作，都是我们实际为它提供的，包括短租许可办理、上线渠道、TM30申报和住客接待。", // NEW
  meetTheTeam: "负责这些工作的人", // NEW
  faqTitle: "房东常问的问题",
  startNumbers: "先从数字开始。",
  lookingToStay: "其实是在找住的地方？",
  step1Name: "可行性与投资回报研究",
  step1Meta: "结论为“可行/不可行”",
  step2Name: "短租合法许可办理",
  step2Meta: "多数管理公司会跳过的一步",
  step3Name: "短租日常管理",
  step3Meta: "持续服务，无最低合约期",

  contactEyebrow: "给房东",
  contactTitle: "说说你的房子。",
  contactSub: "先提供四项信息，其他内容可在电话中沟通。",
  yourName: "你的姓名",
  contactWay: "邮箱、电话或LINE",
  propertyType: "房源类型",
  whereIsIt: "房子在哪个区域",
  anythingElse: "其他想说的（选填）",
  contactMsgHint: "面积、卧室数量、是否带家具，或任何特别情况",
  optional: "选填", // NEW
  phoneOrLine: "电话或LINE", // NEW
  send: "发送",
  sending: "发送中…", // NEW
  whatHappensNext: "接下来会怎样",
  nextStep1: "我们会亲自阅读，并在两个工作日内回复。",
  nextStep2: "先通一次电话，如果看起来可行，再实地看房。",
  nextStep3: "一份书面可行性研究报告，附真实数字，包括不建议继续的理由。",
  businessNote: "如果您想咨询商务服务而非房产，请发送邮件至", // NEW
  guestQnNote: "住客如需咨询预订，请使用房源页上的预订面板，系统会一并提交您选择的日期。",  // adapted from the handoff

  typeHouse: "独栋住宅",
  typeTownhouse: "联排住宅",
  typePoolVilla: "泳池别墅",
  typeCondoShort: "公寓",
  bedSuffix: "{n}室",
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
  photosOf: "{property}照片", // NEW
  close: "关闭",
  enquireDates: "咨询可订日期", // NEW
  whatThisHas: "房源设施",
  whereYoullBe: "位置",
  goodToKnow: "入住须知",
  houseRules: "入住规则",
  checkIn: "入住时间",
  checkOut: "退房时间",
  bedrooms: "卧室",
  bathrooms: "卫浴",
  maxGuests: "可住人数",
  guests: "住客",
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
  pickDatesHint: "选择入住日期查看总价，至少入住{n}晚。", // NEW
  minStayError: "至少入住{n}晚。", // NEW
  datesUnavailable: "所选日期不可订。", // NEW
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
  bookingUnavailable: "暂时无法加载日历。请告诉我们您的入住日期，我们会确认是否可订及总价，通常当天回复。", // NEW

  legalEyebrow: "法律条款",
  lastUpdated: "最后更新", // NEW
  notFoundEyebrow: "错误404", // NEW
  notFoundTitle: "找不到这个页面。", // NEW
  notFoundBody: "链接可能已失效，或网址输入有误。请尝试以下页面：", // NEW
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
  kmToCentre: "距市中心{n}公里", // NEW
  oneProperty: "1处房源", // NEW
  nProperties: "{n}处房源", // NEW
  browseByArea: "按区域浏览", // NEW
  noMatchTitle: "没有符合全部条件的房源。", // NEW
  noMatchRelax: "移除{filter}筛选后，可显示{n}处房源。", // NEW
  noMatchRelaxOne: "移除{filter}筛选后，可显示1处房源。", // NEW
  noMatchNothing: "即使移除任一筛选条件，结果也不会改变。请告诉我们您的需求，我们会如实说明能否帮忙。",
  launchingSoon: "即将开放", // NEW
  cityComingTitle: "{city}尚未开放。", // NEW
  cityComingBody:
    "我们目前由本地团队管理清迈的房源。{city}是下一站。请告诉我们您的需求，开放后我们会与您联系。",
  browseChiangMai: "浏览清迈房源", // NEW
  tellUsWhatYouNeed: "告诉我们您的需求", // NEW
  type_apartment: "公寓", // NEW
  type_townhouse: "联排住宅", // NEW
  type_house: "独栋住宅", // NEW
  type_villa: "别墅", // NEW
  feature_pool: "泳池", // NEW
  feature_rooftop: "屋顶露台", // NEW
  feature_kitchen: "全套厨房", // NEW
  feature_wifi: "高速Wi-Fi", // NEW
  feature_parking: "停车位", // NEW
  feature_workspace: "工作区", // NEW
  feature_washer: "洗衣机", // NEW
  feature_pet_friendly: "可携宠物", // NEW
  filter_areas: "区域", // NEW
  filter_types: "房源类型", // NEW
  filter_features: "设施", // NEW
  filter_bedrooms: "卧室", // NEW
  filter_bathrooms: "卫浴", // NEW
  filter_guests: "住客", // NEW

  destinationsTitle: "八个区域，如实描述。", // NEW
  destinationsIntro: "清迈不大，约二十分钟即可穿城，但各个区域差异明显，住在哪里会直接影响旅行体验。下面如实介绍每个区域，以及我们在那里管理的房源。",
  areaNoneYet: "暂无房源", // NEW
  areaEmptyTitle: "我们在{area}尚未管理任何房源。", // NEW
  areaEmptyBody: "我们不想为了填满页面而虚列房源。每次只接手一处，并且只接手能认真照管的房源，所以这份清单会按计划慢慢增加。",
  seeEverything: "查看我们管理的全部房源", // NEW
  otherAreas: "其他区域", // NEW
  searchThisArea: "搜索{area}", // NEW

  search: "搜索", // NEW
  forkGuestTitle: "我想入住。", // NEW
  forkGuestBody: "官网直订，没有平台加价。回复您消息的，就是实际管理这套房源的团队。",
  forkGuestLink: "浏览全部房源", // NEW
  forkOwnerTitle: "我在这里有房产。", // NEW
  forkOwnerBody: "我们先进行收费的可行性研究，结论可能是“不可行”。如果预计收益不合算，我们会在您签署任何文件前直说。",
  forkOwnerLink: "了解我们如何管理", // NEW

  showMap: "显示地图", // NEW
  hideMap: "隐藏地图", // NEW
  mapLabel: "我们管理房源的地图", // NEW

  allProperties: "全部房源", // NEW
  footAreas: "我们管理的区域", // NEW


  // -- local guide --------------------------------------------------------
  guideTitle: "周边指南", // NEW
  guideIntro: "我们亲自去过的地方，并标注从住处出发所需的时间。", // NEW
  guideCount: "{n}个地点", // NEW
  guideCountOne: "1个地点", // NEW
  guideFilterCategory: "类别", // NEW
  guideFilterArea: "区域", // NEW
  guideAll: "全部", // NEW
  guideNearby: "步行可达", // NEW
  guidePicks: "我们的推荐", // NEW
  guideWalk: "步行{n}分钟", // NEW
  guideDrive: "车程{n}分钟", // NEW
  guideNoWalk: "步行过远", // NEW
  guideDirections: "路线", // NEW
  guideDirectionsApple: "Apple地图", // NEW
  guideDirectionsGoogle: "Google地图", // NEW
  guideOutsideAreas: "更远区域", // NEW
  guideEmpty: "没有符合条件的地点。", // NEW
  guideClear: "清除筛选", // NEW
  guideFrom: "从{property}出发的时间。", // NEW
  guideBookDirect: "官网直订", // NEW
  guideBookDirectSub: "由撰写本指南的同一团队接待。", // NEW
  guideAskTitle: "咨询AgentSiam本地团队", // NEW
  guideAskBody: "关于清迈或入住的任何问题，都可以问我们。", // NEW
  guideAskCta: "通过WhatsApp联系我们", // NEW
  guideAskPrefill: "你好，AgentSiam。我正在阅读Lotus House周边指南，有一个问题想咨询。", // NEW
  guideAskDismiss: "稍后再说", // NEW
  // -- page metadata ------------------------------------------------------
  metaHomeTitle: "AgentSiam｜清迈短租托管", // NEW
  metaHomeDesc: "清迈短租房的可行性研究、短租许可办理和日常托管。三项服务依次进行，每一步都要先通过，才能进入下一步。", // NEW
  metaHowTitle: "我们如何运作", // NEW
  metaHowDesc: "三项服务按顺序进行：收费的可行性研究可能得出“不可行”；随后进行短租许可办理；最后管理主要OTA和官网直订。", // NEW
  metaPropertiesTitle: "清迈房源", // NEW
  metaPropertiesDesc: "清迈的独栋住宅、别墅和联排住宅，由本地团队管理。可按区域、类型和面积筛选，并在官网直订。", // NEW
  metaLotusTitle: "Lotus House，夜市附近的私人联排住宅", // NEW
  metaLotusDesc: "清迈昌康区的三层联排住宅，带屋顶露台。两间特大床卧室、两间浴室、设备齐全的厨房，可住四人。", // NEW
  metaGuideTitle: "{property}周边指南", // NEW
  metaGuideDesc: "{property}周边{n}个地点，由房东挑选，并列出从房源出发的步行和驾车时间。", // NEW
  metaDestinationsTitle: "清迈区域指南", // NEW
  metaDestinationsDesc: "我们覆盖清迈八个区域：Nimman、Old City、Santitham、Chang Khlan、Riverside、Hang Dong、Mae Rim、San Sai，并如实介绍每个区域。", // NEW
  metaAreaTitle: "住在清迈{area}", // NEW
  metaAreaDesc: "{area}：{vibe}。了解这个区域，以及我们在当地管理的房源。", // NEW
  metaContactTitle: "联系我们", // NEW
  metaContactDesc: "告诉我们您在清迈的房产，我们会就可行性研究、短租许可办理或全面托管与您联系。", // NEW
  metaBusinessTitle: "企业服务", // NEW
  metaBusinessDesc: "为进入泰国市场的企业提供公司设立与合规、OEM与供应链、在LINE、TikTok、Shopee和Lazada启动电商业务及增长支持。", // NEW
  metaTermsTitle: "条款与条件", // NEW
  metaTermsDesc: "适用于AgentSiam可行性研究、短租许可办理、短租托管服务及本网站使用的条款。", // NEW
  metaPrivacyTitle: "隐私政策", // NEW
  metaPrivacyDesc: "AgentSiam如何收集、使用和存储您通过本站提交的信息，以及您在泰国PDPA下享有的权利。", // NEW
  addressAfterBooking: "确认预订后，我们会将详细地址发送给您。", // NEW
  adults: "成人", // NEW
  children: "儿童", // NEW
  childrenNote: "无论年龄大小，每位入住者都计入最大人数。", // NEW
  whatThisPlaceIsNot: "预订前须知的限制", // NEW
  childSupervision: "幼儿在楼梯和屋顶露台需要成人看护。", // NEW
};
