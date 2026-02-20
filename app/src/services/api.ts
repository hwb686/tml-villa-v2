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

// Homestay API
export const homestayApi = {
  getAll: async (params?: { category?: string; location?: string; checkIn?: string; checkOut?: string; guests?: number }) => {
    if (FUNCTIONS_BASE) { return callFunction<Homestay[]>('get-homestays'); }
    const queryParams = new URLSearchParams();
    if (params?.category) queryParams.append('category', params.category);
    if (params?.location) queryParams.append('location', params.location);
    if (params?.checkIn) queryParams.append('checkIn', params.checkIn);
    if (params?.checkOut) queryParams.append('checkOut', params.checkOut);
    if (params?.guests) queryParams.append('guests', params.guests.toString());
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
  confirm: (id: string) => fetchApi<ConfirmResult>(`/bookings/${id}/confirm`, { method: 'PUT' }),
};

export const stockApi = {
  get: (homestayId: string, startDate: string, endDate: string) => 
    fetchApi<StockInfo[]>(`/homestays/${homestayId}/stock?startDate=${startDate}&endDate=${endDate}`),
  init: (homestayId: string, stockCount: number, days?: number) =>
    fetchApi<InitStockResult>(`/homestays/${homestayId}/init-stock`, { 
      method: 'POST', 
      body: JSON.stringify({ stockCount, days }) 
    }),
};

export const userApi = {
  login: (email: string, password: string) => fetchApi<{ token: string; user: User }>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  register: (data: RegisterData) => fetchApi<{ token: string; user: User }>('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  getMe: () => fetchApi<User>('/users/me'),
  getAll: () => fetchApi<User[]>('/users'),
  updateProfile: (data: Partial<User>) => fetchApi<User>('/users/me', { method: 'PUT', body: JSON.stringify(data) }),
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

// Types
export interface Category { id: string; label: { zh: string; en: string; th: string }; icon: string; sortOrder: number; isActive: boolean; }
export interface CreateCategoryData { label: { zh: string; en: string; th: string }; icon: string; sortOrder?: number; }
export interface Homestay { id: string; title: string; location: string; price: number; rating: number; reviews: number; images: string[]; type: string; guests: number; bedrooms: number; beds: number; bathrooms: number; amenities: string[]; host: { name: string; avatar: string; isSuperhost: boolean }; isFavorite: boolean; description?: string; coordinates?: { lat: number; lng: number }; }
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
export interface StockInfo { date: string; stockCount: number; }
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
export interface CarConfig { id: string; name: string; description?: string; image: string; price: number; carType: string; seats: number; isActive: boolean; sortOrder: number; createdAt: string; updatedAt: string; }
export interface CreateCarConfigData { name: string; description?: string; image: string; price: number; carType: string; seats: number; sortOrder?: number; isActive?: boolean; }
export interface CarRental { id: string; roomNumber: string; carConfig: { id: string; name: string; image: string; price: number; carType: string; }; startTime: string; endTime: string; days: number; totalPrice: number; remark?: string; status: 'PENDING' | 'CONFIRMED' | 'CANCELLED'; createTime: string; }
export interface CarRentalData { roomNumber: string; carConfigId: string; startTime: string; endTime: string; days: number; remark?: string; }
export { fetchApi };