export interface User { id: string; name: string; email: string; phone: string; avatar: string; registerTime: string; orderCount: number; status: 'active' | 'inactive'; }
export interface Order { id: string; userId: string; userName: string; userAvatar: string; type: 'homestay' | 'car' | 'ticket' | 'dining'; serviceName: string; amount: number; orderTime: string; status: 'pending' | 'confirmed' | 'processing' | 'completed' | 'cancelled'; }
export interface Merchant { id: string; name: string; type: 'homestay' | 'car' | 'ticket' | 'dining'; address: string; contact: string; price: number; status: 'active' | 'inactive'; createTime: string; }
export interface Transaction { id: string; type: 'income' | 'withdrawal' | 'refund'; amount: number; description: string; time: string; status: 'success' | 'pending' | 'failed'; }

export const mockUsers: User[] = [
  { id: 'U001', name: '张先生', email: 'zhang@example.com', phone: '+66 81-234-5678', avatar: 'Z', registerTime: '2026-01-15', orderCount: 5, status: 'active' },
  { id: 'U002', name: 'Sarah Johnson', email: 'sarah@example.com', phone: '+66 82-345-6789', avatar: 'S', registerTime: '2026-01-18', orderCount: 3, status: 'active' },
  { id: 'U003', name: '李女士', email: 'li@example.com', phone: '+66 83-456-7890', avatar: 'L', registerTime: '2026-01-20', orderCount: 8, status: 'active' },
  { id: 'U004', name: 'Mike Chen', email: 'mike@example.com', phone: '+66 84-567-8901', avatar: 'M', registerTime: '2026-01-22', orderCount: 2, status: 'inactive' },
];

export const mockOrders: Order[] = [
  { id: 'O20260212001', userId: 'U001', userName: '张先生', userAvatar: 'Z', type: 'homestay', serviceName: '曼谷市中心豪华公寓', amount: 3500, orderTime: '2026-02-12 09:30', status: 'completed' },
  { id: 'O20260212002', userId: 'U002', userName: 'Sarah Johnson', userAvatar: 'S', type: 'car', serviceName: '丰田凯美瑞 - 3天', amount: 4500, orderTime: '2026-02-12 10:15', status: 'processing' },
  { id: 'O20260212003', userId: 'U003', userName: '李女士', userAvatar: 'L', type: 'ticket', serviceName: '大皇宫门票 x2', amount: 1000, orderTime: '2026-02-12 11:00', status: 'confirmed' },
];

export const mockMerchants: Merchant[] = [
  { id: 'M001', name: '曼谷市中心豪华公寓', type: 'homestay', address: '曼谷素坤逸区', contact: '+66 2-123-4567', price: 3500, status: 'active', createTime: '2025-12-01' },
  { id: 'M002', name: '普吉岛海景别墅', type: 'homestay', address: '普吉岛芭东海滩', contact: '+66 76-234-5678', price: 12000, status: 'active', createTime: '2025-12-05' },
];

export const mockTransactions: Transaction[] = [
  { id: 'T20260212001', type: 'income', amount: 3500, description: '民宿订单 O20260212001', time: '2026-02-12 09:30', status: 'success' },
  { id: 'T20260212002', type: 'income', amount: 4500, description: '租车订单 O20260212002', time: '2026-02-12 10:15', status: 'success' },
];

export const dashboardStats = { todayOrders: 12, todayRevenue: 45600, newUsers: 8, pendingOrders: 5 };
export const revenueData = [
  { date: '02/06', amount: 32000 }, { date: '02/07', amount: 45000 }, { date: '02/08', amount: 38000 },
  { date: '02/09', amount: 56000 }, { date: '02/10', amount: 42000 }, { date: '02/11', amount: 52000 }, { date: '02/12', amount: 45600 },
];
export const orderTypeData = [
  { name: '民宿', value: 35, color: '#C9A962' }, { name: '租车', value: 28, color: '#B8944F' },
  { name: '票务', value: 22, color: '#E8D5A8' }, { name: '餐饮', value: 15, color: '#D4B896' },
];

export const orderStatusMap: Record<string, { label: string; color: string }> = {
  pending: { label: '待确认', color: '#FAAD14' }, confirmed: { label: '已确认', color: '#1890FF' },
  processing: { label: '进行中', color: '#722ED1' }, completed: { label: '已完成', color: '#52C41A' }, cancelled: { label: '已取消', color: '#F5222D' },
};
export const orderTypeMap: Record<string, { label: string; color: string }> = {
  homestay: { label: '民宿', color: '#C9A962' }, car: { label: '租车', color: '#1890FF' },
  ticket: { label: '票务', color: '#52C41A' }, dining: { label: '餐饮', color: '#722ED1' },
};
export const merchantTypeMap: Record<string, { label: string; color: string }> = {
  homestay: { label: '民宿', color: '#C9A962' }, car: { label: '租车', color: '#1890FF' },
  ticket: { label: '票务', color: '#52C41A' }, dining: { label: '餐饮', color: '#722ED1' },
};
