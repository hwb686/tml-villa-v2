export type Language = 'th' | 'en' | 'zh';

const translations = {
  th: {
    // 导航
    nav: { 
      homestay: 'ที่พัก', 
      carRental: 'เช่ารถ', 
      tickets: 'ตั๋ว', 
      dining: 'ร้านอาหาร', 
      login: 'เข้าสู่ระบบ', 
      wishlists: 'รายการโปรด', 
      trips: 'การเดินทาง', 
      messages: 'ข้อความ',
      ticketBooking: 'จองตั๋ว'
    },
    // 搜索
    search: { 
      where: 'ที่ไหน', 
      checkin: 'เช็คอิน', 
      checkout: 'เช็คเอาท์', 
      who: 'ใคร', 
      addGuests: 'เพิ่มผู้เข้าพัก', 
      search: 'ค้นหา',
      searchDestination: 'ค้นหาจุดหมายปลายทาง',
      addDates: 'เพิ่มวันที่'
    },
    // 首页
    hero: { 
      title: 'สำรวจที่พักสุดพิเศษในประเทศไทย', 
      subtitle: 'จองวิลล่าหรู อพาร์ตเมนต์สวย และบ้านพักตากอากาศ' 
    },
    listing: { 
      perNight: '/คืน', 
      superhost: 'ซูเปอร์โฮสต์', 
      reviews: 'รีวิว',
      noReviews: 'ยังไม่มีรีวิว'
    },
    // 页脚
    footer: { 
      about: 'เกี่ยวกับเรา', 
      support: 'ช่วยเหลือ', 
      hosting: 'เป็นเจ้าของที่พัก', 
      terms: 'ข้อกำหนด', 
      privacy: 'ความเป็นส่วนตัว',
      aboutUs: 'เกี่ยวกับเรา',
      contact: 'ติดต่อเรา',
      helpCenter: 'ศูนย์ช่วยเหลือ'
    },
    // 用户菜单
    userMenu: {
      personalCenter: 'ศูนย์ส่วนตัว',
      myOrders: 'คำสั่งซื้อของฉัน',
      myFavorites: 'รายการโปรดของฉัน',
      logout: 'ออกจากระบบ',
      loginRegister: 'เข้าสู่ระบบ / สมัครสมาชิก',
      mealRegistration: 'ลงทะเบียนอาหาร',
      carRegistration: 'ลงทะเบียนเช่ารถ',
      ticketBooking: 'จองตั๋ว',
      helpCenter: 'ศูนย์ช่วยเหลือ'
    },
    // 登录/注册
    auth: {
      login: 'เข้าสู่ระบบ',
      register: 'สมัครสมาชิก',
      email: 'อีเมล',
      password: 'รหัสผ่าน',
      confirmPassword: 'ยืนยันรหัสผ่าน',
      username: 'ชื่อผู้ใช้',
      phone: 'โทรศัพท์',
      forgotPassword: 'ลืมรหัสผ่าน?',
      noAccount: 'ยังไม่มีบัญชี?',
      hasAccount: 'มีบัญชีแล้ว?',
      registerNow: 'สมัครสมาชิกเลย',
      loginNow: 'เข้าสู่ระบบเลย',
      loginSuccess: 'เข้าสู่ระบบสำเร็จ',
      registerSuccess: 'สมัครสมาชิกสำเร็จ',
      welcomeBack: 'ยินดีต้อนรับกลับมา',
      joinUs: 'เข้าร่วมกับเรา',
      orContinueWith: 'หรือดำเนินการต่อด้วย'
    },
    // 用户中心
    userCenter: {
      myAccount: 'บัญชีของฉัน',
      orders: 'คำสั่งซื้อ',
      favorites: 'รายการโปรด',
      reviews: 'รีวิว',
      notifications: 'การแจ้งเตือน',
      settings: 'ตั้งค่า',
      profile: 'โปรไฟล์',
      editProfile: 'แก้ไขโปรไฟล์',
      changePassword: 'เปลี่ยนรหัสผ่าน',
      save: 'บันทึก',
      cancel: 'ยกเลิก',
      confirm: 'ยืนยัน',
      delete: 'ลบ',
      edit: 'แก้ไข',
      noOrders: 'ยังไม่มีคำสั่งซื้อ',
      noFavorites: 'ยังไม่มีรายการโปรด',
      noReviews: 'ยังไม่มีรีวิว',
      noNotifications: 'ยังไม่มีการแจ้งเตือน',
      markAsRead: 'ทำเครื่องหมายว่าอ่านแล้ว',
      deleteAll: 'ลบทั้งหมด'
    },
    // 搜索页面
    searchPage: {
      searchResults: 'ผลการค้นหา',
      filters: 'ตัวกรอง',
      sortBy: 'เรียงตาม',
      priceLowToHigh: 'ราคา: ต่ำไปสูง',
      priceHighToLow: 'ราคา: สูงไปต่ำ',
      rating: 'คะแนน',
      distance: 'ระยะทาง',
      priceRange: 'ช่วงราคา',
      roomType: 'ประเภทห้อง',
      amenities: 'สิ่งอำนวยความสะดวก',
      clearFilters: 'ล้างตัวกรอง',
      applyFilters: 'ใช้ตัวกรอง',
      resultsCount: 'พบ {count} ผลลัพธ์',
      noResults: 'ไม่พบผลลัพธ์',
      tryAdjusting: 'ลองปรับตัวกรองการค้นหาของคุณ'
    },
    // 民宿详情
    homestayDetail: {
      back: 'กลับ',
      share: 'แชร์',
      save: 'บันทึก',
      photos: 'รูปภาพ',
      hostedBy: 'โดย {name}',
      guests: 'ผู้เข้าพัก',
      bedrooms: 'ห้องนอน',
      beds: 'เตียง',
      bathrooms: 'ห้องน้ำ',
      amenities: 'สิ่งอำนวยความสะดวก',
      description: 'รายละเอียด',
      location: 'ที่ตั้ง',
      reviews: 'รีวิว',
      bookNow: 'จองเลย',
      checkIn: 'เช็คอิน',
      checkOut: 'เช็คเอาท์',
      guests: 'ผู้เข้าพัก',
      total: 'รวม',
      perNight: 'ต่อคืน',
      serviceFee: 'ค่าบริการ',
      cleaningFee: 'ค่าทำความสะอาด',
      nights: 'คืน',
      selectDates: 'เลือกวันที่',
      addGuests: 'เพิ่มผู้เข้าพัก',
      instantBook: 'จองทันที',
      contactHost: 'ติดต่อเจ้าของ',
      aboutThisPlace: 'เกี่ยวกับที่นี่',
      whatThisPlaceOffers: 'สิ่งที่ที่นี่มอบให้',
      whereYouWillBe: 'คุณจะอยู่ที่ไหน',
      houseRules: 'กฎของที่พัก',
      cancellationPolicy: 'นโยบายการยกเลิก',
      safetyProperty: 'ความปลอดภัยและทรัพย์สิน',
      availability: 'ความพร้อมใช้งาน'
    },
    // 订单
    orders: {
      myOrders: 'คำสั่งซื้อของฉัน',
      orderNumber: 'หมายเลขคำสั่งซื้อ',
      status: 'สถานะ',
      pending: 'รอดำเนินการ',
      confirmed: 'ยืนยันแล้ว',
      completed: 'เสร็จสมบูรณ์',
      cancelled: 'ยกเลิก',
      bookingDate: 'วันที่จอง',
      totalAmount: 'ยอดรวม',
      viewDetails: 'ดูรายละเอียด',
      bookAgain: 'จองอีกครั้ง',
      writeReview: 'เขียนรีวิว',
      cancelOrder: 'ยกเลิกคำสั่งซื้อ',
      orderDetails: 'รายละเอียดคำสั่งซื้อ'
    },
    // 通用
    common: {
      loading: 'กำลังโหลด...',
      error: 'เกิดข้อผิดพลาด',
      retry: 'ลองใหม่',
      save: 'บันทึก',
      cancel: 'ยกเลิก',
      confirm: 'ยืนยัน',
      delete: 'ลบ',
      edit: 'แก้ไข',
      add: 'เพิ่ม',
      remove: 'ลบ',
      close: 'ปิด',
      open: 'เปิด',
      next: 'ถัดไป',
      previous: 'ก่อนหน้า',
      submit: 'ส่ง',
      send: 'ส่ง',
      search: 'ค้นหา',
      filter: 'กรอง',
      sort: 'เรียง',
      view: 'ดู',
      showMore: 'แสดงเพิ่มเติม',
      showLess: 'แสดงน้อยลง',
      readMore: 'อ่านเพิ่มเติม',
      seeAll: 'ดูทั้งหมด',
      free: 'ฟรี',
      night: 'คืน',
      guest: 'ผู้เข้าพัก',
      guests: 'ผู้เข้าพัก',
      adult: 'ผู้ใหญ่',
      adults: 'ผู้ใหญ่',
      child: 'เด็ก',
      children: 'เด็ก',
      infant: 'ทารก',
      infants: 'ทารก',
      pet: 'สัตว์เลี้ยง',
      pets: 'สัตว์เลี้ยง'
    },
    // 租车
    carRental: {
      title: 'เช่ารถ',
      subtitle: 'เลือกรถที่เหมาะกับคุณ',
      withDriver: 'พร้อมคนขับ',
      selfDrive: 'ขับเอง',
      pickUpDate: 'วันรับรถ',
      returnDate: 'วันคืนรถ',
      pickUpLocation: 'สถานที่รับรถ',
      driverFee: 'ค่าคนขับ',
      perDay: 'ต่อวัน',
      bookNow: 'จองเลย',
      available: 'พร้อมใช้งาน',
      notAvailable: 'ไม่พร้อมใช้งาน'
    },
    // 餐饮
    dining: {
      title: 'ร้านอาหาร',
      subtitle: 'สั่งอาหารอร่อยๆ',
      menu: 'เมนู',
      addToCart: 'เพิ่มลงตะกร้า',
      cart: 'ตะกร้า',
      checkout: 'ชำระเงิน',
      deliveryAddress: 'ที่อยู่จัดส่ง',
      deliveryTime: 'เวลาจัดส่ง',
      specialInstructions: 'คำแนะนำพิเศษ',
      subtotal: 'ย่อย',
      deliveryFee: 'ค่าจัดส่ง',
      total: 'รวม',
      placeOrder: 'สั่งซื้อ'
    },
    // 票务
    tickets: {
      title: 'ตั๋ว',
      subtitle: 'จองตั๋วกิจกรรมและสถานที่ท่องเที่ยว',
      selectDate: 'เลือกวันที่',
      selectTime: 'เลือกเวลา',
      quantity: 'จำนวน',
      adultTicket: 'ตั๋วผู้ใหญ่',
      childTicket: 'ตั๋วเด็ก',
      seniorTicket: 'ตั๋วผู้สูงอายุ',
      studentTicket: 'ตั๋วนักเรียน',
      addToCart: 'เพิ่มลงตะกร้า',
      buyNow: 'ซื้อเลย'
    },
    // 错误页面
    error: {
      notFound: 'ไม่พบหน้านี้',
      notFoundMessage: 'หน้าที่คุณกำลังค้นหาอาจถูกลบ เปลี่ยนชื่อ หรือไม่มีอยู่ชั่วคราว',
      goHome: 'กลับหน้าหลัก',
      somethingWrong: 'เกิดข้อผิดพลาดบางอย่าง',
      tryAgain: 'โปรดลองอีกครั้ง'
    }
  },
  en: {
    // Navigation
    nav: { 
      homestay: 'Homestay', 
      carRental: 'Car Rental', 
      tickets: 'Tickets', 
      dining: 'Dining', 
      login: 'Log in', 
      wishlists: 'Wishlists', 
      trips: 'Trips', 
      messages: 'Messages',
      ticketBooking: 'Ticket Booking'
    },
    // Search
    search: { 
      where: 'Where', 
      checkin: 'Check in', 
      checkout: 'Check out', 
      who: 'Who', 
      addGuests: 'Add guests', 
      search: 'Search',
      searchDestination: 'Search destinations',
      addDates: 'Add dates'
    },
    // Home
    hero: { 
      title: 'Discover Unique Stays in Thailand', 
      subtitle: 'Book luxury villas, beautiful apartments, and vacation homes' 
    },
    listing: { 
      perNight: 'night', 
      superhost: 'Superhost', 
      reviews: 'reviews',
      noReviews: 'No reviews yet'
    },
    // Footer
    footer: { 
      about: 'About', 
      support: 'Support', 
      hosting: 'Hosting', 
      terms: 'Terms', 
      privacy: 'Privacy',
      aboutUs: 'About Us',
      contact: 'Contact Us',
      helpCenter: 'Help Center'
    },
    // User Menu
    userMenu: {
      personalCenter: 'Personal Center',
      myOrders: 'My Orders',
      myFavorites: 'My Favorites',
      logout: 'Logout',
      loginRegister: 'Login / Register',
      mealRegistration: 'Meal Registration',
      carRegistration: 'Car Registration',
      ticketBooking: 'Ticket Booking',
      helpCenter: 'Help Center'
    },
    // Auth
    auth: {
      login: 'Login',
      register: 'Register',
      email: 'Email',
      password: 'Password',
      confirmPassword: 'Confirm Password',
      username: 'Username',
      phone: 'Phone',
      forgotPassword: 'Forgot password?',
      noAccount: "Don't have an account?",
      hasAccount: 'Already have an account?',
      registerNow: 'Register now',
      loginNow: 'Login now',
      loginSuccess: 'Login successful',
      registerSuccess: 'Registration successful',
      welcomeBack: 'Welcome back',
      joinUs: 'Join us',
      orContinueWith: 'Or continue with'
    },
    // User Center
    userCenter: {
      myAccount: 'My Account',
      orders: 'Orders',
      favorites: 'Favorites',
      reviews: 'Reviews',
      notifications: 'Notifications',
      settings: 'Settings',
      profile: 'Profile',
      editProfile: 'Edit Profile',
      changePassword: 'Change Password',
      save: 'Save',
      cancel: 'Cancel',
      confirm: 'Confirm',
      delete: 'Delete',
      edit: 'Edit',
      noOrders: 'No orders yet',
      noFavorites: 'No favorites yet',
      noReviews: 'No reviews yet',
      noNotifications: 'No notifications yet',
      markAsRead: 'Mark as read',
      deleteAll: 'Delete all'
    },
    // Search Page
    searchPage: {
      searchResults: 'Search Results',
      filters: 'Filters',
      sortBy: 'Sort by',
      priceLowToHigh: 'Price: Low to High',
      priceHighToLow: 'Price: High to Low',
      rating: 'Rating',
      distance: 'Distance',
      priceRange: 'Price Range',
      roomType: 'Room Type',
      amenities: 'Amenities',
      clearFilters: 'Clear Filters',
      applyFilters: 'Apply Filters',
      resultsCount: '{count} results found',
      noResults: 'No results found',
      tryAdjusting: 'Try adjusting your search filters'
    },
    // Homestay Detail
    homestayDetail: {
      back: 'Back',
      share: 'Share',
      save: 'Save',
      photos: 'Photos',
      hostedBy: 'Hosted by {name}',
      guests: 'guests',
      bedrooms: 'bedrooms',
      beds: 'beds',
      bathrooms: 'bathrooms',
      amenities: 'Amenities',
      description: 'Description',
      location: 'Location',
      reviews: 'Reviews',
      bookNow: 'Book now',
      checkIn: 'Check in',
      checkOut: 'Check out',
      guests: 'Guests',
      total: 'Total',
      perNight: 'per night',
      serviceFee: 'Service fee',
      cleaningFee: 'Cleaning fee',
      nights: 'nights',
      selectDates: 'Select dates',
      addGuests: 'Add guests',
      instantBook: 'Instant Book',
      contactHost: 'Contact host',
      aboutThisPlace: 'About this place',
      whatThisPlaceOffers: 'What this place offers',
      whereYouWillBe: 'Where you\'ll be',
      houseRules: 'House rules',
      cancellationPolicy: 'Cancellation policy',
      safetyProperty: 'Safety & property',
      availability: 'Availability'
    },
    // Orders
    orders: {
      myOrders: 'My Orders',
      orderNumber: 'Order Number',
      status: 'Status',
      pending: 'Pending',
      confirmed: 'Confirmed',
      completed: 'Completed',
      cancelled: 'Cancelled',
      bookingDate: 'Booking Date',
      totalAmount: 'Total Amount',
      viewDetails: 'View Details',
      bookAgain: 'Book Again',
      writeReview: 'Write a Review',
      cancelOrder: 'Cancel Order',
      orderDetails: 'Order Details'
    },
    // Common
    common: {
      loading: 'Loading...',
      error: 'Error',
      retry: 'Retry',
      save: 'Save',
      cancel: 'Cancel',
      confirm: 'Confirm',
      delete: 'Delete',
      edit: 'Edit',
      add: 'Add',
      remove: 'Remove',
      close: 'Close',
      open: 'Open',
      next: 'Next',
      previous: 'Previous',
      submit: 'Submit',
      send: 'Send',
      search: 'Search',
      filter: 'Filter',
      sort: 'Sort',
      view: 'View',
      showMore: 'Show more',
      showLess: 'Show less',
      readMore: 'Read more',
      seeAll: 'See all',
      free: 'Free',
      night: 'night',
      guest: 'guest',
      guests: 'guests',
      adult: 'adult',
      adults: 'adults',
      child: 'child',
      children: 'children',
      infant: 'infant',
      infants: 'infants',
      pet: 'pet',
      pets: 'pets'
    },
    // Car Rental
    carRental: {
      title: 'Car Rental',
      subtitle: 'Choose the perfect car for you',
      withDriver: 'With Driver',
      selfDrive: 'Self Drive',
      pickUpDate: 'Pick-up Date',
      returnDate: 'Return Date',
      pickUpLocation: 'Pick-up Location',
      driverFee: 'Driver fee',
      perDay: 'per day',
      bookNow: 'Book now',
      available: 'Available',
      notAvailable: 'Not available'
    },
    // Dining
    dining: {
      title: 'Dining',
      subtitle: 'Order delicious food',
      menu: 'Menu',
      addToCart: 'Add to cart',
      cart: 'Cart',
      checkout: 'Checkout',
      deliveryAddress: 'Delivery Address',
      deliveryTime: 'Delivery Time',
      specialInstructions: 'Special Instructions',
      subtotal: 'Subtotal',
      deliveryFee: 'Delivery Fee',
      total: 'Total',
      placeOrder: 'Place Order'
    },
    // Tickets
    tickets: {
      title: 'Tickets',
      subtitle: 'Book tickets for activities and attractions',
      selectDate: 'Select Date',
      selectTime: 'Select Time',
      quantity: 'Quantity',
      adultTicket: 'Adult Ticket',
      childTicket: 'Child Ticket',
      seniorTicket: 'Senior Ticket',
      studentTicket: 'Student Ticket',
      addToCart: 'Add to cart',
      buyNow: 'Buy now'
    },
    // Error
    error: {
      notFound: 'Page not found',
      notFoundMessage: 'The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.',
      goHome: 'Go Home',
      somethingWrong: 'Something went wrong',
      tryAgain: 'Please try again'
    }
  },
  zh: {
    // 导航
    nav: { 
      homestay: '民宿', 
      carRental: '租车', 
      tickets: '票务', 
      dining: '餐饮', 
      login: '登录', 
      wishlists: '心愿单', 
      trips: '行程', 
      messages: '消息',
      ticketBooking: '票务预订'
    },
    // 搜索
    search: { 
      where: '地点', 
      checkin: '入住', 
      checkout: '退房', 
      who: '人数', 
      addGuests: '添加客人', 
      search: '搜索',
      searchDestination: '搜索目的地',
      addDates: '添加日期'
    },
    // 首页
    hero: { 
      title: '探索泰国独特住宿', 
      subtitle: '预订豪华别墅、精美公寓和度假屋' 
    },
    listing: { 
      perNight: '晚', 
      superhost: '超赞房东', 
      reviews: '条评价',
      noReviews: '暂无评价'
    },
    // 页脚
    footer: { 
      about: '关于', 
      support: '支持', 
      hosting: '出租房源', 
      terms: '服务条款', 
      privacy: '隐私政策',
      aboutUs: '关于我们',
      contact: '联系我们',
      helpCenter: '帮助中心'
    },
    // 用户菜单
    userMenu: {
      personalCenter: '个人中心',
      myOrders: '我的订单',
      myFavorites: '我的收藏',
      logout: '退出登录',
      loginRegister: '登录 / 注册',
      mealRegistration: '订餐登记',
      carRegistration: '租车登记',
      ticketBooking: '票务预订',
      helpCenter: '帮助中心'
    },
    // 登录/注册
    auth: {
      login: '登录',
      register: '注册',
      email: '邮箱',
      password: '密码',
      confirmPassword: '确认密码',
      username: '用户名',
      phone: '手机号',
      forgotPassword: '忘记密码？',
      noAccount: '还没有账号？',
      hasAccount: '已有账号？',
      registerNow: '立即注册',
      loginNow: '立即登录',
      loginSuccess: '登录成功',
      registerSuccess: '注册成功',
      welcomeBack: '欢迎回来',
      joinUs: '加入我们',
      orContinueWith: '或通过以下方式继续'
    },
    // 用户中心
    userCenter: {
      myAccount: '我的账户',
      orders: '订单',
      favorites: '收藏',
      reviews: '评价',
      notifications: '通知',
      settings: '设置',
      profile: '个人资料',
      editProfile: '编辑资料',
      changePassword: '修改密码',
      save: '保存',
      cancel: '取消',
      confirm: '确认',
      delete: '删除',
      edit: '编辑',
      noOrders: '暂无订单',
      noFavorites: '暂无收藏',
      noReviews: '暂无评价',
      noNotifications: '暂无通知',
      markAsRead: '标记为已读',
      deleteAll: '全部删除'
    },
    // 搜索页面
    searchPage: {
      searchResults: '搜索结果',
      filters: '筛选',
      sortBy: '排序方式',
      priceLowToHigh: '价格：从低到高',
      priceHighToLow: '价格：从高到低',
      rating: '评分',
      distance: '距离',
      priceRange: '价格范围',
      roomType: '房型',
      amenities: '设施',
      clearFilters: '清除筛选',
      applyFilters: '应用筛选',
      resultsCount: '找到 {count} 个结果',
      noResults: '未找到结果',
      tryAdjusting: '尝试调整您的搜索条件'
    },
    // 民宿详情
    homestayDetail: {
      back: '返回',
      share: '分享',
      save: '收藏',
      photos: '照片',
      hostedBy: '房东：{name}',
      guests: '位房客',
      bedrooms: '间卧室',
      beds: '张床',
      bathrooms: '间卫生间',
      amenities: '设施',
      description: '描述',
      location: '位置',
      reviews: '评价',
      bookNow: '立即预订',
      checkIn: '入住',
      checkOut: '退房',
      total: '总价',
      perNight: '每晚',
      serviceFee: '服务费',
      cleaningFee: '清洁费',
      nights: '晚',
      selectDates: '选择日期',
      addGuests: '添加房客',
      instantBook: '立即预订',
      contactHost: '联系房东',
      aboutThisPlace: '关于此房源',
      whatThisPlaceOffers: '房源设施',
      whereYouWillBe: '房源位置',
      houseRules: '入住须知',
      cancellationPolicy: '取消政策',
      safetyProperty: '安全与财产',
      availability: '可订状态'
    },
    // 订单
    orders: {
      myOrders: '我的订单',
      orderNumber: '订单号',
      status: '状态',
      pending: '待确认',
      confirmed: '已确认',
      completed: '已完成',
      cancelled: '已取消',
      bookingDate: '预订日期',
      totalAmount: '订单金额',
      viewDetails: '查看详情',
      bookAgain: '再次预订',
      writeReview: '写评价',
      cancelOrder: '取消订单',
      orderDetails: '订单详情'
    },
    // 通用
    common: {
      loading: '加载中...',
      error: '出错了',
      retry: '重试',
      save: '保存',
      cancel: '取消',
      confirm: '确认',
      delete: '删除',
      edit: '编辑',
      add: '添加',
      remove: '移除',
      close: '关闭',
      open: '打开',
      next: '下一步',
      previous: '上一步',
      submit: '提交',
      send: '发送',
      search: '搜索',
      filter: '筛选',
      sort: '排序',
      view: '查看',
      showMore: '显示更多',
      showLess: '显示更少',
      readMore: '阅读更多',
      seeAll: '查看全部',
      free: '免费',
      night: '晚',
      guest: '位房客',
      guests: '位房客',
      adult: '成人',
      adults: '成人',
      child: '儿童',
      children: '儿童',
      infant: '婴儿',
      infants: '婴儿',
      pet: '宠物',
      pets: '宠物'
    },
    // 租车
    carRental: {
      title: '租车服务',
      subtitle: '选择适合您的车辆',
      withDriver: '配司机',
      selfDrive: '自驾',
      pickUpDate: '取车日期',
      returnDate: '还车日期',
      pickUpLocation: '取车地点',
      driverFee: '司机费用',
      perDay: '每天',
      bookNow: '立即预订',
      available: '可预订',
      notAvailable: '不可预订'
    },
    // 餐饮
    dining: {
      title: '餐饮服务',
      subtitle: '订购美味佳肴',
      menu: '菜单',
      addToCart: '加入购物车',
      cart: '购物车',
      checkout: '去结算',
      deliveryAddress: '配送地址',
      deliveryTime: '配送时间',
      specialInstructions: '特殊要求',
      subtotal: '小计',
      deliveryFee: '配送费',
      total: '总计',
      placeOrder: '提交订单'
    },
    // 票务
    tickets: {
      title: '票务服务',
      subtitle: '预订活动和景点门票',
      selectDate: '选择日期',
      selectTime: '选择时间',
      quantity: '数量',
      adultTicket: '成人票',
      childTicket: '儿童票',
      seniorTicket: '老人票',
      studentTicket: '学生票',
      addToCart: '加入购物车',
      buyNow: '立即购买'
    },
    // 错误页面
    error: {
      notFound: '页面未找到',
      notFoundMessage: '您查找的页面可能已被删除、重命名或暂时不可用。',
      goHome: '返回首页',
      somethingWrong: '出错了',
      tryAgain: '请重试'
    }
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

// Helper function to get nested translation
export function getNestedTranslation(obj: any, path: string): string {
  const keys = path.split('.');
  let result = obj;
  for (const key of keys) {
    if (result && typeof result === 'object' && key in result) {
      result = result[key];
    } else {
      return path; // Return path if translation not found
    }
  }
  return typeof result === 'string' ? result : path;
}
