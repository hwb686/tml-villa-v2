export type Language = 'th' | 'en' | 'zh';

const translations = {
  th: {
    nav: { homestay: 'ที่พัก', carRental: 'เช่ารถ', tickets: 'ตั๋ว', dining: 'ร้านอาหาร', login: 'เข้าสู่ระบบ', wishlists: 'รายการโปรด', trips: 'การเดินทาง', messages: 'ข้อความ' },
    search: { where: 'ที่ไหน', checkin: 'เช็คอิน', checkout: 'เช็คเอาท์', who: 'ใคร', addGuests: 'เพิ่มผู้เข้าพัก', search: 'ค้นหา' },
    hero: { title: 'สำรวจที่พักสุดพิเศษในประเทศไทย', subtitle: 'จองวิลล่าหรู อพาร์ตเมนต์สวย และบ้านพักตากอากาศ' },
    listing: { perNight: '/คืน', superhost: 'ซูเปอร์โฮสต์', reviews: 'รีวิว' },
    footer: { about: 'เกี่ยวกับเรา', support: 'ช่วยเหลือ', hosting: 'เป็นเจ้าของที่พัก', terms: 'ข้อกำหนด', privacy: 'ความเป็นส่วนตัว' }
  },
  en: {
    nav: { homestay: 'Homestay', carRental: 'Car Rental', tickets: 'Tickets', dining: 'Dining', login: 'Log in', wishlists: 'Wishlists', trips: 'Trips', messages: 'Messages' },
    search: { where: 'Where', checkin: 'Check in', checkout: 'Check out', who: 'Who', addGuests: 'Add guests', search: 'Search' },
    hero: { title: 'Discover Unique Stays in Thailand', subtitle: 'Book luxury villas, beautiful apartments, and vacation homes' },
    listing: { perNight: 'night', superhost: 'Superhost', reviews: 'reviews' },
    footer: { about: 'About', support: 'Support', hosting: 'Hosting', terms: 'Terms', privacy: 'Privacy' }
  },
  zh: {
    nav: { homestay: '民宿', carRental: '租车', tickets: '票务', dining: '餐饮', login: '登录', wishlists: '心愿单', trips: '行程', messages: '消息' },
    search: { where: '地点', checkin: '入住', checkout: '退房', who: '人数', addGuests: '添加客人', search: '搜索' },
    hero: { title: '探索泰国独特住宿', subtitle: '预订豪华别墅、精美公寓和度假屋' },
    listing: { perNight: '晚', superhost: '超赞房东', reviews: '条评价' },
    footer: { about: '关于我们', support: '帮助', hosting: '出租房源', terms: '服务条款', privacy: '隐私政策' }
  }
};

export function detectLanguage(): Language {
  if (typeof navigator === 'undefined') return 'en';
  const browserLang = navigator.language || (navigator as any).userLanguage || 'en';
  const langCode = browserLang.toLowerCase().split('-')[0];
  const langMap: { [key: string]: Language } = { 'th': 'th', 'en': 'en', 'zh': 'zh' };
  return langMap[langCode] || 'en';
}

export function getTranslations(lang: Language) {
  return (translations as any)[lang] || translations.en;
}
