import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Search, Eye, CheckCircle, Ban } from 'lucide-react';
import { orderApi, type Order } from '@/services/api';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface OrdersProps { type?: 'homestay' | 'car' | 'ticket' | 'dining'; }

const orderStatusMap: Record<string, { label: string; color: string }> = {
  pending: { label: '待确认', color: '#F59E0B' },
  confirmed: { label: '已确认', color: '#3B82F6' },
  completed: { label: '已完成', color: '#10B981' },
  cancelled: { label: '已取消', color: '#EF4444' },
};

const orderTypeMap: Record<string, { label: string; color: string }> = {
  homestay: { label: '民宿', color: '#C9A962' },
  car: { label: '租车', color: '#3B82F6' },
  ticket: { label: '票务', color: '#10B981' },
  dining: { label: '餐饮', color: '#F59E0B' },
};

export default function Orders({ type }: OrdersProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isActionDialogOpen, setIsActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<'confirm' | 'cancel' | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, [type]);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      const response = await orderApi.getAll(type ? { type } : undefined);
      setOrders(response.data);
    } catch (err) {
      console.error('Orders API Error:', err);
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch = order.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
      order.userName.toLowerCase().includes(searchQuery.toLowerCase()) || 
      order.itemName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleAction = (order: Order, action: 'confirm' | 'cancel') => { 
    setSelectedOrder(order); 
    setActionType(action); 
    setIsActionDialogOpen(true); 
  };

  const executeAction = async () => {
    if (!selectedOrder || !actionType) return;
    try {
      const newStatus = actionType === 'confirm' ? 'confirmed' : 'cancelled';
      await orderApi.updateStatus(selectedOrder.id, newStatus);
      setOrders((prev) => prev.map((o) => o.id === selectedOrder.id ? { ...o, status: newStatus } : o));
      setIsActionDialogOpen(false);
    } catch (err) {
      console.error('Action failed:', err);
      alert('操作失败: ' + (err instanceof Error ? err.message : '未知错误'));
    }
  };

  const getTypeTitle = () => { 
    if (!type) return '全部订单'; 
    return orderTypeMap[type]?.label + '订单'; 
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-champagne"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-semibold">{getTypeTitle()}</h1>
        <Button className="bg-champagne hover:bg-champagne-dark">导出订单</Button>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <Input placeholder="搜索订单号、用户或服务名称..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40"><SelectValue placeholder="订单状态" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="pending">待确认</SelectItem>
                <SelectItem value="confirmed">已确认</SelectItem>
                <SelectItem value="completed">已完成</SelectItem>
                <SelectItem value="cancelled">已取消</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {['pending', 'confirmed', 'completed', 'cancelled'].map((status) => (
          <Card key={status}>
            <CardContent className="p-4">
              <p className="text-sm text-gray-500">{orderStatusMap[status]?.label}</p>
              <p className="text-2xl font-semibold mt-1">{orders.filter((o) => o.status === status).length}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle>订单列表</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">订单号</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">用户</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">服务类型</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">服务名称</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">金额</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">下单时间</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">状态</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-gray-500">
                      暂无订单数据
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => (
                    <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm font-medium">{order.id}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-champagne/20 flex items-center justify-center text-champagne text-sm font-medium">
                            {order.userName.charAt(0)}
                          </div>
                          <span className="text-sm">{order.userName}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge style={{ backgroundColor: `${orderTypeMap[order.type]?.color}20`, color: orderTypeMap[order.type]?.color, border: 'none' }}>
                          {orderTypeMap[order.type]?.label}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">{order.itemName}</td>
                      <td className="py-3 px-4 text-sm font-medium">฿{order.totalPrice.toLocaleString()}</td>
                      <td className="py-3 px-4 text-sm text-gray-600">{order.createdAt}</td>
                      <td className="py-3 px-4">
                        <Badge style={{ backgroundColor: `${orderStatusMap[order.status]?.color}20`, color: orderStatusMap[order.status]?.color, border: 'none' }}>
                          {orderStatusMap[order.status]?.label}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <TooltipProvider>
                          <div className="flex items-center gap-1">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" onClick={() => { setSelectedOrder(order); setIsDetailOpen(true); }}><Eye size={16} /></Button>
                              </TooltipTrigger>
                              <TooltipContent><p>查看详情</p></TooltipContent>
                            </Tooltip>
                            {order.status === 'pending' && (
                              <>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" className="text-green-600" onClick={() => handleAction(order, 'confirm')}><CheckCircle size={16} /></Button>
                                  </TooltipTrigger>
                                  <TooltipContent><p>确认订单</p></TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" className="text-red-600" onClick={() => handleAction(order, 'cancel')}><Ban size={16} /></Button>
                                  </TooltipTrigger>
                                  <TooltipContent><p>取消订单</p></TooltipContent>
                                </Tooltip>
                              </>
                            )}
                          </div>
                        </TooltipProvider>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-500">共 {filteredOrders.length} 条记录</p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled>上一页</Button>
              <Button variant="outline" size="sm" className="bg-champagne text-white hover:bg-champagne-dark">1</Button>
              <Button variant="outline" size="sm" disabled>下一页</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>订单详情</DialogTitle><DialogDescription>查看订单详细信息</DialogDescription></DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-4 border-b"><span className="text-gray-500">订单号</span><span className="font-medium">{selectedOrder.id}</span></div>
              <div className="flex justify-between items-center"><span className="text-gray-500">用户</span><div className="flex items-center gap-2"><div className="w-6 h-6 rounded-full bg-champagne/20 flex items-center justify-center text-champagne text-xs">{selectedOrder.userName.charAt(0)}</div><span>{selectedOrder.userName}</span></div></div>
              <div className="flex justify-between items-center"><span className="text-gray-500">服务类型</span><Badge style={{ backgroundColor: `${orderTypeMap[selectedOrder.type]?.color}20`, color: orderTypeMap[selectedOrder.type]?.color, border: 'none' }}>{orderTypeMap[selectedOrder.type]?.label}</Badge></div>
              <div className="flex justify-between items-center"><span className="text-gray-500">服务名称</span><span>{selectedOrder.itemName}</span></div>
              <div className="flex justify-between items-center"><span className="text-gray-500">订单金额</span><span className="text-lg font-semibold text-champagne">฿{selectedOrder.totalPrice.toLocaleString()}</span></div>
              <div className="flex justify-between items-center"><span className="text-gray-500">下单时间</span><span>{selectedOrder.createdAt}</span></div>
              <div className="flex justify-between items-center"><span className="text-gray-500">订单状态</span><Badge style={{ backgroundColor: `${orderStatusMap[selectedOrder.status]?.color}20`, color: orderStatusMap[selectedOrder.status]?.color, border: 'none' }}>{orderStatusMap[selectedOrder.status]?.label}</Badge></div>
            </div>
          )}
          <DialogFooter><Button onClick={() => setIsDetailOpen(false)}>关闭</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isActionDialogOpen} onOpenChange={setIsActionDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{actionType === 'confirm' ? '确认订单' : '取消订单'}</DialogTitle><DialogDescription>{actionType === 'confirm' ? `确定要确认订单 "${selectedOrder?.id}" 吗？` : `确定要取消订单 "${selectedOrder?.id}" 吗？`}</DialogDescription></DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsActionDialogOpen(false)}>取消</Button>
            <Button className={actionType === 'confirm' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'} onClick={executeAction}>{actionType === 'confirm' ? '确认' : '取消订单'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
