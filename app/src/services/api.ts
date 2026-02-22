// API Service Layer for TML Villa
// Configure VITE_API_BASE_URL in your environment to connect to your backend
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
const FUNCTIONS_BASE = import.meta.env.VITE_SUPABASE_FUNCTIONS_URL || '';

async function callFunction<T>(name: string): Promise<ApiResponse<T>> {
  if (!FUNCTIONS_BASE) { throw new Error('functions base url not configured'); }
  const resp = await fetch(`${FUNCTIONS_BASE}/${name}`, { headers: { 'Content-Type': 'application/json' } });
  if (!resp.ok) { throw new Error(`Function ${name} failed ${resp.status}`); }
  const data = await resp.json();
  return { data, success: true };
}

interface BackendResponse<T> { code: number; data: T; msg?: string; }
interface ApiResponse<T> { data: T; success: boolean; message?: string; }

async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  let normalizedEndpoint = endpoint;
  if (!normalizedEndpoint.startsWith('/')) { normalizedEndpoint = '/' + normalizedEndpoint; }
  if (!normalizedEndpoint.startsWith('/api')) { normalizedEndpoint = '/api' + normalizedEndpoint; }
  const url = `${API_BASE_URL}${normalizedEndpoint}`;
  const response = await fetch(url, { headers: { 'Content-Type': 'application/json', ...options.headers }, ...options });
  if (!response.ok) { throw new Error(`API Error: ${response.status} ${response.statusText}`); }
  const backendResponse: BackendResponse<T> = await response.json();
  return { data: backendResponse.data, success: backendResponse.code === 200, message: backendResponse.msg };
}

// 带管理员认证的 API 调用
async function fetchAdminApi<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  const adminToken = localStorage.getItem('adminToken');
  if (!adminToken) {
    throw new Error('未登录管理员账户');
  }
  return fetchApi<T>(endpoint, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${adminToken}`,
    },
  });
}

// Homestay API
export interface HomestaySearchParams {
  category?: string;
  location?: string;
  checkIn?: string;
  checkOut?: string;
  guests?: number;
  // F017 搜索优化参数
  keyword?: string;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  amenities?: string;
  sortBy?: string;
}

export const homestayApi = {
  getAll: async (params?: HomestaySearchParams) => {
    if (FUNCTIONS_BASE) { return callFunction<Homestay[]>('get-homestays'); }
    const queryParams = new URLSearchParams();
    if (params?.category) queryParams.append('category', params.category);
    if (params?.location) queryParams.append('location', params.location);
    if (params?.checkIn) queryParams.append('checkIn', params.checkIn);
    if (params?.checkOut) queryParams.append('checkOut', params.checkOut);
    if (params?.guests) queryParams.append('guests', params.guests.toString());
    // F017 搜索优化参数
    if (params?.keyword) queryParams.append('keyword', params.keyword);
    if (params?.minPrice) queryParams.append('minPrice', params.minPrice.toString());
    if (params?.maxPrice) queryParams.append('maxPrice', params.maxPrice.toString());
    if (params?.bedrooms) queryParams.append('bedrooms', params.bedrooms.toString());
    if (params?.amenities) queryParams.append('amenities', params.amenities);
    if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
    return fetchApi<Homestay[]>(`/homestays?${queryParams.toString()}`);
  },
  getById: async (id: string) => {
    if (FUNCTIONS_BASE) {
      const resp = await fetch(`${FUNCTIONS_BASE}/get-homestay-by-id/${id}`, { headers: { 'Content-Type': 'application/json' } });
      if (!resp.ok) { throw new Error(`Failed to fetch homestay ${resp.status}`); }
      const data = await resp.json();
      return { data, success: true };
    }
    return fetchApi<Homestay>(`/homestays/${id}`);
  },
  create: (data: CreateHomestayData) => fetchApi<Homestay>('/homestays', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<CreateHomestayData>) => fetchApi<Homestay>(`/homestays/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => fetchApi<void>(`/homestays/${id}`, { method: 'DELETE' }),
  toggleFavorite: (id: string) => fetchApi<{ isFavorite: boolean }>(`/homestays/${id}/favorite`, { method: 'POST' }),
};

export const bookingApi = {
  create: (data: BookingData) => fetchApi<BookingResult>('/bookings', { method: 'POST', body: JSON.stringify(data) }),
  getMyBookings: () => fetchApi<Booking[]>('/bookings/my'),
  getById: (id: string) => fetchApi<BookingDetail>(`/bookings/${id}`),
  cancel: (id: string) => fetchApi<CancelResult>(`/bookings/${id}/cancel`, { method: 'PUT' }),
  // 以下方法需要管理员权限
  confirm: (id: string) => fetchAdminApi<ConfirmResult>(`/bookings/${id}/confirm`, { method: 'PUT' }),
};

export const stockApi = {
  get: (homestayId: string, params: { startDate?: string; endDate?: string; month?: string }) => {
    const queryParams = new URLSearchParams();
    if (params.month) queryParams.append('month', params.month);
    if (params.startDate) queryParams.append('startDate', params.startDate);
    if (params.endDate) queryParams.append('endDate', params.endDate);
    return fetchApi<StockData>(`/homestays/${homestayId}/stock?${queryParams.toString()}`);
  },
  // 以下方法需要管理员权限
  init: (homestayId: string, data: { totalStock: number; startDate?: string; endDate?: string; price?: number }) =>
    fetchAdminApi<InitStockResult>(`/homestays/${homestayId}/init-stock`, { 
      method: 'POST', 
      body: JSON.stringify(data) 
    }),
  update: (homestayId: string, date: string, data: { totalStock?: number; price?: number }) =>
    fetchAdminApi<StockDayInfo>(`/homestays/${homestayId}/stock/${date}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  batchUpdate: (homestayId: string, data: { dates: string[]; totalStock: number; price?: number }) =>
    fetchAdminApi<InitStockResult>(`/homestays/${homestayId}/batch-stock`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  cleanup: (homestayId: string) =>
    fetchAdminApi<{ count: number }>(`/homestays/${homestayId}/stock/cleanup`, {
      method: 'DELETE',
    }),
};

export const userApi = {
  login: (email: string, password: string) => fetchApi<{ token: string; user: User }>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  register: (data: RegisterData) => fetchApi<{ token: string; user: User }>('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  getMe: () => {
    const token = localStorage.getItem('userToken');
    if (!token) {
      throw new Error('未登录');
    }
    return fetchApi<User>('/auth/me', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
  },
  getAll: () => fetchApi<User[]>('/users'),
  updateProfile: (data: Partial<User>) => {
    const token = localStorage.getItem('userToken');
    if (!token) {
      throw new Error('未登录');
    }
    return fetchApi<User>('/user/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
      headers: { 'Authorization': `Bearer ${token}` }
    });
  },
  changePassword: (currentPassword: string, newPassword: string) => {
    const token = localStorage.getItem('userToken');
    if (!token) {
      throw new Error('未登录');
    }
    return fetchApi<void>('/user/password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword }),
      headers: { 'Authorization': `Bearer ${token}` }
    });
  },
};

export const adminApi = {
  login: (username: string, password: string) => fetchApi<{ token: string; admin: { id: string; username: string; name: string | null } }>('/admin/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
  changePassword: (username: string, currentPassword: string, newPassword: string) => fetchApi<void>('/admin/change-password', { method: 'POST', body: JSON.stringify({ username, currentPassword, newPassword }) }),
};

export const categoryApi = {
  getAll: async () => { if (FUNCTIONS_BASE) { return callFunction<Category[]>('get-categories'); } return fetchApi<Category[]>('/categories'); },
  create: (data: CreateCategoryData) => fetchApi<Category>('/categories', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<CreateCategoryData>) => fetchApi<Category>(`/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => fetchApi<void>(`/categories/${id}`, { method: 'DELETE' }),
};

export const orderApi = {
  getAll: (params?: { type?: string; status?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.type) queryParams.append('type', params.type);
    if (params?.status) queryParams.append('status', params.status);
    return fetchApi<Order[]>(`/orders?${queryParams.toString()}`);
  },
  getById: (id: string) => fetchApi<Order>(`/orders/${id}`),
  updateStatus: (id: string, status: string) => fetchApi<Order>(`/orders/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
};

export const merchantApi = {
  getAll: (params?: { type?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.type) queryParams.append('type', params.type);
    return fetchApi<Merchant[]>(`/merchants?${queryParams.toString()}`);
  },
  getById: (id: string) => fetchApi<Merchant>(`/merchants/${id}`),
  create: (data: CreateMerchantData) => fetchApi<Merchant>('/merchants', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<CreateMerchantData>) => fetchApi<Merchant>(`/merchants/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => fetchApi<void>(`/merchants/${id}`, { method: 'DELETE' }),
};

export const financeApi = {
  getOverview: () => fetchApi<FinanceOverview>('/finance/overview'),
  getTransactions: (params?: { startDate?: string; endDate?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    return fetchApi<Transaction[]>(`/finance/transactions?${queryParams.toString()}`);
  },
  getWithdrawals: () => fetchApi<Withdrawal[]>('/finance/withdrawals'),
  processWithdrawal: (id: string, status: 'approved' | 'rejected') => fetchApi<void>(`/finance/withdrawals/${id}`, { method: 'PUT', body: JSON.stringify({ status }) }),
};

export const mealConfigApi = {
  getAll: (params?: { mealType?: string; isActive?: boolean }) => {
    const queryParams = new URLSearchParams();
    if (params?.mealType) queryParams.append('mealType', params.mealType);
    if (params?.isActive !== undefined) queryParams.append('isActive', String(params.isActive));
    return fetchApi<MealConfig[]>(`/meal-configs?${queryParams.toString()}`);
  },
  create: (data: CreateMealConfigData) => fetchApi<MealConfig>('/meal-configs', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<CreateMealConfigData>) => fetchApi<MealConfig>(`/meal-configs/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => fetchApi<void>(`/meal-configs/${id}`, { method: 'DELETE' }),
};

export const mealApi = {
  create: (data: MealOrderData) => fetchApi<MealOrder>('/meals', { method: 'POST', body: JSON.stringify(data) }),
  getMyOrders: () => fetchApi<MealOrder[]>('/meals/my'),
  getAll: () => fetchApi<MealOrder[]>('/meals'),
  getById: (id: string) => fetchApi<MealOrder>(`/meals/${id}`),
  cancel: (id: string) => fetchApi<void>(`/meals/${id}/cancel`, { method: 'POST' }),
  updateStatus: (id: string, status: string) => fetchApi<MealOrder>(`/meals/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
};

export const ticketConfigApi = {
  getAll: (params?: { ticketType?: string; isActive?: boolean }) => {
    const queryParams = new URLSearchParams();
    if (params?.ticketType) queryParams.append('ticketType', params.ticketType);
    if (params?.isActive !== undefined) queryParams.append('isActive', String(params.isActive));
    return fetchApi<TicketConfig[]>(`/ticket-configs?${queryParams.toString()}`);
  },
  create: (data: CreateTicketConfigData) => fetchApi<TicketConfig>('/ticket-configs', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<CreateTicketConfigData>) => fetchApi<TicketConfig>(`/ticket-configs/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => fetchApi<void>(`/ticket-configs/${id}`, { method: 'DELETE' }),
};

export const ticketApi = {
  create: (data: TicketOrderData) => fetchApi<TicketOrder>('/tickets', { method: 'POST', body: JSON.stringify(data) }),
  getMyOrders: () => fetchApi<TicketOrder[]>('/tickets/my'),
  getAll: () => fetchApi<TicketOrder[]>('/tickets'),
  getById: (id: string) => fetchApi<TicketOrder>(`/tickets/${id}`),
  cancel: (id: string) => fetchApi<void>(`/tickets/${id}/cancel`, { method: 'POST' }),
  updateStatus: (id: string, status: string) => fetchApi<TicketOrder>(`/tickets/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
};

export const carConfigApi = {
  getAll: (params?: { carType?: string; isActive?: boolean }) => {
    const queryParams = new URLSearchParams();
    if (params?.carType) queryParams.append('carType', params.carType);
    if (params?.isActive !== undefined) queryParams.append('isActive', String(params.isActive));
    return fetchApi<CarConfig[]>(`/car-configs?${queryParams.toString()}`);
  },
  create: (data: CreateCarConfigData) => fetchApi<CarConfig>('/car-configs', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<CreateCarConfigData>) => fetchApi<CarConfig>(`/car-configs/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => fetchApi<void>(`/car-configs/${id}`, { method: 'DELETE' }),
};

export const carApi = {
  create: (data: CarRentalData) => fetchApi<CarRental>('/car-rentals', { method: 'POST', body: JSON.stringify(data) }),
  getMyRentals: () => fetchApi<CarRental[]>('/car-rentals/my'),
  getAll: () => fetchApi<CarRental[]>('/car-rentals'),
  getById: (id: string) => fetchApi<CarRental>(`/car-rentals/${id}`),
  cancel: (id: string) => fetchApi<void>(`/car-rentals/${id}/cancel`, { method: 'POST' }),
  updateStatus: (id: string, status: string) => fetchApi<CarRental>(`/car-rentals/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
};

// 车辆库存管理 API
export const carStockApi = {
  get: (carConfigId: string, params: { startDate?: string; endDate?: string; month?: string }) => {
    const queryParams = new URLSearchParams();
    if (params.month) queryParams.append('month', params.month);
    if (params.startDate) queryParams.append('startDate', params.startDate);
    if (params.endDate) queryParams.append('endDate', params.endDate);
    return fetchApi<CarStockData>(`/car-configs/${carConfigId}/stock?${queryParams.toString()}`);
  },
  init: (carConfigId: string, data: { totalStock: number; startDate?: string; endDate?: string; price?: number }) =>
    fetchAdminApi<CarStockResult>(`/car-configs/${carConfigId}/init-stock`, { 
      method: 'POST', 
      body: JSON.stringify(data) 
    }),
  update: (carConfigId: string, date: string, data: { totalStock?: number; price?: number }) =>
    fetchAdminApi<CarStockDayInfo>(`/car-configs/${carConfigId}/stock/${date}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  batchUpdate: (carConfigId: string, data: { dates: string[]; totalStock: number; price?: number }) =>
    fetchAdminApi<CarStockResult>(`/car-configs/${carConfigId}/batch-stock`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getUnavailableDates: (carConfigId: string, params?: { startDate?: string; endDate?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    return fetchApi<string[]>(`/car-configs/${carConfigId}/unavailable-dates?${queryParams.toString()}`);
  },
  cleanup: (carConfigId: string) =>
    fetchAdminApi<{ count: number }>(`/car-configs/${carConfigId}/stock/cleanup`, {
      method: 'DELETE',
    }),
};

// 司机管理 API
export const driverApi = {
  getAll: (params?: { status?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    return fetchApi<Driver[]>(`/drivers?${queryParams.toString()}`);
  },
  getById: (id: string) => fetchApi<Driver>(`/drivers/${id}`),
  create: (data: CreateDriverData) => fetchAdminApi<Driver>('/drivers', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<CreateDriverData>) => fetchAdminApi<Driver>(`/drivers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => fetchAdminApi<void>(`/drivers/${id}`, { method: 'DELETE' }),
};

// 司机排班 API
export const driverScheduleApi = {
  getByDriver: (driverId: string, params?: { startDate?: string; endDate?: string; month?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.month) queryParams.append('month', params.month);
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    return fetchApi<DriverScheduleData>(`/drivers/${driverId}/schedule?${queryParams.toString()}`);
  },
  setSchedule: (driverId: string, data: { dates: string[]; status: 'available' | 'booked' | 'off'; remark?: string }) =>
    fetchAdminApi<{ count: number }>(`/drivers/${driverId}/schedule`, { 
      method: 'POST', 
      body: JSON.stringify(data) 
    }),
  getAvailable: (date: string) => fetchApi<Driver[]>(`/driver-schedules/available?date=${date}`),
  getCalendar: (params?: { startDate?: string; endDate?: string; month?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.month) queryParams.append('month', params.month);
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    return fetchAdminApi<DriverCalendarData>(`/driver-schedules/calendar?${queryParams.toString()}`);
  },
};

// Types
export interface Category { id: string; label: { zh: string; en: string; th: string }; icon: string; sortOrder: number; isActive: boolean; }
export interface CreateCategoryData { label: { zh: string; en: string; th: string }; icon: string; sortOrder?: number; }
export interface Homestay { id: string; title: string; location: string; price: number; rating: number; reviews: number; images: string[]; type: string; guests: number; bedrooms: number; beds: number; bathrooms: number; amenities: string[]; host: { name: string; avatar: string; isSuperhost: boolean }; isFavorite: boolean; description?: string; coordinates?: { lat: number; lng: number }; // F017 搜索高亮字段
  highlightedTitle?: string;
  highlightedLocation?: string;
  highlightedDescription?: string;
}
export interface CreateHomestayData { title: string; location: string; price: number; images: string[]; type: string; guests: number; bedrooms: number; beds: number; bathrooms: number; amenities: string[]; description: string; }
export interface Booking { id: string; homestayId: string; homestay: Homestay; checkIn: string; checkOut: string; guests: { adults: number; children: number; infants: number }; totalPrice: number; status: 'pending' | 'confirmed' | 'cancelled' | 'completed'; createdAt: string; }
export interface BookingData { 
  homestayId: string; 
  checkIn: string; 
  checkOut: string; 
  guests?: number; 
  remark?: string;
  userId?: string;
  guestName?: string;
  guestPhone?: string;
  guestEmail?: string;
}
export interface BookingResult {
  orderId: string;
  status: string;
  needManualConfirm: boolean;
  totalPrice: number;
  checkIn: string;
  checkOut: string;
  nights: number;
  message: string;
}
export interface BookingDetail {
  id: string;
  homestayId: string;
  homestay: {
    id: string;
    title: string;
    location: string;
    images: string[];
    price: number;
    guests: number;
    bedrooms: number;
  } | null;
  userId: string;
  user: {
    id: string;
    username: string;
    email: string;
    phone: string | null;
  } | null;
  checkIn: string | null;
  checkOut: string | null;
  guests: number | null;
  totalPrice: number;
  status: string;
  createdAt: string;
}
export interface CancelResult { orderId: string; status: string; }
export interface ConfirmResult { orderId: string; status: string; }
export interface StockDayInfo { date: string; total: number; booked: number; available: number; price: number | null; }
export interface StockData { [date: string]: StockDayInfo; }
export interface InitStockResult { count: number; }
export interface User { id: string; name: string; email: string; avatar?: string; phone?: string; isHost: boolean; }
export interface RegisterData { name: string; email: string; password: string; phone?: string; }
export interface Order { id: string; type: 'homestay' | 'car' | 'ticket' | 'dining'; userId: string; userName: string; itemName: string; totalPrice: number; status: 'pending' | 'confirmed' | 'cancelled' | 'completed'; createdAt: string; }
export interface Merchant { id: string; type: 'homestay' | 'car' | 'ticket' | 'dining'; name: string; contact: string; phone: string; email: string; status: 'active' | 'inactive' | 'pending'; createdAt: string; }
export interface CreateMerchantData { type: 'homestay' | 'car' | 'ticket' | 'dining'; name: string; contact: string; phone: string; email: string; status?: 'active' | 'inactive' | 'pending'; }
export interface FinanceOverview { totalRevenue: number; totalOrders: number; pendingWithdrawals: number; monthlyGrowth: number; }
export interface Transaction { id: string; type: 'income' | 'expense'; amount: number; description: string; createdAt: string; }
export interface Withdrawal { id: string; merchantId: string; merchantName: string; amount: number; status: 'pending' | 'approved' | 'rejected'; createdAt: string; }
export interface MealConfig { id: string; name: string; description?: string; image: string; price: number; mealType: 'BREAKFAST' | 'DINNER'; isActive: boolean; sortOrder: number; createdAt: string; updatedAt: string; }
export interface CreateMealConfigData { name: string; description?: string; image: string; price: number; mealType: 'BREAKFAST' | 'DINNER'; sortOrder?: number; isActive?: boolean; }
export interface MealOrder { id: string; roomNumber: string; mealConfig: { id: string; name: string; image: string; price: number; }; mealType: 'BREAKFAST' | 'DINNER'; peopleCount: number; totalPrice: number; remark?: string; status: 'CONFIRMED' | 'CANCELLED'; createTime: string; }
export interface MealOrderData { roomNumber: string; mealConfigId: string; peopleCount: number; remark?: string; }
export interface TicketConfig { id: string; name: string; description?: string; image: string; price: number; ticketType: string; isActive: boolean; sortOrder: number; createdAt: string; updatedAt: string; }
export interface CreateTicketConfigData { name: string; description?: string; image: string; price: number; ticketType: string; sortOrder?: number; isActive?: boolean; }
export interface TicketOrder { id: string; roomNumber: string; ticketConfig: { id: string; name: string; image: string; price: number; }; quantity: number; totalPrice: number; visitDate: string | null; remark?: string; status: 'CONFIRMED' | 'CANCELLED'; createTime: string; }
export interface TicketOrderData { roomNumber: string; ticketConfigId: string; quantity: number; visitDate?: string; remark?: string; }
export interface CarConfig { id: string; name: string; description?: string; image: string; price: number; carType: string; seats: number; hasDriver?: boolean; driverFee?: number; isActive: boolean; sortOrder: number; createdAt: string; updatedAt: string; }
export interface CreateCarConfigData { name: string; description?: string; image: string; price: number; carType: string; seats: number; hasDriver?: boolean; driverFee?: number; sortOrder?: number; isActive?: boolean; }
export interface CarRental { id: string; roomNumber: string; carConfig: { id: string; name: string; image: string; price: number; carType: string; }; startTime: string; endTime: string; days: number; totalPrice: number; remark?: string; status: 'PENDING' | 'CONFIRMED' | 'CANCELLED'; needDriver?: boolean; driverId?: string; driverFee?: number; driver?: { id: string; name: string; phone: string; }; createTime: string; }
export interface CarRentalData { roomNumber: string; carConfigId: string; startTime: string; endTime: string; days: number; remark?: string; needDriver?: boolean; }

// 车辆库存相关类型
export interface CarStockDayInfo { date: string; total: number; booked: number; available: number; price: number | null; }
export interface CarStockData { [date: string]: CarStockDayInfo; }
export interface CarStockResult { count: number; }

// 司机相关类型
export interface Driver { id: string; name: string; phone: string; avatar?: string; licenseNumber?: string; status: 'active' | 'inactive' | 'on_leave'; dailyFee: number; remark?: string; createdAt: string; }
export interface CreateDriverData { name: string; phone: string; avatar?: string; licenseNumber?: string; status?: 'active' | 'inactive' | 'on_leave'; dailyFee?: number; remark?: string; }

// 司机排班相关类型
export interface DriverScheduleData { [date: string]: { status: 'available' | 'booked' | 'off'; remark?: string; }; }
export interface DriverCalendarDayData { available: Driver[]; booked: Driver[]; off: Driver[]; }
export interface DriverCalendarData { [date: string]: DriverCalendarDayData; }

// 收藏相关类型
export interface Favorite {
  id: string;
  createdAt: string;
  homestay: {
    id: string;
    title: string;
    location: string;
    price: number;
    rating: number;
    reviews: number;
    images: string[];
    type: string;
    isFavorite: boolean;
  };
}

// 收藏管理 API
export const favoriteApi = {
  getAll: () => {
    const token = localStorage.getItem('userToken');
    if (!token) {
      throw new Error('未登录');
    }
    return fetchApi<Favorite[]>('/favorites', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
  },
  add: (houseId: string) => {
    const token = localStorage.getItem('userToken');
    if (!token) {
      throw new Error('未登录');
    }
    return fetchApi<{ id: string; houseId: string; createdAt: string }>('/favorites', {
      method: 'POST',
      body: JSON.stringify({ houseId }),
      headers: { 'Authorization': `Bearer ${token}` }
    });
  },
  remove: (houseId: string) => {
    const token = localStorage.getItem('userToken');
    if (!token) {
      throw new Error('未登录');
    }
    return fetchApi<void>(`/favorites/${houseId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
  },
  toggle: (houseId: string) => {
    const token = localStorage.getItem('userToken');
    if (!token) {
      throw new Error('未登录');
    }
    return fetchApi<{ isFavorite: boolean; action: 'added' | 'removed'; favoriteId?: string }>('/favorites/toggle', {
      method: 'POST',
      body: JSON.stringify({ houseId }),
      headers: { 'Authorization': `Bearer ${token}` }
    });
  },
};

// 评价相关类型
export interface Review {
  id: string;
  rating: number;
  content: string | null;
  images: string[];
  reply: string | null;
  replyAt: string | null;
  status: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    avatar: string | null;
  };
  house: {
    id: string;
    title: string;
    image: string;
  };
  order?: {
    orderId: string;
    checkIn: string;
    checkOut: string;
  };
}

export interface CreateReviewData {
  orderId: string;
  houseId: string;
  rating: number;
  content?: string;
  images?: string[];
}

export interface ReviewListResponse {
  reviews: Review[];
  total: number;
  page: number;
  pageSize: number;
  stats: {
    average: number;
    total: number;
    distribution: { [key: number]: number };
  };
}

// 评价管理 API
export const reviewApi = {
  // 获取评价列表
  getAll: (params?: { houseId?: string; userId?: string; page?: number; pageSize?: number }) => {
    const queryParams = new URLSearchParams();
    if (params?.houseId) queryParams.append('houseId', params.houseId);
    if (params?.userId) queryParams.append('userId', params.userId);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.pageSize) queryParams.append('pageSize', params.pageSize.toString());
    return fetchApi<ReviewListResponse>(`/reviews?${queryParams.toString()}`);
  },
  
  // 获取单个评价详情
  getById: (id: string) => fetchApi<Review>(`/reviews/${id}`),
  
  // 创建评价（需要登录）
  create: (data: CreateReviewData) => {
    const token = localStorage.getItem('userToken');
    if (!token) {
      throw new Error('未登录');
    }
    return fetchApi<Review>('/reviews', {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { 'Authorization': `Bearer ${token}` }
    });
  },
  
  // 更新评价（仅限创建者）
  update: (id: string, data: { rating?: number; content?: string; images?: string[] }) => {
    const token = localStorage.getItem('userToken');
    if (!token) {
      throw new Error('未登录');
    }
    return fetchApi<Review>(`/reviews/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
      headers: { 'Authorization': `Bearer ${token}` }
    });
  },
  
  // 删除评价（仅限创建者或管理员）
  delete: (id: string) => {
    const token = localStorage.getItem('userToken');
    if (!token) {
      throw new Error('未登录');
    }
    return fetchApi<void>(`/reviews/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
  },
  
  // 管理员回复评价
  reply: (id: string, reply: string) => {
    return fetchAdminApi<Review>(`/reviews/${id}/reply`, {
      method: 'POST',
      body: JSON.stringify({ reply }),
    });
  },
  
  // 管理员更新评价状态
  updateStatus: (id: string, status: 'active' | 'hidden') => {
    return fetchAdminApi<Review>(`/reviews/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  },
};

// 通知相关类型
export interface Notification {
  id: string;
  type: 'order_confirmed' | 'order_cancelled' | 'review_reminder' | 'system';
  title: string;
  content: string;
  data: { orderId?: string; houseId?: string; [key: string]: unknown } | null;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationListResponse {
  list: Notification[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  unreadCount: number;
}

// 通知 API
export const notificationApi = {
  // 获取通知列表
  getAll: (params?: { page?: number; limit?: number; unreadOnly?: boolean }) => {
    const token = localStorage.getItem('userToken');
    if (!token) {
      throw new Error('未登录');
    }
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.unreadOnly) queryParams.append('unreadOnly', 'true');
    return fetchApi<NotificationListResponse>(`/notifications?${queryParams.toString()}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
  },
  
  // 获取未读数量
  getUnreadCount: () => {
    const token = localStorage.getItem('userToken');
    if (!token) {
      throw new Error('未登录');
    }
    return fetchApi<{ count: number }>('/notifications/unread-count', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
  },
  
  // 标记单条已读
  markAsRead: (id: string) => {
    const token = localStorage.getItem('userToken');
    if (!token) {
      throw new Error('未登录');
    }
    return fetchApi<void>(`/notifications/${id}/read`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}` }
    });
  },
  
  // 标记全部已读
  markAllAsRead: () => {
    const token = localStorage.getItem('userToken');
    if (!token) {
      throw new Error('未登录');
    }
    return fetchApi<{ count: number }>('/notifications/read-all', {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}` }
    });
  },
  
  // 删除通知
  delete: (id: string) => {
    const token = localStorage.getItem('userToken');
    if (!token) {
      throw new Error('未登录');
    }
    return fetchApi<void>(`/notifications/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
  },
  
  // 清理过期通知（管理员）
  cleanup: () => {
    return fetchAdminApi<{ count: number }>('/notifications/cleanup', {
      method: 'DELETE',
    });
  },
};

// 员工类型定义
export interface Staff {
  id: string;
  name: string;
  phone: string;
  avatar?: string;
  staffType: 'cleaner' | 'receptionist' | 'admin' | 'maintenance' | 'other';
  status: 'active' | 'inactive' | 'on_leave';
  dailyWage: number;
  idNumber?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  hireDate?: string;
  remark?: string;
  scheduleCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateStaffData {
  name: string;
  phone: string;
  avatar?: string;
  staffType: 'cleaner' | 'receptionist' | 'admin' | 'maintenance' | 'other';
  dailyWage?: number;
  idNumber?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  hireDate?: string;
  remark?: string;
}

export interface StaffSchedule {
  id: string;
  date: string;
  status: 'scheduled' | 'working' | 'completed' | 'absent' | 'off';
  workHours?: number;
  remark?: string;
}

export interface StaffCalendarData {
  [date: string]: {
    scheduled: Array<{ id: string; name: string; phone: string; staffType: string; workHours?: number }>;
    working: Array<{ id: string; name: string; phone: string; staffType: string; workHours?: number }>;
    completed: Array<{ id: string; name: string; phone: string; staffType: string; workHours?: number }>;
    absent: Array<{ id: string; name: string; phone: string; staffType: string; workHours?: number }>;
    off: Array<{ id: string; name: string; phone: string; staffType: string; workHours?: number }>;
  };
}

// 员工 API
export const staffApi = {
  // 获取员工列表
  getAll: (params?: { staffType?: string; status?: string; search?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.staffType) queryParams.append('staffType', params.staffType);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.search) queryParams.append('search', params.search);
    return fetchApi<Staff[]>(`/staffs?${queryParams.toString()}`);
  },
  
  // 获取员工详情
  getById: (id: string) => fetchApi<Staff>(`/staffs/${id}`),
  
  // 创建员工
  create: (data: CreateStaffData) => fetchAdminApi<Staff>('/staffs', { 
    method: 'POST', 
    body: JSON.stringify(data) 
  }),
  
  // 更新员工
  update: (id: string, data: Partial<CreateStaffData> & { status?: string }) => 
    fetchAdminApi<Staff>(`/staffs/${id}`, { 
      method: 'PUT', 
      body: JSON.stringify(data) 
    }),
  
  // 删除员工
  delete: (id: string) => fetchAdminApi<void>(`/staffs/${id}`, { method: 'DELETE' }),
  
  // 获取员工排班
  getSchedule: (staffId: string, params?: { startDate?: string; endDate?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    return fetchApi<StaffSchedule[]>(`/staffs/${staffId}/schedule?${queryParams.toString()}`);
  },
  
  // 设置员工排班
  setSchedule: (staffId: string, data: { schedules: Array<{ date: string; status: string; workHours?: number; remark?: string }> }) =>
    fetchAdminApi<{ count: number }>(`/staffs/${staffId}/schedule`, { 
      method: 'POST', 
      body: JSON.stringify(data) 
    }),
  
  // 获取员工排班日历
  getCalendar: (params?: { startDate?: string; endDate?: string; month?: string; staffType?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.month) queryParams.append('month', params.month);
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    if (params?.staffType) queryParams.append('staffType', params.staffType);
    return fetchAdminApi<StaffCalendarData>(`/staff-schedules/calendar?${queryParams.toString()}`);
  },
  
  // 获取员工类型
  getTypes: () => fetchApi<Array<{ value: string; label: string; labelEn: string }>>('/staffs/types'),
};

// ============================================
// 成本核算相关类型和 API
// ============================================

// 成本类型
export type CostType = 'rent' | 'utilities' | 'salary' | 'maintenance' | 'procurement' | 'other';

// 成本记录
export interface Cost {
  id: string;
  costType: CostType;
  costTypeLabel: string;
  amount: number;
  date: string;
  description?: string;
  relatedId?: string;
  relatedType?: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  remark?: string;
  createdAt: string;
  updatedAt: string;
}

// 创建成本数据
export interface CreateCostData {
  costType: CostType;
  amount: number;
  date: string;
  description?: string;
  relatedId?: string;
  relatedType?: string;
  remark?: string;
}

// 成本类型信息
export interface CostTypeInfo {
  value: CostType;
  label: string;
  color: string;
}

// 成本统计 - 按类型
export interface CostByType {
  type: CostType;
  label: string;
  color: string;
  amount: number;
  count: number;
}

// 成本统计 - 月度趋势
export interface CostMonthlyTrend {
  month: string;
  cost: number;
  income: number;
  profit: number;
}

// 成本统计 - 汇总
export interface CostStatsSummary {
  totalCost: number;
  totalIncome: number;
  profit: number;
  profitMargin: number;
}

// 成本统计数据
export interface CostStatsData {
  summary: CostStatsSummary;
  byType: CostByType[];
  monthlyTrend: CostMonthlyTrend[];
}

// 成本 API
export const costApi = {
  // 获取成本类型列表
  getTypes: () => fetchApi<CostTypeInfo[]>('/costs/types'),
  
  // 获取成本列表
  getAll: (params?: { costType?: CostType; status?: string; startDate?: string; endDate?: string; page?: number; pageSize?: number }) => {
    const queryParams = new URLSearchParams();
    if (params?.costType) queryParams.append('costType', params.costType);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    if (params?.page) queryParams.append('page', String(params.page));
    if (params?.pageSize) queryParams.append('pageSize', String(params.pageSize));
    return fetchApi<{ list: Cost[]; pagination: { page: number; pageSize: number; total: number; totalPages: number } }>(`/costs?${queryParams.toString()}`);
  },
  
  // 获取成本详情
  getById: (id: string) => fetchApi<Cost>(`/costs/${id}`),
  
  // 创建成本
  create: (data: CreateCostData) => fetchAdminApi<Cost>('/costs', { 
    method: 'POST', 
    body: JSON.stringify(data) 
  }),
  
  // 更新成本
  update: (id: string, data: Partial<CreateCostData> & { status?: string }) => 
    fetchAdminApi<Cost>(`/costs/${id}`, { 
      method: 'PUT', 
      body: JSON.stringify(data) 
    }),
  
  // 删除成本
  delete: (id: string) => fetchAdminApi<void>(`/costs/${id}`, { method: 'DELETE' }),
  
  // 获取成本统计
  getStats: (params?: { startDate?: string; endDate?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    return fetchApi<CostStatsData>(`/costs/stats?${queryParams.toString()}`);
  },
};

// =====================================================
// 运营报表 API - F014
// =====================================================

// 日期范围
export interface DateRange {
  start: string;
  end: string;
}

// 综合报表概览
export interface ReportOverview {
  period: DateRange;
  revenue: {
    total: number;
    homestay: number;
    meal: number;
    car: number;
    ticket: number;
  };
  cost: {
    total: number;
    profit: number;
    profitMargin: number;
  };
  orders: {
    total: number;
    homestay: number;
    meal: number;
    car: number;
    ticket: number;
    statusDistribution: {
      pending: number;
      confirmed: number;
      completed: number;
      cancelled: number;
    };
    typeDistribution: {
      homestay: number;
      car: number;
      ticket: number;
      dining: number;
    };
  };
  users: {
    newUsers: number;
    totalHomestays: number;
  };
}

// 收入趋势数据
export interface RevenueTrendItem {
  date: string;
  homestay: number;
  meal: number;
  car: number;
  ticket: number;
  total: number;
}

// 收入报表
export interface RevenueReport {
  period: DateRange;
  groupBy: string;
  trend: RevenueTrendItem[];
  summary: {
    totalRevenue: number;
    avgDaily: number;
  };
}

// 订单统计类型
export interface OrderStatusCount {
  pending: number;
  confirmed: number;
  completed: number;
  cancelled: number;
}

export interface OrderTypeStats {
  count: number;
  status: OrderStatusCount;
}

export interface OrderTrendItem {
  date: string;
  homestay: number;
  meal: number;
  car: number;
  ticket: number;
  total: number;
}

// 订单报表
export interface OrderReport {
  period: DateRange;
  total: number;
  byType: {
    homestay: OrderTypeStats;
    meal: OrderTypeStats;
    car: OrderTypeStats;
    ticket: OrderTypeStats;
  };
  trend: OrderTrendItem[];
}

// 用户趋势数据
export interface UserTrendItem {
  date: string;
  count: number;
  cumulative: number;
}

// 用户报表
export interface UserReport {
  period: DateRange;
  newUsers: number;
  totalUsers: number;
  avgDaily: number;
  trend: UserTrendItem[];
}

// 房源统计
export interface HomestayStats {
  id: string;
  title: string;
  price: number;
  rating: number;
  reviews: number;
  orderCount: number;
  completedOrders: number;
  revenue: number;
  bookingRate: number;
}

// 房源报表
export interface HomestayReport {
  period: DateRange;
  totalHomestays: number;
  totalOrders: number;
  totalRevenue: number;
  avgBookingRate: number;
  topByRevenue: HomestayStats[];
  topByOrders: HomestayStats[];
  all: HomestayStats[];
}

// 报表 API
export const reportsApi = {
  // 获取综合报表概览
  getOverview: (params?: { startDate?: string; endDate?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    return fetchApi<ReportOverview>(`/reports/overview?${queryParams.toString()}`);
  },
  
  // 获取收入报表
  getRevenue: (params?: { startDate?: string; endDate?: string; groupBy?: 'day' | 'week' | 'month' }) => {
    const queryParams = new URLSearchParams();
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    if (params?.groupBy) queryParams.append('groupBy', params.groupBy);
    return fetchApi<RevenueReport>(`/reports/revenue?${queryParams.toString()}`);
  },
  
  // 获取订单报表
  getOrders: (params?: { startDate?: string; endDate?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    return fetchApi<OrderReport>(`/reports/orders?${queryParams.toString()}`);
  },
  
  // 获取用户报表
  getUsers: (params?: { startDate?: string; endDate?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    return fetchApi<UserReport>(`/reports/users?${queryParams.toString()}`);
  },
  
  // 获取房源报表
  getHomestays: (params?: { startDate?: string; endDate?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    return fetchApi<HomestayReport>(`/reports/homestays?${queryParams.toString()}`);
  },
};

export { fetchApi, fetchAdminApi };
export type { Notification, NotificationListResponse };