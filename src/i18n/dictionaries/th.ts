import type { Dictionary } from "./en";

// Thai. Strings shared with design_handoff_agentsiam_portal/i18n.js are that file's own
// translations, unchanged. Lines marked NEW were written here and have not been reviewed
// by a Thai speaker -- flag them for review before this goes to production.

export const th: Dictionary = {
  langName: "ไทย",

  navStay: "เข้าพัก",
  navGuests: "ผู้เข้าพัก", // NEW
  navDestinations: "ย่านที่พัก", // NEW
  navListProperty: "ลงประกาศบ้านของคุณ", // NEW
  navOwners: "เจ้าของบ้าน",
  navContact: "ติดต่อเรา",
  skipToContent: "ข้ามไปยังเนื้อหา", // NEW
  languageLabel: "ภาษา", // NEW

  footStay: "เข้าพัก",
  footOwners: "เจ้าของบ้าน",
  footCompany: "เกี่ยวกับเรา",
  footLegal: "ข้อกำหนด",
  footContact: "ติดต่อ",
  footHow: "ขั้นตอนการทำงาน",
  businessServices: "บริการที่ปรึกษาธุรกิจ",
  terms: "ข้อกำหนดและเงื่อนไข",
  privacy: "นโยบายความเป็นส่วนตัว",
  copyright: "© 2026 AgentSiam Co., Ltd.", // NEW

  pendingNote:
    "ยังไม่ได้แปล: รายละเอียดที่พัก หน้าข้อกำหนดทางกฎหมาย และเนื้อหาสำหรับเจ้าของบ้านโดยละเอียดด้านล่าง — แสดงเป็นภาษาอังกฤษแทนการแปลด้วยเครื่อง", // adapted from the handoff

  heroEyebrow: "เชียงใหม่ · จองตรงกับเจ้าของ",
  heroTitleA: "พักในบ้าน",
  heroTitleB: "ที่มีคนดูแลจริง",
  heroSub:
    "บ้านหนึ่งหลังในเชียงใหม่ ดูแลในพื้นที่โดยทีมที่รับสายเอง และจะมีเพิ่มขึ้นเมื่อเรารับดูแลหลังใหม่", // NEW
  viewProperty: "ดูที่พัก", // NEW

  forGuests: "สำหรับผู้เข้าพัก",
  forOwners: "สำหรับเจ้าของบ้าน",
  guestPanelTitle: "ฉันต้องการหาที่พัก",
  guestPanelBody:
    "จองตรงกับเราได้ราคาที่ไม่มีค่าบวกจากแพลตฟอร์ม และมีเบอร์คนไทยที่รับสายจริง",
  ownerPanelTitle: "ฉันมีบ้านให้เช่า",
  ownerPanelBody: "เราคำนวณตัวเลขให้ก่อนเซ็นสัญญา ถ้าไม่คุ้ม เราจะบอกตรง ๆ",
  ownerPanelLink: "ดูวิธีที่เราดูแล",

  featuredTitle: "ที่พักของเรา", // NEW
  featuredSub: "บ้านหนึ่งหลัง เปิดรับจองแล้ว เราอยากดูแลหลังเดียวให้ดี มากกว่าลงประกาศสิบหลัง", // NEW

  whyA: "ราคาดีที่สุดเมื่อจองตรง",
  whyABody: "ไม่มีค่าบวกของแพลตฟอร์มระหว่างคุณกับคนที่ดูแลบ้าน",
  whyB: "ทีมงานอยู่เชียงใหม่จริง",
  whyBBody: "ไม่ใช่คอลเซ็นเตอร์ต่างประเทศ เราไปถึงบ้านได้",
  whyC: "ติดต่อได้ตลอดการเข้าพัก",
  whyCBody: "โทรหรือ LINE ได้ 24 ชั่วโมง ตลอดเวลาที่คุณอยู่ที่นี่",

  guestReviews: "ผู้เข้าพักพูดถึงอย่างไร", // NEW
  guestReviewSource: "รีวิวจากผู้เข้าพักบน Airbnb", // NEW

  ownerBandTitle: "กำลังคิดจะปล่อยเช่าบ้านอยู่ไหม",
  ownerBandSub:
    "สามขั้นตอน เรียงตามลำดับ ขั้นแรกเป็นการศึกษาความเป็นไปได้แบบมีค่าบริการ ที่จบด้วยคำตอบว่าควรทำหรือไม่ควรทำ และคุณหยุดตรงไหนก็ได้",
  ownerBandFoot: "บ้านแนวราบในเชียงใหม่ — บ้านเดี่ยว ทาวน์โฮม อาคารขนาดเล็ก",
  checkQualify: "เช็กว่าบ้านคุณเข้าเกณฑ์ไหม",
  bookStudy: "จองการศึกษาความเป็นไปได้",
  step: "ขั้นที่",
  stair1Title: "ศึกษาความเป็นไปได้",
  stair1Body:
    "เราคำนวณว่าบ้านคุณจะทำรายได้ได้จริงเท่าไร โดยเทียบกับอัตราการเข้าพักจริงในย่านของคุณ มีค่าบริการ แต่ไม่ผูกมัดอะไร",
  stair2Title: "ขออนุญาต",
  stair2Body:
    "กฎเรื่องที่พักระยะสั้นในไทยมีรายละเอียดเฉพาะและมักถูกเข้าใจผิด เราตรวจว่าอาคารและโฉนดของคุณทำอะไรได้จริง",
  stair3Title: "บริหารจัดการ",
  stair3Body:
    "ลงประกาศ ตั้งราคา ดูแลผู้เข้าพัก ทำความสะอาด ซ่อมบำรุง ด้วยทีมงานในพื้นที่จริง ไม่ใช่แค่หน้าจอ",

  closingGuest: "ยังหาที่พักอยู่ไหม",
  closingOwner: "กำลังคิดจะปล่อยเช่าบ้านอยู่ไหม",

  ownerHeroEyebrow: "สำหรับเจ้าของบ้าน · เชียงใหม่",
  ownerHeroTitle: "เราบอกก่อนว่าคุณควรทำหรือไม่ ก่อนจะขอเป็นคนดูแล",
  ownerHeroSub:
    "สามบริการ เรียงตามลำดับที่แน่นอน ขั้นแรกเป็นการศึกษาความเป็นไปได้แบบมีค่าบริการ ที่จบด้วยคำตอบว่าควรทำหรือไม่ควรทำ และเราตอบว่าไม่ควรบ่อยพอที่จะทำให้คำตอบนี้มีความหมาย",
  staircaseTitle: "เป็นขั้นบันได ไม่ใช่เมนูให้เลือก",
  whatYouGet: "สิ่งที่คุณได้",
  notIncluded: "สิ่งที่ไม่รวม เพื่อไม่ให้มีเรื่องเซอร์ไพรส์",
  vpTitle: "ค่าบริการนี้ซื้ออะไรจริง ๆ",
  vp1Title: "ถูกกฎหมาย ไม่ใช่แค่ลงประกาศ",
  vp1Body:
    "เราตรวจสอบบ้านของคุณกับพระราชบัญญัติโรงแรมและกรอบที่พักที่ไม่ใช่โรงแรม เตรียมเอกสาร และยื่นให้ในนามคุณ ผู้ให้บริการรายอื่นส่วนใหญ่ข้ามขั้นนี้และปล่อยความเสี่ยงไว้กับคุณ",
  vp2Title: "ทีมงานอยู่เชียงใหม่",
  vp2Body:
    "เราอยู่ที่นี่จริง เราไปดูบ้าน เราเจอผู้เข้าพัก และเรารู้ว่าอาคารไหนอนุญาตให้พักระยะสั้น เวลามีอะไรเสียตอนห้าทุ่ม มีคนในพื้นที่อ่านข้อความ",
  vp3Title: "ดูตัวเลขก่อนเซ็นสัญญา",
  vp3Body:
    "การศึกษาความเป็นไปได้มีค่าบริการ และผลลัพธ์อาจออกมาว่าไม่ควรทำ เราตัดสินจากกรณีที่ระมัดระวังที่สุด เทียบกับค่าเช่าระยะยาวจริงในพื้นที่ ไม่ใช่จากตัวเลขที่ดีที่สุด",
  vp4Title: "ทุกช่องทาง รวมถึงช่องทางของคุณเอง",
  vp4Body:
    "จัดการประกาศและราคาบน OTA หลักผ่าน Beds24 พร้อมเว็บจองตรง เพื่อไม่ต้องจ่ายค่าคอมมิชชันทุกคืน และรวมการแจ้ง ตม.30 ให้ด้วย",
  gatesTitle: "การศึกษานี้ต้องกล้าตอบว่าไม่ควรทำ",
  qualifyTitle: "บ้านของคุณเข้าเกณฑ์ไหม",
  mgmtTitle: "การดูแลของเราครอบคลุมอะไรจริง ๆ",
  weDo: "สิ่งที่เราทำ",
  weDont: "สิ่งที่เราไม่ทำ",
  reportTitle: "รายงานหน้าตาเป็นอย่างไร", // NEW
  reportBody:
    "หกส่วน และข้อสรุปอยู่ท้ายสุด ไม่ใช่หน้าแรก ตัวเลขด้านล่างถูกปิดไว้ เพราะการใส่ตัวเลขสมมติแย่กว่าการไม่แสดงเลย ตัวเลขจริงคำนวณจากบ้านของคุณ", // NEW
  proofTitle: "หลังที่เราดูแลเอง", // NEW
  proofBody:
    "โลตัสเฮาส์ ย่านช้างคลาน ทุกอย่างในหน้านี้คือสิ่งที่เราทำให้บ้านหลังนี้จริง ทั้งการขออนุญาต ช่องทางจอง การแจ้ง ตม.30 และการดูแลผู้เข้าพัก", // NEW
  meetTheTeam: "คนที่ลงมือทำ", // NEW
  faqTitle: "คำถามที่เจ้าของบ้านถามบ่อย",
  startNumbers: "เริ่มจากตัวเลขก่อน",
  lookingToStay: "กำลังหาที่พักอยู่หรือเปล่า",
  step1Name: "ศึกษาความเป็นไปได้และผลตอบแทน",
  step1Meta: "จบด้วยคำตอบว่าควรทำหรือไม่ควรทำ",
  step2Name: "ขออนุญาตประกอบธุรกิจที่พักระยะสั้น",
  step2Meta: "ขั้นที่ผู้ให้บริการรายอื่นมักข้าม",
  step3Name: "บริหารจัดการที่พักระยะสั้น",
  step3Meta: "ต่อเนื่อง ไม่มีสัญญาผูกมัด",

  contactEyebrow: "สำหรับเจ้าของบ้าน",
  contactTitle: "เล่าเรื่องบ้านของคุณให้เราฟัง",
  contactSub: "เริ่มจากสี่อย่าง เรื่องอื่นคุยกันทางโทรศัพท์ได้",
  yourName: "ชื่อของคุณ",
  contactWay: "อีเมล เบอร์โทร หรือ LINE",
  propertyType: "ประเภทที่พัก",
  whereIsIt: "อยู่ย่านไหน",
  anythingElse: "อย่างอื่นที่อยากบอก (ไม่บังคับ)",
  contactMsgHint: "ขนาด จำนวนห้องนอน มีเฟอร์นิเจอร์หรือไม่ หรืออย่างอื่นที่ไม่ปกติ",
  optional: "ไม่บังคับ", // NEW
  phoneOrLine: "เบอร์โทร หรือ LINE", // NEW
  send: "ส่ง",
  sending: "กำลังส่ง…", // NEW
  whatHappensNext: "ขั้นตอนต่อไป",
  nextStep1: "เราอ่านเองและตอบกลับภายในสองวันทำการ",
  nextStep2: "คุยทางโทรศัพท์ แล้วเข้าไปดูบ้านถ้าดูมีความเป็นไปได้",
  nextStep3:
    "รายงานความเป็นไปได้เป็นลายลักษณ์อักษร พร้อมตัวเลขจริง รวมถึงเหตุผลที่ไม่ควรทำ",
  businessNote:
    "อยากสอบถามเรื่องบริการที่ปรึกษาธุรกิจ ไม่ใช่เรื่องบ้าน? เขียนมาที่", // NEW
  guestQnNote:
    "เป็นผู้เข้าพักและมีคำถามเรื่องการจอง? ใช้ช่องจองในหน้าที่พักแทน เพราะระบบจะส่งวันที่ของคุณไปด้วย", // adapted from the handoff

  typeHouse: "บ้านเดี่ยว",
  typeTownhouse: "ทาวน์โฮม",
  typePoolVilla: "พูลวิลล่า",
  typeCondoShort: "คอนโด / อพาร์ตเมนต์",
  bedSuffix: "ห้องนอน",
  yes: "มี",
  no: "ไม่มี",
  areaNimman: "นิมมาน",
  areaOldCity: "เมืองเก่า",
  areaSantitham: "สันติธรรม",
  areaChangKhlan: "ช้างคลาน",
  areaRiverside: "ริมแม่น้ำปิง",
  areaHangDong: "หางดง",
  areaMaeRim: "แม่ริม",
  areaSanSai: "สันทราย",

  checkDatesAndBook: "เช็กวันว่างและจอง", // NEW
  showAllPhotos: "ดูรูปทั้งหมด",
  photosOf: "รูปของ", // NEW
  close: "ปิด",
  enquireDates: "สอบถามวันว่าง", // NEW
  whatThisHas: "สิ่งที่มีในที่พักนี้",
  whereYoullBe: "ทำเลที่พัก",
  goodToKnow: "สิ่งที่ควรรู้",
  houseRules: "กฎของบ้าน",
  checkIn: "เช็กอิน",
  checkOut: "เช็กเอาต์",
  bedrooms: "ห้องนอน",
  bathrooms: "ห้องน้ำ",
  maxGuests: "ผู้เข้าพักสูงสุด",
  guests: "ผู้เข้าพัก",
  neighbourhood: "ย่าน",

  // -- booking panel (all NEW, unreviewed) --------------------------------
  pickDate: "เลือก", // NEW
  clearDates: "ล้าง", // NEW
  previousMonth: "เดือนก่อนหน้า", // NEW
  nextMonth: "เดือนถัดไป", // NEW
  loadingAvailability: "กำลังโหลดวันว่าง…", // NEW
  pricing: "กำลังคำนวณราคา…", // NEW
  night: "คืน", // NEW
  nights: "คืน", // NEW
  pickDatesHint:
    "เลือกวันเพื่อดูราคารวม เข้าพักขั้นต่ำ {n} คืน", // NEW
  minStayError: "เข้าพักขั้นต่ำ {n} คืน", // NEW
  datesUnavailable: "วันที่เลือกไม่ว่าง", // NEW
  requestToBook: "ส่งคำขอจอง", // NEW
  bookAndPay: "จองและชำระเงินตอนนี้", // NEW
  continueToPayment: "ไปหน้าชำระเงิน", // NEW
  payNow: "ชำระ", // NEW
  paying: "กำลังดำเนินการชำระเงิน…", // NEW
  heldNote:
    "เรากันวันที่คุณเลือกไว้ระหว่างชำระเงิน ข้อมูลบัตรส่งตรงไปยังผู้ให้บริการชำระเงิน และไม่ถูกเก็บไว้บนเว็บไซต์นี้", // NEW
  paidTitle: "จองสำเร็จ", // NEW
  paidBody:
    "ได้รับชำระเงินแล้ว และการเข้าพักของคุณได้รับการยืนยัน ใบเสร็จจะส่งไปที่อีเมลของคุณ และเราจะติดต่อก่อนวันเข้าพัก", // NEW
  requestOnlyNote:
    "เราจะยืนยันทางอีเมล โดยมักภายในวันเดียวกัน ยังไม่มีการเรียกเก็บเงิน", // NEW
  twoWaysNote:
    "ส่งคำขอจอง เราจะยืนยันทางอีเมลภายในวันเดียวกัน หรือชำระเงินตอนนี้เพื่อยืนยันการจองทันที", // NEW
  firstName: "ชื่อ", // NEW
  lastName: "นามสกุล", // NEW
  sendRequest: "ส่งคำขอ", // NEW
  back: "กลับ", // NEW
  requestPrivacyNote:
    "การส่งแบบฟอร์มนี้ถือว่าคุณยินยอมให้เราติดต่อเรื่องการเข้าพัก ดู", // NEW
  requestSentTitle: "ส่งคำขอแล้ว", // NEW
  requestSentBody:
    "เราจะยืนยันทางอีเมล โดยมักภายในวันเดียวกัน ยังไม่มีการเรียกเก็บเงิน", // NEW
  bookingFailed:
    "เกิดข้อผิดพลาด กรุณาส่งอีเมลมาที่", // NEW
  bookingUnavailable:
    "ขณะนี้โหลดปฏิทินไม่สำเร็จ แจ้งวันที่คุณต้องการ แล้วเราจะยืนยันวันว่างและราคารวม โดยมักภายในวันเดียวกัน", // NEW

  legalEyebrow: "ข้อกำหนด",
  lastUpdated: "ปรับปรุงล่าสุด", // NEW
  notFoundEyebrow: "ข้อผิดพลาด 404", // NEW
  notFoundTitle: "ไม่พบหน้านี้", // NEW
  notFoundBody:
    "ลิงก์อาจเก่าเกินไป หรือที่อยู่อาจพิมพ์ผิด ทั้งเว็บไซต์มีเพียงหน้าเหล่านี้", // NEW
  notFoundCta: "บอกเราว่าคุณกำลังหาอะไร", // NEW
  backHome: "กลับไปหน้าแรก", // NEW

  // -- search, filters and results (all NEW, unreviewed) ------------------
  where: "ที่ไหน", // NEW
  any: "ทั้งหมด", // NEW
  filters: "ตัวกรอง", // NEW
  applyFilters: "ใช้ตัวกรอง", // NEW
  clearFilters: "ล้างตัวกรอง", // NEW
  removeFilter: "นำตัวกรองนี้ออก", // NEW
  filteringBy: "กรองตาม", // NEW
  sort: "เรียงตาม", // NEW
  sort_area: "ตามย่าน", // NEW
  sort_price_asc: "ราคาต่ำไปสูง", // NEW
  sort_price_desc: "ราคาสูงไปต่ำ", // NEW
  features: "สิ่งอำนวยความสะดวก", // NEW
  fromPrice: "เริ่มต้น", // NEW
  perNight: "ต่อคืน", // NEW
  kmToCentre: "กม. จากใจกลางเมือง", // NEW
  oneProperty: "ที่พัก 1 แห่ง", // NEW
  nProperties: "ที่พัก {n} แห่ง", // NEW
  browseByArea: "เลือกดูตามย่าน", // NEW
  noMatchTitle: "ไม่มีที่พักตรงกับเงื่อนไขทั้งหมด", // NEW
  noMatchRelax: "หากนำตัวกรอง{filter}ออก จะพบ {n} แห่ง", // NEW
  noMatchRelaxOne: "หากนำตัวกรอง{filter}ออก จะพบ 1 แห่ง", // NEW
  noMatchNothing:
    "แม้นำตัวกรองใดออกก็ยังไม่พบที่พัก บอกเราว่าคุณกำลังมองหาอะไร แล้วเราจะตอบตามตรงว่าช่วยได้หรือไม่",
  launchingSoon: "เร็ว ๆ นี้", // NEW
  cityComingTitle: "ยังไม่เปิดให้บริการใน{city}", // NEW
  cityComingBody:
    "ขณะนี้เราดูแลที่พักในเชียงใหม่ โดยทีมงานของเราเองในพื้นที่ {city} เป็นเมืองถัดไป บอกความต้องการของคุณไว้ แล้วเราจะติดต่อกลับเมื่อเปิดให้บริการ",
  browseChiangMai: "ดูที่พักในเชียงใหม่", // NEW
  tellUsWhatYouNeed: "บอกความต้องการของคุณ", // NEW
  type_apartment: "อพาร์ตเมนต์", // NEW
  type_townhouse: "ทาวน์เฮาส์", // NEW
  type_house: "บ้าน", // NEW
  type_villa: "วิลลา", // NEW
  feature_pool: "สระว่ายน้ำ", // NEW
  feature_rooftop: "ดาดฟ้า", // NEW
  feature_kitchen: "ครัวครบครัน", // NEW
  feature_wifi: "Wi-Fi ความเร็วสูง", // NEW
  feature_parking: "ที่จอดรถ", // NEW
  feature_workspace: "มุมทำงาน", // NEW
  feature_washer: "เครื่องซักผ้า", // NEW
  feature_pet_friendly: "นำสัตว์เลี้ยงได้", // NEW
  filter_areas: "ย่าน", // NEW
  filter_types: "ประเภทที่พัก", // NEW
  filter_features: "สิ่งอำนวยความสะดวก", // NEW
  filter_bedrooms: "ห้องนอน", // NEW
  filter_bathrooms: "ห้องน้ำ", // NEW
  filter_guests: "จำนวนผู้เข้าพัก", // NEW

  destinationsTitle: "แปดย่าน อธิบายตามจริง", // NEW
  destinationsIntro:
    "เชียงใหม่เล็กพอที่จะข้ามเมืองได้ในยี่สิบนาที แต่หลากหลายพอที่ย่านจะเป็นตัวกำหนดทริปของคุณ นี่คือลักษณะจริงของแต่ละย่าน และที่พักที่เราดูแลอยู่",
  areaNoneYet: "ยังไม่มีที่พัก", // NEW
  areaEmptyTitle: "เรายังไม่ได้ดูแลที่พักใน{area}", // NEW
  areaEmptyBody:
    "แทนที่จะเติมหน้านี้ให้ดูเต็ม เราขอบอกตามตรง เรารับดูแลที่พักทีละแห่ง และเฉพาะที่เราดูแลได้ดีจริง รายการนี้จึงเติบโตช้าโดยตั้งใจ",
  seeEverything: "ดูที่พักทั้งหมดที่เราดูแล", // NEW
  otherAreas: "ย่านอื่น ๆ", // NEW
  searchThisArea: "ค้นหาใน{area}", // NEW

  search: "ค้นหา", // NEW
  forkGuestTitle: "ฉันต้องการเข้าพัก", // NEW
  forkGuestBody:
    "จองตรงกับเราไม่มีค่าบวกเพิ่มจากแพลตฟอร์ม และคนที่ตอบข้อความคุณคือคนเดียวกับที่ดูแลบ้านหลังนั้น",
  forkGuestLink: "ดูที่พักทั้งหมด", // NEW
  forkOwnerTitle: "ฉันมีบ้านให้เช่า", // NEW
  forkOwnerBody:
    "เราเริ่มจากการศึกษาความเป็นไปได้แบบมีค่าใช้จ่าย ซึ่งอาจจบลงด้วยคำว่าไม่คุ้ม หากบ้านของคุณไม่ทำรายได้ เราขอบอกก่อนที่คุณจะเซ็นอะไรทั้งสิ้น",
  forkOwnerLink: "ดูวิธีการดูแลของเรา", // NEW

  showMap: "แสดงแผนที่", // NEW
  hideMap: "ซ่อนแผนที่", // NEW
  mapLabel: "แผนที่ที่พักที่เราดูแล", // NEW

  allProperties: "ที่พักทั้งหมด", // NEW
  footAreas: "ย่านที่เราดูแล", // NEW


  // -- local guide --------------------------------------------------------
  guideTitle: "คู่มือย่านนี้", // NEW
  guideIntro: "สถานที่ที่เราไปมาเอง พร้อมเวลาเดินทางจากบ้าน", // NEW
  guideCount: "{n} แห่ง", // NEW
  guideCountOne: "1 แห่ง", // NEW
  guideFilterCategory: "ประเภท", // NEW
  guideFilterArea: "ย่าน", // NEW
  guideAll: "ทั้งหมด", // NEW
  guideNearby: "เดินไปได้", // NEW
  guidePicks: "ที่เราชอบ", // NEW
  guideWalk: "นาที (เดิน)", // NEW
  guideDrive: "นาที (รถ)", // NEW
  guideNoWalk: "ไกลเกินกว่าจะเดิน", // NEW
  guideDirections: "เส้นทาง", // NEW
  guideDirectionsApple: "Apple Maps", // NEW
  guideDirectionsGoogle: "Google Maps", // NEW
  guideOutsideAreas: "ไกลออกไป", // NEW
  guideEmpty: "ไม่พบสถานที่ตามที่เลือก", // NEW
  guideClear: "ล้างตัวกรอง", // NEW
  guideFrom: "เวลาคำนวณจาก {property}", // NEW
  guideBookDirect: "จองตรงกับเรา", // NEW
  guideBookDirectSub: "เจ้าของบ้านคนเดียวกับที่เขียนคู่มือนี้", // NEW
  guideAskTitle: "คุยกับ AgentSiam Local Guide", // NEW
  guideAskBody: "ถามเราได้ทุกเรื่องเกี่ยวกับเชียงใหม่ หรือการเข้าพัก", // NEW
  guideAskCta: "ทักเราทาง WhatsApp", // NEW
  guideAskPrefill: "สวัสดีค่ะ/ครับ AgentSiam ผมกำลังดูคู่มือย่านของ Lotus House และมีคำถามครับ", // NEW
  guideAskDismiss: "ไว้ก่อน", // NEW
  // -- page metadata ------------------------------------------------------
  metaHomeTitle: "AgentSiam | รับดูแลบ้านพักระยะสั้นในเชียงใหม่", // NEW
  metaHomeDesc:
    "ศึกษาความเป็นไปได้ ขออนุญาต และรับดูแลบ้านพักระยะสั้นในเชียงใหม่ สามขั้นตอนแยกจากกัน แต่ละขั้นต้องพิสูจน์ตัวเองก่อนจึงจะไปขั้นต่อไป", // NEW
  metaHowTitle: "เราทำงานอย่างไร", // NEW
  metaHowDesc:
    "สามบริการที่เรียงเป็นขั้นบันได ไม่ใช่เมนูให้เลือก เริ่มจากการศึกษาความเป็นไปได้แบบมีค่าใช้จ่ายซึ่งอาจจบที่ไม่แนะนำให้ทำ ต่อด้วยการยื่นขอยกเว้นใบอนุญาตโรงแรม แล้วจึงรับดูแลทั้ง OTA และการจองตรง", // NEW
  metaPropertiesTitle: "ที่พักในเชียงใหม่", // NEW
  metaPropertiesDesc:
    "บ้าน วิลล่า และทาวน์เฮาส์ในเชียงใหม่ ดูแลโดยทีมในพื้นที่ กรองตามย่าน ประเภท และขนาด แล้วจองตรงได้เลย", // NEW
  metaLotusTitle: "Lotus House ทาวน์เฮาส์ส่วนตัวใกล้ไนท์บาซาร์", // NEW
  metaLotusDesc:
    "ทาวน์เฮาส์สามชั้นพร้อมดาดฟ้า ย่านช้างคลาน เชียงใหม่ สองห้องนอนเตียงคิง สองห้องน้ำ ครัวครบครัน รองรับสี่ท่าน", // NEW
  metaGuideTitle: "คู่มือย่านรอบ {property}", // NEW
  metaGuideDesc:
    "{n} สถานที่รอบ {property} ในเชียงใหม่ คัดเลือกโดยเจ้าของบ้าน พร้อมเวลาเดินและเวลาขับรถจากหน้าประตู", // NEW
  metaDestinationsTitle: "ย่านที่พักในเชียงใหม่", // NEW
  metaDestinationsDesc:
    "แปดย่านในเชียงใหม่ที่เราดูแล Nimman, Old City, Santitham, Chang Khlan, Riverside, Hang Dong, Mae Rim และ San Sai พร้อมบรรยากาศจริงของแต่ละย่าน", // NEW
  metaAreaTitle: "พักย่าน {area} เชียงใหม่", // NEW
  metaAreaDesc:
    "{area} ในเชียงใหม่ ย่านนี้เป็นอย่างไร และที่พักที่เราดูแลอยู่ที่นั่น", // NEW
  metaContactTitle: "ติดต่อเรา", // NEW
  metaContactDesc:
    "เล่าเรื่องบ้านของคุณในเชียงใหม่ให้เราฟัง แล้วเราจะติดต่อกลับเรื่องการศึกษาความเป็นไปได้ การขออนุญาต หรือการรับดูแลเต็มรูปแบบ", // NEW
  metaBusinessTitle: "บริการสำหรับธุรกิจ", // NEW
  metaBusinessDesc:
    "สำหรับธุรกิจที่กำลังเข้ามาในไทย จดทะเบียนบริษัทและดูแลการปฏิบัติตามกฎหมาย OEM และซัพพลายเชน เปิดการขายออนไลน์บน LINE TikTok Shopee และ Lazada พร้อมการเติบโต", // NEW
  metaTermsTitle: "ข้อกำหนดและเงื่อนไข", // NEW
  metaTermsDesc:
    "ข้อกำหนดที่ครอบคลุมบริการศึกษาความเป็นไปได้ การขออนุญาตให้เช่าที่พักระยะสั้น และการรับดูแลของ AgentSiam รวมถึงการใช้งานเว็บไซต์นี้", // NEW
  metaPrivacyTitle: "นโยบายความเป็นส่วนตัว", // NEW
  metaPrivacyDesc:
    "AgentSiam เก็บ ใช้ และรักษาข้อมูลที่คุณส่งผ่านเว็บไซต์นี้อย่างไร และสิทธิของคุณภายใต้ PDPA ของไทย", // NEW
  addressAfterBooking: "เราจะส่งที่อยู่แบบละเอียดให้เมื่อการจองได้รับการยืนยันแล้ว", // NEW
};
