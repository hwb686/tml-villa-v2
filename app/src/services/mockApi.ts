// Mock API Layer for TML Villa
// This provides mock data when real backend is not available

import type { 
  Homestay, Category, Order, Merchant, 
  FinanceOverview, Transaction, User 
} from './api';

// Mock Homestays Data
const mockHomestays: Homestay[] = [
  {
    id: '1',
    title: '曼谷市中心豪华公寓',
    location: '曼谷, 泰国',
    price: 3500,
    rating: 4.9,
    reviews: 128,
    images: [
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800',
      'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800',
      'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800'
    ],
    type: 'city',
    guests: 4,
    bedrooms: 2,
    beds: 2,
    bathrooms: 2,
    amenities: ['WiFi', '空调', '游泳池', '健身房', '停车场', '厨房'],
    host: { name: 'Somchai', avatar: 'https://i.pravatar.cc/150?u=1', isSuperhost: true },
    isFavorite: false,
    description: '位于曼谷市中心的豪华公寓，交通便利，设施齐全，是您度假旅行的理想选择。'
  },
  {
    id: '2',
    title: '普吉岛海景别墅',
    location: '普吉岛, 泰国',
    price: 8500,
    rating: 4.8,
    reviews: 96,
    images: [
      'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=800',
      'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800',
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800'
    ],
    type: 'beach',
    guests: 8,
    bedrooms: 4,
    beds: 5,
    bathrooms: 3,
    amenities: ['WiFi', '空调', '私人泳池', '海景', '沙滩', 'BBQ'],
    host: { name: 'Nattaya', avatar: 'https://i.pravatar.cc/150?u=2', isSuperhost: true },
    isFavorite: true,
    description: '面朝大海的豪华别墅，拥有私人泳池和直达沙滩的通道，享受极致的海岛度假体验。'
  },
  {
    id: '3',
    title: '清迈古城传统木屋',
    location: '清迈, 泰国',
    price: 2200,
    rating: 4.7,
    reviews: 64,
    images: [
      'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800',
      'https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=800',
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800'
    ],
    type: 'cabin',
    guests: 2,
    bedrooms: 1,
    beds: 1,
    bathrooms: 1,
    amenities: ['WiFi', '风扇', '花园', '传统装饰', '早餐'],
    host: { name: 'Pim', avatar: 'https://i.pravatar.cc/150?u=3', isSuperhost: false },
    isFavorite: false,
    description: '体验泰北传统生活方式，位于清迈古城内的精致木屋，周围环绕着美丽的花园。'
  },
  {
    id: '4',
    title: '芭提雅海滨度假村',
    location: '芭提雅, 泰国',
    price: 4800,
    rating: 4.6,
    reviews: 82,
    images: [
      'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800',
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800',
      'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800'
    ],
    type: 'beach',
    guests: 6,
    bedrooms: 3,
    beds: 3,
    bathrooms: 2,
    amenities: ['WiFi', '空调', '泳池', '海景', 'SPA', '餐厅'],
    host: { name: 'Suda', avatar: 'https://i.pravatar.cc/150?u=4', isSuperhost: true },
    isFavorite: false,
    description: '芭提雅最受欢迎的度假村之一，拥有私人海滩和世界级SPA设施。'
  },
  {
    id: '5',
    title: '苏梅岛热带天堂别墅',
    location: '苏梅岛, 泰国',
    price: 12000,
    rating: 5.0,
    reviews: 45,
    images: [
      'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=800',
      'https://images.unsplash.com/photo-1602002418082-a4443e081dd1?w=800',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800'
    ],
    type: 'tropical',
    guests: 10,
    bedrooms: 5,
    beds: 6,
    bathrooms: 4,
    amenities: ['WiFi', '空调', '无边泳池', '私人厨师', '管家服务', '游艇码头'],
    host: { name: 'Vichai', avatar: 'https://i.pravatar.cc/150?u=5', isSuperhost: true },
    isFavorite: true,
    description: '苏梅岛最顶级的度假别墅，配备私人无边泳池和专属管家服务，享受极致奢华体验。'
  },
  {
    id: '6',
    title: '大城历史公园附近民宿',
    location: '大城府, 泰国',
    price: 1500,
    rating: 4.5,
    reviews: 38,
    images: [
      'https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?w=800',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800',
      'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800'
    ],
    type: 'historic',
    guests: 3,
    bedrooms: 1,
    beds: 2,
    bathrooms: 1,
    amenities: ['WiFi', '风扇', '自行车租赁', '旅游咨询'],
    host: { name: 'Manee', avatar: 'https://i.pravatar.cc/150?u=6', isSuperhost: false },
    isFavorite: false,
    description: '探索泰国古都大城的最佳住宿选择，步行即可到达历史公园和世界文化遗产。'
  }
];

// Mock Categories Data
let mockCategories: Category[] = [
  { id: '1', label: { zh: '全部', en: 'All', th: 'ทั้งหมด' }, icon: 'home', sortOrder: 1, isActive: true },
  { id: '2', label: { zh: '海景', en: 'Beach', th: 'ชายหาด' }, icon: 'waves', sortOrder: 2, isActive: true },
  { id: '3', label: { zh: '城市', en: 'City', th: 'เมือง' }, icon: 'building', sortOrder: 3, isActive: true },
  { id: '4', label: { zh: '别墅', en: 'Villa', th: 'วิลล่า' }, icon: 'castle', sortOrder: 4, isActive: true },
  { id: '5', label: { zh: '豪华', en: 'Luxury', th: 'หรูหรา' }, icon: 'crown', sortOrder: 5, isActive: true },
  { id: '6', label: { zh: '木屋', en: 'Cabin', th: 'กระท่อม' }, icon: 'trees', sortOrder: 6, isActive: true },
  { id: '7', label: { zh: '热带', en: 'Tropical', th: 'เขตร้อน' }, icon: 'sun', sortOrder: 7, isActive: true },
  { id: '8', label: { zh: '历史', en: 'Historic', th: 'ประวัติศาสตร์' }, icon: 'castle', sortOrder: 8, isActive: true }
];

// Mock Users Data
let mockUsers: User[] = [
  { id: 'U001', name: '张三', email: 'zhangsan@example.com', avatar: 'https://i.pravatar.cc/150?u=10', phone: '+86 138****1234', isHost: false },
  { id: 'U002', name: '李四', email: 'lisi@example.com', avatar: 'https://i.pravatar.cc/150?u=11', phone: '+86 139****5678', isHost: false },
  { id: 'U003', name: '王五', email: 'wangwu@example.com', avatar: 'https://i.pravatar.cc/150?u=12', phone: '+86 137****9012', isHost: true }
];

// Mock Orders Data
let mockOrders: Order[] = [
  { id: 'O001', type: 'homestay', userId: 'U001', userName: '张三', itemName: '曼谷市中心豪华公寓', totalPrice: 10500, status: 'completed', createdAt: '2024-06-01' },
  { id: 'O002', type: 'homestay', userId: 'U002', userName: '李四', itemName: '普吉岛海景别墅', totalPrice: 25500, status: 'confirmed', createdAt: '2024-06-05' },
  { id: 'O003', type: 'car', userId: 'U001', userName: '张三', itemName: '丰田凯美瑞租车3天', totalPrice: 4500, status: 'pending', createdAt: '2024-06-10' },
  { id: 'O004', type: 'ticket', userId: 'U003', userName: '王五', itemName: '大皇宫门票', totalPrice: 1500, status: 'completed', createdAt: '2024-06-12' },
  { id: 'O005', type: 'dining', userId: 'U002', userName: '李四', itemName: '蓝象餐厅预订', totalPrice: 3200, status: 'pending', createdAt: '2024-06-15' }
];

// Mock Merchants Data
let mockMerchants: Merchant[] = [
  { id: 'M001', type: 'homestay', name: '曼谷精品民宿', contact: '陈经理', phone: '+66 81****1234', email: 'bangkok@example.com', status: 'active', createdAt: '2024-01-01' },
  { id: 'M002', type: 'car', name: '普吉岛租车服务', contact: '李经理', phone: '+66 82****5678', email: 'phuket@example.com', status: 'active', createdAt: '2024-02-01' },
  { id: 'M003', type: 'ticket', name: '泰国景点票务', contact: '王经理', phone: '+66 83****9012', email: 'tickets@example.com', status: 'pending', createdAt: '2024-03-01' },
  { id: 'M004', type: 'dining', name: '曼谷美食餐厅', contact: '张经理', phone: '+66 84****3456', email: 'dining@example.com', status: 'active', createdAt: '2024-04-01' }
];

// Mock Finance Data
const mockFinanceOverview: FinanceOverview = {
  totalRevenue: 1250000,
  totalOrders: 456,
  pendingWithdrawals: 85000,
  monthlyGrowth: 12.5
};

const mockTransactions: Transaction[] = [
  { id: 'T001', type: 'income', amount: 10500, description: '订单O001收入', createdAt: '2024-06-01' },
  { id: 'T002', type: 'income', amount: 25500, description: '订单O002收入', createdAt: '2024-06-05' },
  { id: 'T003', type: 'expense', amount: 5000, description: '商家提现', createdAt: '2024-06-08' },
  { id: 'T004', type: 'income', amount: 1500, description: '订单O004收入', createdAt: '2024-06-12' },
  { id: 'T005', type: 'expense', amount: 3000, description: '服务器费用', createdAt: '2024-06-15' }
];

// Mock API implementations
export const mockHomestayApi = {
  getAll: async (params?: { category?: string }) => {
    await delay(300);
    let result = [...mockHomestays];
    if (params?.category && params.category !== 'all') {
      result = result.filter(h => h.type === params.category);
    }
    return { data: result, success: true };
  },
  
  getById: async (id: string) => {
    await delay(200);
    const item = mockHomestays.find(h => h.id === id);
    if (!item) throw new Error('Homestay not found');
    return { data: item, success: true };
  },
  
  create: async (data: any) => {
    await delay(300);
    const newItem = { ...data, id: Date.now().toString() };
    mockHomestays.push(newItem);
    return { data: newItem, success: true };
  },
  
  update: async (id: string, data: any) => {
    await delay(300);
    const index = mockHomestays.findIndex(h => h.id === id);
    if (index === -1) throw new Error('Homestay not found');
    mockHomestays[index] = { ...mockHomestays[index], ...data };
    return { data: mockHomestays[index], success: true };
  },
  
  delete: async (id: string) => {
    await delay(300);
    const index = mockHomestays.findIndex(h => h.id === id);
    if (index === -1) throw new Error('Homestay not found');
    mockHomestays.splice(index, 1);
    return { data: null, success: true };
  }
};

export const mockCategoryApi = {
  getAll: async () => {
    await delay(200);
    return { data: [...mockCategories].sort((a, b) => a.sortOrder - b.sortOrder), success: true };
  },
  
  create: async (data: any) => {
    await delay(300);
    const newItem = { ...data, id: Date.now().toString(), isActive: true };
    mockCategories.push(newItem);
    return { data: newItem, success: true };
  },
  
  update: async (id: string, data: any) => {
    await delay(300);
    const index = mockCategories.findIndex(c => c.id === id);
    if (index === -1) throw new Error('Category not found');
    mockCategories[index] = { ...mockCategories[index], ...data };
    return { data: mockCategories[index], success: true };
  },
  
  delete: async (id: string) => {
    await delay(300);
    const index = mockCategories.findIndex(c => c.id === id);
    if (index === -1) throw new Error('Category not found');
    mockCategories.splice(index, 1);
    return { data: null, success: true };
  }
};

export const mockOrderApi = {
  getAll: async (params?: { type?: string }) => {
    await delay(300);
    let result = [...mockOrders];
    if (params?.type) {
      result = result.filter(o => o.type === params.type);
    }
    return { data: result, success: true };
  },
  
  getById: async (id: string) => {
    await delay(200);
    const item = mockOrders.find(o => o.id === id);
    if (!item) throw new Error('Order not found');
    return { data: item, success: true };
  },
  
  updateStatus: async (id: string, status: string) => {
    await delay(300);
    const index = mockOrders.findIndex(o => o.id === id);
    if (index === -1) throw new Error('Order not found');
    mockOrders[index] = { ...mockOrders[index], status: status as any };
    return { data: mockOrders[index], success: true };
  }
};

export const mockMerchantApi = {
  getAll: async (params?: { type?: string }) => {
    await delay(300);
    let result = [...mockMerchants];
    if (params?.type) {
      result = result.filter(m => m.type === params.type);
    }
    return { data: result, success: true };
  },
  
  getById: async (id: string) => {
    await delay(200);
    const item = mockMerchants.find(m => m.id === id);
    if (!item) throw new Error('Merchant not found');
    return { data: item, success: true };
  },
  
  create: async (data: any) => {
    await delay(300);
    const newItem = { ...data, id: 'M' + Date.now().toString(), createdAt: new Date().toISOString().split('T')[0] };
    mockMerchants.push(newItem);
    return { data: newItem, success: true };
  },
  
  update: async (id: string, data: any) => {
    await delay(300);
    const index = mockMerchants.findIndex(m => m.id === id);
    if (index === -1) throw new Error('Merchant not found');
    mockMerchants[index] = { ...mockMerchants[index], ...data };
    return { data: mockMerchants[index], success: true };
  },
  
  delete: async (id: string) => {
    await delay(300);
    const index = mockMerchants.findIndex(m => m.id === id);
    if (index === -1) throw new Error('Merchant not found');
    mockMerchants.splice(index, 1);
    return { data: null, success: true };
  }
};

export const mockFinanceApi = {
  getOverview: async () => {
    await delay(200);
    return { data: mockFinanceOverview, success: true };
  },
  
  getTransactions: async () => {
    await delay(300);
    return { data: mockTransactions, success: true };
  },
  
  getWithdrawals: async () => {
    await delay(200);
    return { data: [], success: true };
  }
};

export const mockUserApi = {
  getMe: async () => {
    await delay(200);
    return { data: mockUsers[0], success: true };
  },
  
  login: async (_email: string, _password: string) => {
    await delay(500);
    return { data: { token: 'mock-jwt-token', user: mockUsers[0] }, success: true };
  }
};

// Helper function to simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
